<?php


namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use English3\Controller\ClassesController;
use English3\Controller\Organization\OrganizationController;
use Guzzle\Http\Message\Response;
use Phinx\Util\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Serializer\Normalizer\GetSetMethodNormalizer;

class GroupController
{
    /**
     * @var Connection
     */
    private $read;

    public function __construct(Connection $read)
    {
        $this->read = $read;
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
            $this->userId = $_SESSION['USER']['ID'];
            $this->loggedIn = true;
        } else {
            $this->loggedIn = false;
        }
    }

    private function checkUser()
    {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
    }

    private function checkAdmin()
    {
        $id = $this->read->fetchAssoc("SELECT id from user_admin_super WHERE user_id = :user_id", ['user_id' => $this->userId]);
        if (!$id) {
            throw new BadRequestHttpException("Must be a super admin");
        }
    }
    public function setStartDate(Request $request,$classid,$id){
        Utility::clearPOSTParams($request);
        $startDate = $request->request->get('start_date');
        Utility::getInstance()->reader->update('groups',['start_date'=>$startDate],['id'=>$id]);
        $users = Utility::getInstance()->fetch(self::$queryGetUsers,['groupId'=>$id]);
        foreach($users as $user){
            if(boolval($user['is_student'])){
                GradebookController::_recalculate($user['userid'],null,$user['classid'],true);
            }
        }

        return new JsonResponse($request->request->all());
    }
    //create a new group for a class
    public function saveGroup(Request $request,$classid,$id){
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkTeacher($classid);
        Utility::getInstance()->reader->update('groups',[
            'classid'=>$request->request->get('classid'),
            'name'=>$request->request->get('name'),
            'start_date'=>$request->request->get('start_date'),
        ],['id'=>$id]);
        return new \Symfony\Component\HttpFoundation\Response('');
    }
    public function createGroup(Request $request,$classid){
        $util = new Utility($this->read);
        $orgId = ClassesController::_getOrgId($this->read,$classid);
        $this->checkUser();
        $util->checkAdmin($orgId);
        $body=json_decode($request->getContent());
        $name = $body->name;
        if(!$name){
            throw new BadRequestHttpException("Failed to get class id");
        }

        $this->read->insert('groups',[
            "classid"=>$classid,
            "name"=>$name
        ]);
        $last_id = $this->read->lastInsertId();
        return new JsonResponse([
            "id"=>$last_id,
            "name"=>$name,
            "classid"=>$classid
        ]);
    }
    //create groups for a class
    //request params can be used as filters
    public function getGroups(Request $request,$classid){
        $this->checkUser();
        $qb = $this->read->createQueryBuilder();
        $qb->select("g.id,g.classid,g.name,g.start_date");
        $qb->from("groups","g");
        $qb->leftJoin("g",'user_classes','uc','uc.groupid=g.id');
        $qb->groupBy('g.id');

        $and_cond = $qb->expr()->andx();
        if(isset($_REQUEST['id']))  $and_cond->add($qb->expr()->eq('g.id',$_REQUEST['id']));
        if(isset($_REQUEST['name']))  $and_cond->add($qb->expr()->eq('g.name',$qb->expr()->literal($_REQUEST['name'])));
        if(isset($_REQUEST['asTeacher']) && !Utility::getInstance()->checkAdmin(null,false,false))  {
           # $and_cond->add($qb->expr()->eq('uc.is_teacher',$qb->expr()->literal(1)));
            $and_cond->add($qb->expr()->orX('uc.is_teacher = 1','uc.is_test_admin = 1','uc.is_observer = 1'));

            $and_cond->add($qb->expr()->eq('uc.userid',$qb->expr()->literal($_SESSION['USER']['ID'])));
        }

        $and_cond->add($qb->expr()->eq('g.classid',$classid));

        $qb->andWhere($and_cond);
        $q = $qb->getSql();
        $stmt = $this->read->executeQuery($q);

        $groups = $stmt->fetchAll();
        if($_REQUEST['includeTestAdmins']){
            $this->includeGroupAdmins($groups);
        }
        return new JsonResponse($groups);
    }
    private function includeGroupAdmins(&$groups){
        foreach($groups as &$group){
            $group['admins']=$this->getGroupAdmins($group['id']);
        }
    }
    private function getGroupAdmins($groupId){
        return Utility::getInstance()->fetch(self::$queryGetTestAdmins,['groupId'=>$groupId]);
    }
    public function deleteGroup(Request $request,$classid,$id){
        $this->checkUser();
        $this->checkAdmin();
        $this->read->delete('groups',['id'=>$id]);
        return new JsonResponse(['status'=>'success']);
    }
    public function getGroup(Request $request,$classid,$groupid){
        $util = new Utility();
        $isStudent = $util->checkStudent($classid,OrganizationController::_getOrgFromClassId($classid),false);
        $isTeacher = $util->checkTeacher($classid,OrganizationController::_getOrgFromClassId($classid),false);
        if(!$isStudent && !$isTeacher){
            throw new HttpException(403, 'Permission denied');
        }

        $includeUsers = boolval($request->get('includeUsers'));
        return new JsonResponse(self::_getGroup($groupid,$includeUsers));
    }
    public static function _getGroup($groupid,$includeUsers=false){
        $util = new Utility();
        $group = $util->fetchRow(self::$queryGetGroup,['groupId'=>$groupid]);

        if($includeUsers){
            $group['users'] = $util->fetch(self::$queryGetUsers,['groupId'=>$groupid]);
        }
        return $group;
    }

    private static $queryGetGroup=<<<SQL
    SELECT * FROM
    groups WHERE id = :groupId
SQL;
    public static $queryGetClassGroup=<<<SQL
    SELECT * FROM
    groups WHERE id = :groupId and classid =:classId
SQL;
    public static $queryGetClassGroupByName=<<<SQL
    SELECT * FROM
    groups WHERE name = :groupName and classid =:classId
SQL;
    private static $queryGetUsers=<<<SQL
    SELECT user_classes.*,users.fname,users.lname,users.email FROM
    user_classes
    JOIN users on users.id = user_classes.userid
    WHERE groupid=:groupId
SQL;
    private static $queryGetTestAdmins=<<<SQL
    SELECT users.fname,users.lname,users.email,users.id,
    concat(users.fname,' ',users.lname,' (',users.email,')') as fullAddress
     FROM
    user_classes
    JOIN users on users.id = user_classes.userid
    WHERE groupid=:groupId and user_classes.is_test_admin = 1
SQL;



}
