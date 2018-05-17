<?php
/**
 * Created by IntelliJ IDEA.
 * User: ubuntu
 * Date: 13/12/17
 * Time: 15:06
 */

namespace English3\Controller\Organization;



use English3\Controller\GradebookController;
use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class ComplianceDashboard extends Dashboard {
    protected $orgFlag = 'compliance_dashboard';
    protected $roles = ['teacher','admin'];
    public function dashboardSettings()
    {
        return true;
    }

    public function getClassesResponse(Request $request){

        return new JsonResponse($this->getClasses($request->query->all()));
    }

    public function getClasses($params){
        $this->getMyRoles();
        $queryCtrl = new ClassesQuery();
        $queryInfo = $queryCtrl->getClassesQuery($this->myRoles);
        $term = @$params['term']?:'null';
        $paginator = Utility::paginator(str_replace('__term__',$term,$queryInfo['query']),$queryInfo['params']);
        return $paginator->getData(@$params['limit'],@$params['page']);
    }


    public function getUsersResponse(Request $request){

        return new JsonResponse($this->getUsers($request->query->all()));
    }
    public function getUsers($params){
        $this->getMyRoles();
        $queryCtrl = new UsersQuery();
        $queryInfo = $queryCtrl->getUsersQuery($this->myRoles);
        $term = @$params['term']?:'null';
        $paginator = Utility::paginator(str_replace('__term__',$term,$queryInfo['query']),$queryInfo['params']);
        return $paginator->getData(@$params['limit'],@$params['page']);
    }

    public function getUserResponse(Request $request,$userId){

        return new JsonResponse($this->getUser($userId));
    }

    public function getUser($userId){
        $queryCtrl = new UsersQuery();
        $data = Utility::getInstance()->fetch($queryCtrl->queryGetUser,['userId'=>$userId]);
        $user = ['name'=>$data[0]['name'],'email'=>$data[0]['email'],'rows'=>[]];
        foreach ($data as $row){
            $class = GradebookController::_wrapProgressReport($row);
            if($row['perc_completed_tasks']>=100){
                $class['status'] = 'Completed on ' . date('m/d/Y H:i:s',strtotime($this->getCompletedOn($row['userid'],$row['classid'])));
            }else{
                 $class['status'] = 'in progress';
            }
            $class['name']=$row['className'];
            $user['rows'][]=$class;
        }
        return ['item'=>$user];
    }
    private function getCompletedOn($userId,$classId){
        return Utility::getInstance()->fetchOne($this->queryCompletedOn,['classId'=>$classId,'userId'=>$userId]);
    }
    public function getClassResponse(Request $request,$classId){

        return new JsonResponse($this->getClass($classId));
    }

    public function getClass($classId){
        $queryCtrl = new ClassesQuery();
        $data = Utility::getInstance()->fetch($queryCtrl->queryGetClass,['classId'=>$classId]);
        $class = ['name'=>$data[0]['name'],'rows'=>[]];
        foreach ($data as $row){
            $user = GradebookController::_wrapProgressReport($row);
            if($row['perc_completed_tasks']>=100){
                $user['status'] = 'Completed on ' . date('m/d/Y H:i:s',strtotime($this->getCompletedOn($row['userid'],$row['classid']))) ;
            }else{
                $user['status'] = 'in progress';
            }
            $user['name']=$row['userName'];
            $class['rows'][]=$user;
        }
        return ['item'=>$class];
    }
    private $queryCompletedOn = <<<SQL
    SELECT submitted_on FROM gradebook g 
    JOIN pages p on p.id = g.pageid
    JOIN units u on u.id = p.unitid
    JOIN classes c on c.courseid = u.courseid
    WHERE g.userid = :userId and c.id = :classId order by g.submitted_on desc limit 1
SQL;


}
class UsersQuery{
    public function getUsersQuery($roles){

        if(in_array('super_admin',$roles)){
            return ['query'=>$this->queryGetUsers.$this->filterUsers.$this->groupUsers,'params'=>[]];
        }
        if(in_array('admin',$roles)){
            return ['query'=>$this->queryGetUsers.$this->filterOrgUsers.$this->groupUsers,'params'=>['orgId'=>$_SESSION['USER']['ORGID']]];
        }
        if(in_array('teacher',$roles)){
            return ['query'=>$this->queryGetUsers.$this->filterTeacherUsers.$this->groupUsers,'params'=>['userId'=>$_SESSION['USER']['ID']]];
        }
    }
    private $queryGetUsers = <<<SQL
    SELECT u.id, concat(u.fname,' ', u.lname) as name, u.email, sum(if(pr.perc_completed_tasks < 100 or pr.perc_completed_tasks is null,1,0)) as inProgress FROM users u
    JOIN user_classes uc on u.id = uc.userid
    join classes c on c.id = uc.classid
    JOIN progress_report pr on pr.classid = uc.classid and pr.userid = uc.userid
SQL;
    private $filterUsers = <<<SQL
    WHERE uc.is_student = 1 and if("__term__" != "null",concat(u.fname, ' ', u.lname) like "%__term__%",1)
SQL;
    private $filterOrgUsers = <<<SQL
    WHERE uc.is_student = 1 and u.organizationid = :orgId and if("__term__" != "null",concat(u.fname, ' ', u.lname) like "%__term__%",1)
SQL;
    private $filterTeacherUsers = <<<SQL
    JOIN user_classes tc on tc.classid = uc.classid
    WHERE uc.is_student = 1 and tc.is_teacher = 1 and tc.userid = :userId and if("__term__" != "null",concat(u.fname, ' ', u.lname) like "%__term__%",1)
SQL;

    private $groupUsers = <<<SQL
    GROUP BY u.id
    ORDER by u.lname
SQL;

    public $queryGetUser = <<<SQL
    SELECT distinct pr.*,
          c.name as className,
          concat(u.fname, ' ', u.lname) as name,
          u.email FROM 
    user_classes uc
    join users u on u.id = uc.userid
    join classes c on c.id = uc.classid
    join progress_report pr on c.id = pr.classid and pr.userid = uc.userid
    where uc.userid = :userId
SQL;

}
class ClassesQuery{
    public function getClassesQuery($roles){

        if(in_array('super_admin',$roles)){
            return ['query'=>$this->queryGetClasses.$this->filterClasses.$this->groupClasses,'params'=>[]];
        }
        if(in_array('admin',$roles)){
            return ['query'=>$this->queryGetClasses.$this->filterOrgClasses.$this->groupClasses,'params'=>['orgId'=>$_SESSION['USER']['ORGID']]];
        }
        if(in_array('teacher',$roles)){
            return ['query'=>$this->queryGetClasses.$this->filterTeacherClasses.$this->groupClasses,'params'=>['userId'=>$_SESSION['USER']['ID']]];
        }
    }
    private $queryGetClasses= <<<SQL
    SELECT c.id, c.name, sum(if(pr.perc_completed_tasks < 100 or pr.perc_completed_tasks is null,1,0)) as inProgress FROM users u
    JOIN user_classes uc on u.id = uc.userid
    join classes c on c.id = uc.classid
    JOIN progress_report pr on pr.classid = uc.classid and pr.userid = uc.userid
SQL;
    private $filterClasses = <<<SQL
    WHERE uc.is_student = 1 and if("__term__" != "null",c.name like "%__term__%",1)
SQL;
    private $filterOrgClasses = <<<SQL
    WHERE uc.is_student = 1 and u.organizationid = :orgId and if("__term__" != "null",c.name like "%__term__%",1)
SQL;
    private $filterTeacherClasses = <<<SQL
    JOIN user_classes tc on tc.classid = uc.classid
    WHERE uc.is_student = 1 and tc.is_teacher = 1 and tc.userid = :userId and if("__term__" != "null",c.name like "%__term__%",1)
SQL;

    private $groupClasses = <<<SQL
    GROUP BY c.id
    ORDER by c.name
SQL;

    public $queryGetClass = <<<SQL
    SELECT distinct pr.*,
          c.name,
          concat(u.fname, ' ', u.lname) as userName,
          u.email FROM 
    user_classes uc
    join users u on u.id = uc.userid
    join classes c on c.id = uc.classid
    join progress_report pr on c.id = pr.classid and pr.userid = uc.userid
    where uc.classid = :classId
SQL;
}