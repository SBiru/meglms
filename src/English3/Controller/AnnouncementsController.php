<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Organization\OrganizationController;
use SimpleXML;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AnnouncementsController{

    private $reader;
    private $me;
    private $util;

    public function __construct(Connection $reader) {
        $this->util = new Utility($reader);
        $this->reader = $reader;

    }

    //Permissions
    private function calcLoggedIn(){
        $this->me = UserController::me($this->reader);
        if(!$this->me){
            throw new HttpException(401, 'Not logged in');
        }
    }
    private function checkAdmin($orgId = null, $acceptOrgAdmin=true){
        $this->calcLoggedIn();
        if(!($this->me->amISuperUser() ||
            ($acceptOrgAdmin && $this->me->amIOrgAdmin($orgId))
        )){
            throw new HttpException(403, 'Must be an admin');
        }
    }
    private function checkTeacher($classid,$orgid){
        $this->calcLoggedIn();
        if(!$this->me->isTeacher($classid,true,$orgid)){
            throw new HttpException(403, 'Not a teacher for this class');
        }
    }


    public function loadStudents (Request $request,$id){
        $students = Utility::getInstance()->fetch($this->queryLoadStudents,['id'=>$id]);
        $allSelected = true;
        $anySelected = false;
        foreach ($students as &$user){
            $user['selected'] = boolval($user['selected']);
            $user['viewed'] = boolval($user['viewed']);

            if(!$user['selected']){
                $allSelected = false;
            }else{
                $anySelected = true;
            }

        }
        $allSelected = !$anySelected?true:$allSelected;
        return new JsonResponse(['students'=>$students,'allSelected'=>$allSelected]);
    }
    public function query (Request $request,$orgid){
        $this->calcLoggedIn();
        $today = new \DateTime();
        $today = date('Y-m-d H:i:s',$today->getTimestamp());
        $startIndex = $request->query->get('startIndex');
        if($startIndex==1){
            $startIndex = 0;
        }
        $limit = $request->query->get('limit');
        $term = $request->query->get('term');
        $term = $term?:'';
        if($this->me->amISuperUser() || $this->me->amIOrgAdmin($orgid)){

            $paginator = Utility::paginator($this->queryGetAnnouncementsByOrg,['orgId'=>$orgid,'date'=>$today,'term'=>'%'.$term.'%']);

            $pagData = $paginator->getData($limit,null,$startIndex);
            $data = &$pagData->data;


        }
        else{
            if($request->query->has('filter')){

            }
            $userId = $this->me->user->getUserId();
            $paginator = Utility::paginator($this->queryGetAnnouncementsForUser,['userId'=>$userId,'date'=>$today,'term'=>'%'.$term.'%']);
            $pagData = $paginator->getData($limit,null,$startIndex);
            $data = &$pagData->data;
        }
        foreach ($data as &$announcement){
            $announcement['addExpirationDate'] = boolval($announcement['expiration_date']);
            if($announcement['studentCount']){
                $announcement['students'] = Utility::getInstance()->fetch("SELECT concat(u.lname, ', ',u.fname) as name 
FROM users u join announcement_students s on s.studentid = u.id 
WHERE s.announcementid = ".$announcement['id']);
            }
        }
        return new JsonResponse($data);
    }
    public function queryGeneralAnnouncements(Request $request,$orgid){
        $today = new \DateTime();
        $today = date('Y-m-d',$today->getTimestamp());
        $data = $this->util->fetch($this->queryGetGeneralAnnouncementsForOrg,
            ['orgId'=>$orgid,'date'=>$today]
        );
        return new JsonResponse($data);
    }
    public function queryClassAnnouncements(Request $request,$orgid,$classid){
        $util = new Utility();
        $util->calcLoggedIn();
        $me = $util->me;

        $today = new \DateTime();
        $today = date('Y-m-d',$today->getTimestamp());
        if($classid =='all'){
            $classes = array();
            foreach($me->classes as $class){
                if($class['isStudent']  ){
                    $classid = $class['id'];

                    $data = $this->util->fetch($this->queryGetClassAnnouncementsForUser,
                        ['classId'=>$classid,'userId'=>$_SESSION['USER']['ID']]
                    );
                    $unViewed = 0;
                    foreach($data as &$row){
                        $row['isViewed']= boolval($row['isViewed']);
                        $row['addExpirationDate']= boolval($row['expiration_date']);
                        if(!$row['isViewed']){
                            $unViewed++;
                        }
                    }
                    $class['announcements']=$data;
                    $class['name']=$class['name'].' ('.$unViewed.')';
                    $class['unViewedAnnouncements']=$unViewed;
                    $classes[]=$class;
                }
            }
            return new JsonResponse($classes);
        }else{
            $data = $this->util->fetch($this->queryGetClassAnnouncementsForUser,
                ['classId'=>$classid,'userId'=>$_SESSION['USER']['ID']]
            );
            foreach($data as &$row){
                $row['isViewed']= boolval($row['isViewed']);
                $row['addExpirationDate']= boolval($row['expiration_date']);
            }
            return new JsonResponse($data);
        }

    }


    public function create (Request $request,$orgid)
    {

        $this->calcLoggedIn();
        Utility::clearPOSTParams($request);
        $text = $request->request->get('text');
        $classid =$request->request->get('classid');
        $expiration_date =$request->request->get('addExpirationDate')?$request->request->get('expiration_date'):null;
        $start_date =$request->request->get('addStartDate')?$request->request->get('start_date'):null;
        if (is_null($text) || $text == "") {
            throw new BadRequestHttpException('Announcement text is required');
        }

        if($request->request->get('allTeacherClasses')){
            $classes = $this->me->classesITeach();
            $classid=array();
            foreach($classes as $class){
                $classid[]=$class['id'];
            }
        }
        if($classes = $request->request->get('classes')){
            $classid = $classes;
        }

        if($classid){
            //if the classid is an array we are sure the user is teacher for all those classes (we just filtered above)
            if(gettype($classid)!=="array"){
                $this->checkTeacher($classid,$orgid);
            }
        }else{
            if(!count($classes)){
                $this->checkAdmin($orgid);
            }

        }
        if(!$classid && !$request->request->get('makeOrgLevel')){
            return Utility::buildHTTPError('Please select a class or make this announcement a school announcement');

        }

        return new JsonResponse($this->createFor($orgid, $text,$classid,$expiration_date,$start_date));



    }
    public function viewed (Request $request,$orgid,$id){
        $util = new Utility();
        $util->calcLoggedIn();
        $userId = $_SESSION['USER']['ID'];
        if($util->fetchOne($this->queryIsViewed,['id'=>$id,'userId'=>$userId])){
            $util->reader->delete(
                'announcements_viewed',
                [
                    'announcementid'=>$id,
                    'userid'=>$userId
                ]
            );
        }
        else{
            $util->reader->insert(
                'announcements_viewed',
                [
                    'announcementid'=>$id,
                    'userid'=>$userId
                ]
            );
        }
        return new JsonResponse(['ok'=>true]);
    }
    public function update (Request $request,$orgid,$id){
        Utility::clearPOSTParams($request);
        $body = json_decode($request->getContent());
        if (!isset($body->text) || $body->text == "") {
            throw new BadRequestHttpException('Announcement text is required');
        }

        $announcement = $this->util->fetch($this->queryGetAnnouncementsById,['id'=>$id]);

        if($announcement){
            $announcement=$announcement[0];

            if($orgid!=$announcement['orgid']){
                throw new BadRequestHttpException('Invalid orgid');
            }

            if($announcement['classid']){
                $this->checkTeacher($announcement['classid'],$announcement['orgid']);
            }
            else{
                $this->checkAdmin($orgid);
            }
            $body->expiration_date =$request->request->get('addExpirationDate')?$request->request->get('expiration_date'):null;
            $body->start_date =$request->request->get('addStartDate')?$request->request->get('start_date'):null;


            $this->reader->update('announcements',
                [
                   'text'=>$body->text,
                   'expiration_date'=>$body->expiration_date,
                   'start_date'=>$body->start_date,
                ],
                ['id'=>$id]);

            if(isset($body->studentIds) && count($body->studentIds)){
                $studentIds = $body->studentIds;
                $this->reader->delete('announcement_students',['announcementid'=>$id]);
                foreach ($studentIds as $studentId){
                    $this->reader->insert('announcement_students',[
                        'announcementid'=>$id,
                        'studentid'=>$studentId
                    ]);
                }
                $body->studentCount = count($body->studentIds);
            }else{
                $this->reader->delete('announcement_students',['announcementid'=>$id]);
            }

            return new JsonResponse($body);

        }
        else{
            throw new BadRequestHttpException('Invalid id');
        }
    }
    public function delete (Request $request,$orgid,$id){
        $announcement = $this->util->fetch($this->queryGetAnnouncementsById,['id'=>$id]);
        if($announcement){
            $announcement=$announcement[0];

            if($orgid!=$announcement['orgid']){
                throw new BadRequestHttpException('Invalid orgid');
            }

            if($announcement['classid']){
                $this->checkTeacher($announcement['classid'],$announcement['orgid']);
            }
            else{
                $this->checkAdmin($orgid);
            }

            $this->reader->delete('announcements',['id'=>$id]);
            return new JsonResponse("ok");
        }
        else{
            throw new BadRequestHttpException('Invalid id');
        }
    }


    private function createFor($orgid,$text,$classid=null,$expiration_date=null,$start_date=null,$studentIds=null){


        if(gettype($classid)=="array"){
            $data = array('announcments'=>array());
            foreach($classid as $class){
                if(gettype($class)=="array"){
                    $studentIds = $class['studentIds'];
                    $class= $class['id'];
                }
                $data['announcments'][]=$this->createFor($orgid,str_replace('\n','',$text),$class,$expiration_date,
                    $start_date,$studentIds);
            }
        }
        else{
            if($classid){
                $orgid = OrganizationController::_getOrgFromClassId($classid);
            }
            $data = [
                'classid'=>$classid,
                'orgid'=>$orgid,
                'text'=>$text,
                'created_by'=>$this->me->user->getUserId(),
                'expiration_date'=>$expiration_date,
                'start_date'=>$start_date,
            ];
            $this->reader->insert("announcements",$data);
            $data['id'] = $this->reader->lastInsertId();
            if($studentIds){
                foreach ($studentIds as $studentId){
                    $this->reader->insert('announcement_students',[
                        'announcementid'=>$data['id'],
                        'studentid'=>$studentId
                    ]);
                }
            }
        }

        return $data;
    }


    private $queryGetAnnouncementsByOrg = <<<SQL
        SELECT a.*,c.name as class_name, o.name as org_name, count(s.studentid) as studentCount
        FROM announcements a
         LEFT JOIN classes c on a.classid = c.id
         LEFT JOIN organizations o on a.orgid = o.id
         LEFT JOIN announcement_students s on s.announcementid = a.id
        WHERE a.orgid = :orgId 
        and (a.expiration_date is null or a.expiration_date>:date)
        and (a.text like :term or c.name like :term)
        group by a.id
        ORDER BY created desc
SQL;
    private $queryGetAnnouncementsForUser = <<<SQL
        SELECT a.*,c.name as class_name, o.name as org_name, count(s.studentid) as studentCount
        FROM announcements a
         LEFT JOIN user_classes uc on uc.classid = a.classid
         LEFT JOIN classes c on uc.classid = c.id
         LEFT JOIN organizations o on a.orgid = o.id
         LEFT JOIN announcement_students s on a.id = s.announcementid
         JOIN users on o.id = users.organizationid and users.id = :userId
        WHERE (uc.userid=:userId or (a.classid is null and users.organizationid = o.id)) and
        (a.expiration_date is null or now() <= a.expiration_date)
        and (a.text like :term or c.name like :term)
        group by a.id
        ORDER BY created desc
SQL;
    private $queryGetGeneralAnnouncementsForOrg = <<<SQL
        SELECT a.*,o.name as org_name
        FROM announcements a
         JOIN organizations o on a.orgid = o.id
         WHERE o.id=:orgId and a.classid is null and
        (a.expiration_date is null or a.expiration_date>:date)
        and (a.start_date is null or a.start_date<=:date)
        ORDER BY created desc;
SQL;
    private $queryGetClassAnnouncementsForUser= <<<SQL
        SELECT a.*,
        now(),
        if(now() >= a.start_date,1,0),
              if(av.announcementid,1,0) as isViewed,
              c.name as class_name
        FROM announcements a
         LEFT JOIN user_classes uc on uc.classid = a.classid
         LEFT JOIN classes c on uc.classid = c.id
         LEFT JOIN organizations o on a.orgid = o.id
         LEFT JOIN announcements_viewed av on a.id = av.announcementid and uc.userid = av.userid
         LEFT JOIN announcement_students s on a.id = s.announcementid
         JOIN users on o.id = users.organizationid and users.id = :userId
        WHERE uc.userid=:userId and uc.classid=:classId and
        if(s.studentid,s.studentid = users.id,1) and
        (a.expiration_date is null or now() <= a.expiration_date)
        and (a.start_date is null  or now() >= a.start_date)
        ORDER BY created desc;
SQL;
    private $queryGetAnnouncementsById = <<<SQL
        SELECT * FROM announcements where id = :id
SQL;
    private $queryIsViewed = <<<SQL
        SELECT * FROM announcements_viewed where announcementid = :id and userid = :userId
SQL;
    private $queryLoadStudents = <<<SQL
    SELECT 
    u.fname,
    u.lname,
    u.email,
    concat(u.lname, ', ',u.fname) as name,
    u.id,
    if(s.studentid,1,0) as selected,
    if(v.userid,1,0) as viewed,
    v.viewed_on as read_on
    FROM announcements a 
    JOIN user_classes uc on a.classid = uc.classid
    JOIN users u on u.id = uc.userid
    LEFT JOIN announcement_students s on s.announcementid = a.id and s.studentid = uc.userid
    LEFT JOIN announcements_viewed v on v.announcementid = a.id and v.userid = uc.userid
    WHERE uc.is_student = 1 and a.id = :id order by u.lname
SQL;

}
