<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.15.6
 * Time: 14:01
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\UserController;
use English3\Controller\Utility;

class NotLoggedIn extends Alert{
    private $days;
    private $students;
    private $classes;
    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $this->days = $this->params['D'];
        $this->getUsersNotLoggedIn($this->days);
    }

    public function sortBy($by)
    {
        if($by=='students'){
            return $this->students;
        }
        if($by == 'classes'){
            return $this->sortByClasses();
        }
    }
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'lastActivity','label'=>'Last Activity'],
        ];
    }
    public function getUsersNotLoggedIn($days){
        if($days!=='beginning'){
            $data = Utility::getInstance()->fetch($this->queryWithFilters(),['days'=>$days]);
        }else{
            $data = Utility::getInstance()->fetch($this->queryWithFilters(true));
        }

        $this->prepareData($data);
        return $this->students;
    }
    private function queryWithFilters($all = false){
        $query = $all?$this->queryGetUsersNotLoggedInSinceBeginning:$this->queryGetUsersNotLoggedIn;
        if($this->params['classIds']){
            $where = sprintf(" and concat(c.id,if(%s and uc.groupid,concat('-',uc.groupid),'')) in ('%s')",
                $this->params['allGroups']?:1,implode
            ("','",$this->params['classIds']));


            if($all){
                $query = $this->addClassFilterToQuery($query);
            }
        }
        else{
            $query = sprintf($query,'','%s');
            if(Utility::getInstance()->checkAdmin(null,true,false)){
                $orgId = (@$this->params['orgId'])?:$_SESSION['USER']['ORGID'];
                $where = $all?" and u.organizationid = ".$orgId:" and d.organizationid = ".$orgId;
            }else{
                if(Utility::isSiteAdmin()){
                    $user = new UserController();
                    $user->getAdvisees($_SESSION['USER']['ID']);
                    $ids = array_map(function($u){
                        return $u['id'];
                    },$user->advisees);
                    $where = sprintf(" and u.id in (%s) ",implode(',',$ids));
                }else{
                    $where = " and ua.userid = ".$_SESSION['USER']['ID'];
                }

            }
        }

        return sprintf($query,$where);
    }
    private function addClassFilterToQuery($query){
        return sprintf($query,$this->joinClassStatement,'%s');
    }
    private function prepareData($data){
        $this->students = array();
        foreach($data as $row){
            Utility::addToObjectIfNotExists($row['id'],$this->newStudentFromRow($row),$this->students);
            Utility::addToObjectIfNotExists($row['classId'],$this->newClassFromRow($row),$this->students[$row['id']]['classes']);
        }
    }
    private function sortByClasses(){
        $this->classes = array();
        foreach($this->students as $student){
            foreach($student['classes'] as $class){
                Utility::addToObjectIfNotExists($class['id'],$this->newClassFromStudentArray($class),$this->classes);
                Utility::addToObjectIfNotExists($student['id'],$this->newStudentFromStudentArray($student,$class),$this->classes[$class['id']]['students']);
            }
        }
        return $this->classes;
    }
    private function newStudentFromRow($row){
        return [
            'id'=>$row['id'],
            'fname'=>$row['fname'],
            'lname'=>$row['lname'],
            'name'=>$row['name'],
            'lastActivity'=>$row['time_in'],
            'createdOn'=>$row['created'],
            'classes'=>array()
        ];
    }
    private function newClassFromRow($row){
        return [
            'id'=>$row['classId'],
            'name'=>$row['className'],
            'lastActivity'=>$row['time_in']
        ];
    }
    private function newClassFromStudentArray($class){
        unset($class['lastActivity']);
        $class['students']= array();
        return $class;
    }
    private function newStudentFromStudentArray($student,$class){
        unset($student['classes']);
        $student['lastActivity']=$class['lastActivity'];
        return $student;
    }
    private $queryGetUsersNotLoggedIn = <<<SQL
    SELECT u.id,
    u.fname,
    u.lname,
    concat(u.lname,", ",u.fname) as name,
    c.name as className,
    c.id as classId,
    max(ah.time_in) as time_in,
	@hasLoggedIn:=sum(if(ah.time_in < DATE_SUB(DATE(NOW()), INTERVAL :days DAY),0,1)) as hasLoggedIn
    FROM activity_history ah
    JOIN users u ON ah.userid = u.id
    JOIN pages p on p.id = ah.pageid
    JOIN units ON units.id = p.unitid
    JOIN classes c ON c.courseid = units.courseid
    JOIN user_classes uc ON uc.classid = c.id and u.id = uc.userid
    JOIN courses co ON co.id = c.courseid
    JOIN departments d ON d.id = co.departmentid
    left join (select * from user_classes uc where uc.is_teacher = 1 group by userid) teacher on teacher.userid = u.id
    left join user_admin_organizations admin1 on admin1.userid = u.id
    left join user_admin_super admin2 on admin2.user_id = u.id
    LEFT JOIN user_advisors ua ON ua.studentid = u.id
	WHERE
	teacher.id is null and admin1.id is null and admin2.id is null and
	c.exclude_from_alerts = 0  %s
    GROUP BY u.id
    HAVING hasLoggedIn = 0
SQL;
    private $queryGetUsersNotLoggedInSinceBeginning = <<<SQL
    SELECT u.id,
    u.fname,
    u.lname,
    concat(u.lname,", ",u.fname) as name,
    u.created,
    '' as className,
    '' as classId,
    '' as time_in,
	0 as hasLoggedIn
    FROM users u 
    LEFT JOIN user_sessions us on us.userid = u.id
    LEFT JOIN user_advisors ua on u.id = ua.studentid
    %s
    WHERE
	1 and us.id is null
	%s
    GROUP BY u.id
SQL;
    private $joinClassStatement = <<<SQL
    JOIN user_classes uc on uc.userid = u.id
    join classes c on c.id = uc.classid
SQL;


}

