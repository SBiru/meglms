<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Chat\ChatMode;
use English3\Controller\Classes\UserClass;
use English3\Controller\Notifications\GradePostEmailNotification;
use English3\Controller\Organization\OrganizationController;
use Phinx\Migration\Util;
use SimpleXML;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class PostsController extends Permissions{



    public function __construct(Connection $reader) {
        parent::__construct($reader);

    }
    public static function sendEmailIfNeeded($message,$user_id,$reply_to_id,$post_id,$class_id,$is_teacher){
        if($post_id && $message=="successful"){
            if($is_teacher){
                if($reply_to_id){
                    $studentId = Utility::getInstance()->fetchOne("SELECT userid FROM posts WHERE id = $reply_to_id");
                    GradePostEmailNotification::sendIfNeeded($user_id,$studentId,$class_id,$post_id);
                }
            }else{
                //PostEmailNotification::sendIfNeeded($user_id,$class_id,$post_id);
            }

        }
    }
    //TODO: permissions for all methods
    /*
     * For now this function is used to know if we have added a fake post
     * for students in assignments that don't require submission.
     * This endpoint should later replace the 'post.php'
     */
    public function getPagePosts(Request $request,$pageId){
        $u = Utility::getInstance();
        $classId = ClassesController::_getFromPage($u->reader,$pageId);
        $u->checkTeacher($classId);

        $query = $request->query->has('studentId')?
            self::$getStudentPosts.' and posts.userid = '.$request->query->get('studentId'):
            self::$getStudentPosts;
        return new JsonResponse($u->fetch($query,['pageId'=>$pageId]));

    }
    public function countNeedingGrade(Request $request){
        $this->me = UserController::me($this->reader);
        $postCount = $this->util->fetchOne($this->queryCountPostsNeedingGradeForUser,['userId'=>$this->me->user->getUserId()],'needing_grade');
        $quizCount = $this->util->fetchOne($this->queryCountQuizNeedingGradeForUser,['userId'=>$this->me->user->getUserId()],'needing_grade');
        $forumCount = $this->util->fetchOne($this->queryCountForumNeedingGradeForUser,
            ['userId'=>$this->me->user->getUserId()],'needing_grade');
        return new JsonResponse(
            [ 'count'=> intval($postCount)+intval($quizCount) + intval($forumCount) ]
        );
    }

    public function countNoMenuNeedingGrade(Request $request){
        $this->me = UserController::me($this->reader);
        $count = self::_countNoMenuNeedingGrade();
        return new JsonResponse(
            [ 'count'=> intval($count)]
        );
    }
    public static function _countNoMenuNeedingGrade(){
        $count = Utility::getInstance()->fetchOne(self::$queryCountNoMenuNeedingGrade,['userId'=>$_SESSION['USER']['ID']]);
        return intval($count);

    }
    public function gradePostCountForClass(Request $request, $id){

    }

    public function needingGradeForClass(Request $request,$id){
        $rawData = $this->util->fetch($this->queryPostsNeedingGrade('class'),['classId'=>$id]);
        $quizQuery = $this->queryQuizzesNeedingGrade('class');
        $rawData = array_merge(
            $rawData,
            $this->util->fetch($quizQuery,['classId'=>$id])
        );

        if(is_null($rawData[0]['groupId'])){
            $units = array();
            foreach($rawData as $row){
                $this->groupByUnits($row,$units);
            }
            foreach($units as &$unit){
                foreach($unit['pages'] as &$page){
                    $page['users']=array_values($page['users']);
                }
                $unit['pages']=array_values($unit['pages']);
            }
            return new JsonResponse(['units'=>array_values($units)]);
        }else{
            $groups = array();
            foreach($rawData as $row){
                $this->groupByGroup($row,$groups);
            }
            foreach($groups as &$group){
                foreach($group['units'] as  &$unit){
                    foreach($unit['pages'] as $page){
                        $page['users']=array_values($page['users']);
                    }
                    $unit['pages']=array_values($unit['pages']);
                }
                $group['units']=array_values($group['units']);
            }

            return new JsonResponse(['groups'=>array_values($groups)]);
        }
    }
    
    public function needingGradeForPage(Request $request,$id){
        $rawData = $this->util->fetch($this->queryPostsNeedingGrade('page'),['pageId'=>$id]);
        $rawData = array_merge(
            $rawData,
            $this->util->fetch($this->queryQuizzesNeedingGrade('page'),['pageId'=>$id])
        );
        $users = array();

        foreach($rawData as $row){
            $this->groupByUsers($row,$users);
        }

        return new JsonResponse(array_values($users));
    }
    public function needingGradeForOrg(Request $request,$id){
        $rawData = $this->util->fetch($this->queryPostsNeedingGrade('org'),['orgId'=>$id]);
        $rawData = array_merge(
            $rawData,
            $this->util->fetch($this->queryQuizzesNeedingGrade('org'),['orgId'=>$id])
        );

        $classes = $this->groupByClass($rawData);

        //objects to arrays

        foreach($classes as &$class){

            if(isset($class['units'])){

                foreach($class['units'] as &$unit){
                    foreach($unit['pages'] as &$page){
                        $page['users']=array_values($page['users']);
                    }
                    $unit['pages']=array_values($unit['pages']);
                }
                $class['units'] = array_values($class['units']);
            }
            else{
                foreach($class['groups'] as &$group){
                    foreach($group['units'] as &$unit){
                        foreach($unit['pages'] as &$page){
                            $page['users']=array_values($page['users']);
                        }
                        $unit['pages']=array_values($unit['pages']);
                    }
                    $group['units'] = array_values($group['units']);
                }
                $class['groups']=array_values($class['groups']);
            }
        }
        return new JsonResponse(['classes'=>array_values($classes)]);
    }
    public static function canBeDeleted($postId){
        if($orgLevelPermission = OrganizationController::_canDeleteOwnPosts(OrganizationController::_getOrgFromPostId($postId))){
            $pageId = PageController::_getPageIdFromPost($postId);
            return !boolval(PageController::_getPageMeta($pageId,'cannot_delete_posts'));
        }else{
            return false;
        }

    }
    public function resubmissions(Request $resquest,$classId){
        $u = Utility::getInstance();
        $u->checkTeacher($classId);

        $data = $u->fetch(self::$queryGetClassResubmissions,['classId'=>$classId]);
        $pages=array();
        foreach($data as $entry) {
            if (!array_key_exists($entry['pageId'], $pages)) {
                $pages[$entry['pageId']]=array(
                    'id'=>$entry['pageId'],
                    'name'=>$entry['pageName'],
                    'total'=>0,
                    'resubmissionPercentage'=>0,
                    'students'=>array()
                );

            }
            $total=&$pages[$entry['pageId']]['total'];
            $perc=&$pages[$entry['pageId']]['resubmissionPercentage'];
            $students = &$pages[$entry['pageId']]['students'];
            $students[]=array(
                'id' => $entry['studentId'],
                'first_name' => $entry['fname'],
                'last_name' => $entry['lname'],
                'name' => $entry['lname'] . ', ' . $entry['fname'],
                'fullName' => $entry['fname'] . ' ' . $entry['lname'],
                'submissions'=> intval($entry['submissions'])
            );
            $total+=intval($entry['submissions']);
            $perc+=intval($entry['submissions'])-1;

        }
        foreach($pages as &$page){
            $page['students']=array_values($page['students']);
            $page['resubmissionPercentage']=round($page['resubmissionPercentage']*100/$page['total']);
            $page['avg']=round($page['total']/count($page['students']),1);
        }
        return new JsonResponse(['pages'=>array_values($pages)]);
    }
    public static function _countNeedingGradeForClasses($classIds){
        $util = new Utility();
        $postCountData = $util->reader->fetchAll(self::$queryCountPostsNeedingGradeForClasses,['classes'=>$classIds],['classes'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]);
        $quizCountData = $util->reader->fetchAll(self::$queryCountQuizNeedingGradeForClasses,['classes'=>$classIds],['classes'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]);
        $journalCountData = $util->reader->fetchAll(self::$queryCountJournalNeedingGradeForClasses,['classes'=>$classIds],['classes'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]);
        $forumCountData = $util->reader->fetchAll(self::$queryCountForumNeedingGradeForClasses,['classes'=>$classIds],
            ['classes'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]);

        $totalCountData = array_merge($postCountData,$quizCountData,$journalCountData,$forumCountData);

        $classes = array();
        foreach($totalCountData as $row ){
            if(!isset($classes[$row['classId']])){
                $classes[$row['classId']]=array('count'=>0);
            }
            $class = &$classes[$row['classId']];
            if(!is_null($row['groupId'])){

                unset($classes[$row['classId']]['count']);

                if(!isset($class['groups'])){
                    $class['groups']=array();
                }
                if(!isset($class['groups'][$row['groupId']])){
                    $class['groups'][$row['groupId']]=array(
                        'count'=>0,
                        'id'=>$row['groupId'],
                        'name'=>$row['groupName']
                    );
                }
                $class['groups'][$row['groupId']]['count']+=intval($row['needing_grade']);

            }
            else{
                $class['count']+=intval($row['needing_grade']);
            }
        }

        return $classes;
    }
    public static function _getTotalUserPostsForPage($pageId,$userId){
        $util = new Utility();
        return $util->fetchOne(self::$queryGetTotalUserPostsForPage,['pageId'=>$pageId,'userId'=>$userId]);
    }
    public static function _getFromGradePost(Connection $reader,$id){
        $util = new Utility($reader);
        $post = $util->fetchRow(self::$queryGetRootPostFromGradePost,['gradePostId'=>$id]);
        return $post;
    }
    public static function _get(Connection $reader,$id){
        $util = new Utility($reader);
        $post = $util->fetchRow(self::$queryGetPost,['postId'=>$id]);
        return $post;
    }
    private function groupByUsers($row,&$users){
        if(!isset($users[$row['userId']])){
            $users[$row['userId']]=array(
                'id'=>$row['userId'],
                'fname'=>$row['fname'],
                'lname'=>$row['lname'],
                'email'=>$row['email'],
                'posts'=>array()
            );
        }
        //TODO: add post/quiz info
        $users[$row['userId']]['posts'][]=array(
            'id'=>$row['postId'],
        );
    }

    private function groupByPages($row,&$pages){
        if(!isset($pages[$row['pageId']])){
            $pages[$row['pageId']] = array(
                'id'=>$row['pageId'],
                'name'=>$row['pageName'],
                'layout'=>$row['layout'],
                'users'=>array()
            );
        }
        $this->groupByUsers($row,$pages[$row['pageId']]['users']);
    }
    private function groupByUnits($row,&$units){

        if(!isset($units[$row['unitId']])){
            $units[$row['unitId']] = array(
                'id'=>$row['unitId'],
                'name'=>$row['unitName'],
                'description'=>$row['unitDescription'],
                'pages'=>array()
            );
        }
        $this->groupByPages($row,$units[$row['unitId']]['pages']);
    }
    private function groupByGroup($row,&$groups){
        if(!isset($groups[$row['groupId']]))
        {
            $groups[$row['groupId']]=array(
                'id'=>$row['groupId'],
                'name'=>$row['groupName'],
                'units'=>array()
            );
        }

        $this->groupByUnits($row,$groups[$row['groupId']]['units']);
    }
    private function groupByClass($rawData){
        $classes=array();
        foreach($rawData as $row){
            if(!isset($classes[$row['classId']])){
                $classes[$row['classId']] = array(
                    'id'=>$row['classId'],
                    'name'=>$row['className'],
                    'units'=>array()
                );
            }

            if(!is_null($row['groupId'])){
                unset($classes[$row['classId']]['units']);
                if(!isset($classes[$row['classId']]['groups'])) {
                    $classes[$row['classId']]['groups']=array();
                }
                $this->groupByGroup($row,$classes[$row['classId']]['groups']);
            }else{
                $this->groupByUnits($row,$classes[$row['classId']]['units']);
            }
        }
        return $classes;
    }
    public static function getPageLatestGrade($pageId,$userId){
        return Utility::getInstance()->fetchOne(self::$queryGetPageLatestGrade,['pageId'=>$pageId,'userId'=>$userId]);
    }
    public static function _getContentPosts($pageId,$classId,$groupId=0,$archive=false,UserController $me = null){
        $util = new Utility();

        $groupId = $groupId?$groupId:0;

        if(is_null($me)){
            $me = UserController::me($util->reader);
        }

        if($util->checkTeacher($classId,OrganizationController::_getOrgFromClassId($classId),false)){
            $archive=intval($archive);
            return $util->fetch(self::$queryGetContentPostsAsTeacher,['classId'=>$classId,'pageId'=>$pageId,'groupId'=>$groupId,'archive'=>$archive]);
        }else{
            //only teachers can see the archived posts
            if($archive){
                return [];
            }
            if(isset($me->preferences['is_private_student']) && boolval($me->preferences['is_private_student'])){
                return $util->fetch(self::$queryGetContentPostsAsPrivateStudent,['classId'=>$classId,'pageId'=>$pageId,'userId'=>$me->user->getUserId(),'groupId'=>$groupId]);
            }
            else{
                return $util->fetch(self::$queryGetContentPostsAsStudent,['classId'=>$classId,'pageId'=>$pageId,'groupId'=>$groupId]);
            }
        }
    }
    public static function canViewMessageButton($classId,$userId){
        $chatMode = ClassesController::getClassField($classId,'chat_mode_code');
        $roles = UserClass::getUserClass($userId,$classId);
        if($roles['is_teacher'] || $roles['is_edit_teacher'] || ($isAdmin = Utility::getInstance()->checkAdmin(null,true,false))){
            return $chatMode != ChatMode::disabled;
        }else{
            return $chatMode == ChatMode::all;
        }
    }
    //QUERY quiz needing grade
    public function queryQuizzesNeedingGrade($for='org'){
        $qb = $this->reader->createQueryBuilder();
        $qb->select("
          units.id as unitId,
          units.name as unitName,
          units.description as unitDescription,
          pages.id as 'pageId',
          pages.pagegroupid as 'header_id',
          pages.layout,
          pages.name as 'pageName',
          pages.subtitle,
          quiz_scores.max_points,
          pages.allow_video_post,
          pages.allow_text_post,
          pages.allow_upload_post,
          classes.id as classId,
          classes.name as className,
          users.id as userId,
          users.fname,
          users.lname,
          users.email,
          groups.id as groupId,
          groups.name as groupName,
          '' as postId
          ");
        $qb->from("
            quiz_responses
            join quiz_scores on quiz_responses.user_id=quiz_scores.user_id and quiz_responses.quiz_id=quiz_scores.quiz_id
            join users on quiz_scores.user_id = users.id
            join pages on quiz_responses.quiz_id = pages.id
            join units on pages.unitid = units.id
            join classes on units.courseid = classes.courseid
            join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
            left join groups on user_classes.groupid = groups.id
            join courses on classes.courseid = courses.id
            join departments on departments.id = courses.departmentid
        ");
        $qb->where(
            "user_classes.is_student=1 and
            user_classes.is_teacher=0 and
            quiz_responses.is_correct=-1 and
            users.is_active=1
            AND if(pages.can_return=1 and quiz_scores.attempt_id = quiz_responses.attempt_id,quiz_scores.is_finished=1,1)"
        );
        if($for=='org'){
            $qb->andWhere("departments.organizationid=:orgId");
        }
        else if($for=='class'){
            $qb->andWhere("classes.id=:classId");
        }
        else if($for=='page'){
            $qb->andWhere("pages.id=:pageId");
        }
        $qb->groupBy('pages.id,users.id');
        return $qb->getSQL();
    }

    private function queryPostsNeedingGrade($for='org'){
        $qb = $this->reader->createQueryBuilder();
        $qb->select("
          units.id as unitId,
          units.name as unitName,
          units.description as unitDescription,
          pages.id as 'pageId',
          pages.pagegroupid as 'header_id',
          pages.layout,
          pages.name as 'pageName',
          pages.subtitle,
          class_assignments.points as 'max_points',
          pages.allow_video_post,
          pages.allow_text_post,
          pages.allow_upload_post,
          classes.id as classId,
          classes.name as className,
          users.id as userId,
          users.fname,
          users.lname,
          users.email,
          groups.id as groupId,
          groups.name as groupName,
          posts.id as postId
        ");
        $qb->from("
        posts
        join users on posts.userid = users.id
        join pages on posts.pageid = pages.id
        join units on pages.unitid = units.id
        join classes on units.courseid = classes.courseid
        join user_classes on user_classes.userid = users.id and user_classes.classid=classes.id
        left join groups on groups.id = user_classes.groupid
        join courses on classes.courseid = courses.id
        join departments on departments.id = courses.departmentid
        LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
        LEFT JOIN class_assignments on class_assignments.page_id = pages.id
        ");
        $qb->where("
        (pages.layout = 'CONTENT' OR pages.layout = 'TIMED_REVIEW')
        AND posts.is_teacher=0
        AND posts.is_deleted=0
        AND posts.id = posts.postrootparentid
        AND pages.is_gradeable=1

        AND grade_posts.id IS NULL
        ");
        if($for=='org'){
            $qb->andWhere("departments.organizationid=:orgId");
        }
        else if($for=='class'){
            $qb->andWhere("classes.id=:classId");
        }
        else if($for=='page'){
            $qb->andWhere("pages.id=:pageId");
        }

        return $qb->getSQL();
    }



//Query for count POSTS needing grade for classses
    private static $queryCountPostsNeedingGradeForClasses = <<<SQL
      SELECT count(posts.id) as needing_grade,
      posts.classid as classId,posts.groupid as groupId,groups.name as groupName
          FROM posts
          JOIN users on users.id = posts.userid
          JOIN pages on pages.id = posts.pageid
		  JOIN units on units.id = pages.unitid
		  LEFT JOIN groups on posts.groupid = groups.id
		  join classes on units.courseid = classes.courseid
		  join user_classes on user_classes.userid = users.id and user_classes.classid=classes.id
          LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
        WHERE
        posts.is_teacher=0
        AND posts.is_deleted=0
        AND posts.id = posts.postrootparentid
        AND grade_posts.id IS NULL
        AND (pages.layout!='JOURNAL' or pages.journal_grading_type=0)
        AND posts.classid in (:classes)
        AND pages.is_gradeable=1
    GROUP BY posts.classid,posts.groupid
SQL;
    //Query for count POSTS needing grade for classses
    private static $queryCountJournalNeedingGradeForClasses = <<<SQL
      SELECT count(last_post.id) as needing_grade,
      last_post.classid as classId,last_post.groupid as groupId,groups.name as groupName from
        (select posts.id,pageid,userid,groupid,posts.created,classid from posts
        join (select max(posts.id) id from posts
        join pages on posts.pageid = pages.id
        where posts.classid in (:classes)
        and pages.layout='JOURNAL'
        and pages.journal_grading_type=1
        and posts.is_teacher=0
        group by posts.pageid,posts.classid,posts.groupid,posts.userid)
        last_post on last_post.id=posts.id
        ) last_post
        left join
        (select pageid,userid,groupid,gp.created from posts
        join pages on posts.pageid = pages.id
        left join grade_posts gp ON gp.post_id = posts.id
        where posts.classid in (:classes)
        and pages.layout='JOURNAL'
        and pages.journal_grading_type=1
        and posts.is_teacher=0
        and gp.id is not null) grade on grade.pageid=last_post.pageid and grade.userid=last_post.userid and (grade.groupid=last_post.groupid or (grade.groupid is null and last_post.groupid is null))
        LEFT JOIN groups on last_post.groupid = groups.id
        where last_post.created>grade.created or grade.created is null
SQL;
//Query for count FORUM needing grade for classses
    private static $queryCountForumNeedingGradeForClasses = <<<SQL
      SELECT count(distinct users.id) as needing_grade,
      classes.id as classId,null as groupId,'' as groupName 
      FROM pages
        join units on pages.unitid = units.id
        join classes on units.courseid = classes.courseid
        join users on 1 = 1
        join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
        join forums f on f.pageid = pages.id 
        join forum_posts fp on fp.forumid = f.id and fp.userid = users.id
        left join forum_posts_grade g on fp.id = g.postid 
    WHERE
        classes.id in (:classes)
        AND user_classes.is_student=1 and user_classes.is_teacher=0
        AND pages.layout = 'FORUM'
        AND pages.is_gradeable = 1
        AND fp.rootid > 0
        AND g.id is null
       group by classes.id
SQL;
//Query for count POSTS needing grade
    private $queryCountPostsNeedingGradeForUser = <<<SQL
      SELECT count(posts.id) as needing_grade
          FROM
          posts
          JOIN users on users.id = posts.userid
          JOIN pages on pages.id = posts.pageid
          JOIN user_classes student_classes on student_classes.classid = posts.classid and posts.userid = student_classes.userid
          JOIN (select * FROM user_classes GROUP by classid,userid,groupid) uc on uc.classid=posts.classid and if(uc.groupid is not null,uc.groupid=posts.groupid,1)
          LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
        WHERE
        posts.is_teacher=0
        AND posts.is_deleted=0
        AND posts.id = posts.postrootparentid
        AND pages.is_gradeable=1
        AND grade_posts.id IS NULL
        AND uc.userid = :userId
        AND uc.is_teacher=1
SQL;


//Query for count QUIZZES needing grade for classes
    private static $queryCountQuizNeedingGradeForClasses = <<<SQL
      select count(distinct qr.quiz_id,qr.user_id,qr.attempt_id) as needing_grade,
      uc.classid as classId,uc.groupid as groupId,groups.name as groupName
      from
        quiz_responses qr
        join pages p on qr.quiz_id = p.id
        join units u on p.unitid = u.id
        join classes c on u.courseid = c.courseid
        join quiz_scores qs on qr.quiz_id = qs.quiz_id and qs.user_id = qr.user_id
        join (select * from user_classes WHERE is_student = 1 group by userid,classid) uc on uc.userid = qr.user_id and c.id = uc.classid
        left join groups on uc.groupid = groups.id
        where
        is_correct = -1
        and if(p.can_return=1 and qs.attempt_id = qr.attempt_id,qs.is_finished=1,1)
        and uc.is_student=1 and uc.is_teacher=0
        and c.id in (:classes)
        GROUP BY uc.classid,uc.groupid
SQL;
//Query for count QUIZZES needing grade
    private $queryCountQuizNeedingGradeForUser = <<<SQL
      select count(distinct qr.quiz_id,qr.user_id)  as needing_grade from
        quiz_responses qr
        join pages p on qr.quiz_id = p.id
        join units u on p.unitid = u.id
        join classes c on u.courseid = c.courseid
        join (select * FROM user_classes WHERE is_teacher = 1 GROUP by classid,userid,groupid) teacher on teacher.classid=c.id
        join (select * from user_classes group by userid,classid,groupid) uc on uc.userid = qr.user_id and c.id = uc.classid and if(teacher.groupid is not null,teacher.groupid=uc.groupid,1)
        join quiz_scores qs on qs.quiz_id=qr.quiz_id and qr.user_id =qs.user_id
        where
        is_correct = -1
        and uc.is_student=1 and uc.is_teacher=0
        and if(p.can_return and qs.attempt_id = qr.attempt_id ,qs.is_finished=1,1)
        and teacher.is_teacher=1 and teacher.userid= :userId;
SQL;
    private $queryCountForumNeedingGradeForUser = <<<SQL
     SELECT count(distinct users.id,f.pageid) as needing_grade,
      classes.id as classId,null as groupId,'' as groupName 
      FROM pages
        join units on pages.unitid = units.id
        join classes on units.courseid = classes.courseid
        join users on 1 = 1
        join user_classes on users.id = user_classes.userid and user_classes.classid = classes.id
        join user_classes teacher on teacher.classid = classes.id
        join forums f on f.pageid = pages.id 
        join forum_posts fp on fp.forumid = f.id and fp.userid = users.id
        left join forum_posts_grade g on fp.id = g.postid 
    WHERE
        teacher.is_teacher = 1 and teacher.userid = :userId
        AND user_classes.is_student=1 and user_classes.is_teacher=0
        AND pages.layout = 'FORUM'
        AND pages.is_gradeable = 1
        AND fp.rootid > 0
        AND g.id is null
SQL;
    private static $queryCountNoMenuNeedingGrade = <<<SQL
    SELECT count(distinct userid,classid)
     from (SELECT distinct posts.userid,posts.classid
          FROM
          posts
          JOIN users on users.id = posts.userid
          JOIN pages on pages.id = posts.pageid
          join proficiency_classes pc on pc.classid = posts.classid
          JOIN user_classes student_classes on student_classes.classid = posts.classid and posts.userid = student_classes.userid
          JOIN (select * FROM user_classes GROUP by classid,userid,groupid) uc on uc.classid=posts.classid and if(uc.groupid is not null,uc.groupid=posts.groupid,1)
          LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
        WHERE
        posts.is_teacher=0
        AND posts.is_deleted=0
        AND posts.id = posts.postrootparentid
        AND pages.is_gradeable=1
        AND grade_posts.id IS NULL
        AND uc.userid = :userId
        AND uc.is_teacher=1
    UNION
    select distinct qr.user_id as userid,c.id as classid from
        quiz_responses qr
        join pages p on qr.quiz_id = p.id
        join units u on p.unitid = u.id
        join classes c on u.courseid = c.courseid
        join proficiency_classes pc on pc.classid = c.id
        join (select * FROM user_classes WHERE is_teacher = 1 GROUP by classid,userid,groupid) teacher on teacher.classid=c.id
        join (select * from user_classes group by userid,classid,groupid) uc on uc.userid = qr.user_id and c.id = uc.classid and if(teacher.groupid is not null,teacher.groupid=uc.groupid,1)
        join quiz_scores qs on qs.quiz_id=qr.quiz_id and qr.user_id =qs.user_id
        where
        is_correct = -1
        and uc.is_student=1 and uc.is_teacher=0
        and if(p.can_return and qs.attempt_id = qr.attempt_id ,qs.is_finished=1,1)
        and teacher.is_teacher=1 and teacher.userid= :userId
        ) a
SQL;

    //QUERY: get post
    private static $queryGetRootPostFromGradePost = <<<SQL
    SELECT p.*
    FROM grade_posts gp
    JOIN posts p on p.postrootparentid = gp.post_id
    WHERE gp.id = :gradePostId
SQL;
    //QUERY: get post
    public static $queryGetPost = <<<SQL
    SELECT p.*
    FROM posts p
    WHERE p.id = :postId
SQL;
    private static $queryGetTotalUserPostsForPage = <<<SQL
    SELECT count(*)
    FROM posts p
    WHERE p.pageid = :pageId and userid = :userId and is_deleted = 0 and is_teacher=0
SQL;
    private static $queryGetContentPostsAsTeacher = <<<SQL
    SELECT posts.id,
          posts.post_reply_id,
          posts.postrootparentid,
          posts.fileuploadid,
          posts.video_url,
          posts.video_thumbnail_url,
          posts.upload_url,
          posts.upload_file_name,
          posts.message,
          posts.is_private,
          posts.is_teacher,
          posts.classid,
          posts.created,
          users.id as 'user_id',
          users.fname,
          users.lname,
          gp.id as 'gradeId',
          gp.grade,
          pages.rubricid,
          pages.allow_video_post
      FROM posts
      JOIN users ON (posts.userid=users.id)
      LEFT JOIN grade_posts gp ON posts.is_private = 1 AND gp.teacher_post_id = posts.id
      JOIN pages ON pages.id = posts.pageid
      WHERE (posts.classid=:classId AND
      posts.pageid=:pageId AND
      posts.teacher_feedback=0 AND
      posts.is_deleted=:archive and
      (posts.groupid=:groupId or posts.groupid is null) )
      ORDER BY posts.id DESC
SQL;
    private static $queryGetContentPostsAsStudent = <<<SQL
    SELECT posts.id,
          posts.post_reply_id,
          posts.postrootparentid,
          posts.fileuploadid,
          posts.video_url,
          posts.video_thumbnail_url,
          posts.upload_url,
          posts.upload_file_name,
          posts.message,
          posts.is_private,
          posts.is_teacher,
          posts.classid,
          posts.created,
          users.id as 'user_id',
          users.fname,
          users.lname,
          gp.id as 'gradeId',
          gp.grade,
          pages.rubricid,
          pages.allow_video_post
      FROM posts
      LEFT JOIN grade_posts gp ON posts.is_private = 1 AND gp.teacher_post_id = posts.id
      JOIN pages ON pages.id = posts.pageid
      JOIN users ON (posts.userid=users.id)
      LEFT JOIN user_preferences up on up.user_id = users.id and up.preference = 'is_private_student'
      WHERE
      (posts.classid=:classId
      AND posts.pageid=:pageId
      AND posts.teacher_feedback=0
      AND (up.value != 1 or up.value is null)
      AND posts.is_deleted=0
      and (posts.groupid=:groupId or posts.groupid is null))
      ORDER BY posts.id DESC
SQL;
    private static $queryGetContentPostsAsPrivateStudent = <<<SQL
    SELECT posts.id,
          posts.post_reply_id,
          posts.postrootparentid,
          posts.fileuploadid,
          posts.video_url,
          posts.video_thumbnail_url,
          posts.upload_url,
          posts.upload_file_name,
          posts.message,
          posts.is_private,
          posts.classid,
          posts.is_teacher,
          posts.created,
          users.id as 'user_id',
          users.fname,
          users.lname,
          gp.id as 'gradeId',
          gp.grade,
          pages.rubricid,
          pages.allow_video_post
      FROM posts
      LEFT JOIN grade_posts gp ON posts.is_private = 1 AND gp.teacher_post_id = posts.id
      JOIN pages ON pages.id = posts.pageid
      JOIN users ON (posts.userid=users.id)
      LEFT JOIN user_preferences up on up.user_id = users.id and up.preference = 'is_private_student'
      WHERE
      (posts.classid=:classId
      AND posts.pageid=:pageId
      AND posts.teacher_feedback=0
      AND (posts.userid = :userId or posts.is_teacher=1)
      AND posts.is_deleted=0
      and (posts.groupid=:groupId or posts.groupid is null) )
      ORDER BY posts.id DESC
SQL;
    public static $getStudentPosts=<<<SQL
      SELECT posts.*,
          gp.id as feedbackId,
          gp.grade,
          tp.message as teacherMessage,
          tp.id as teacherPostId,
          tp.video_thumbnail_url as teacherThumbnailUrl,
          tp.video_url as teacherVideoUrl,
          tp.created as teacherCreated,
          concat(t.fname,' ',t.lname) as teacherName
      FROM posts
      LEFT JOIN grade_posts gp ON gp.post_id = posts.id
      LEFT JOIN posts tp ON gp.teacher_post_id = tp.id
      LEFT JOIN users t ON tp.userid = t.id
      WHERE
      posts.is_teacher=0 and posts.pageid=:pageId
SQL;
    public static $queryGetClassResubmissions=<<<SQL
    SELECT
        pg.name as pageName,
        pg.id as pageId,
        s.fname,
        s.lname,
        s.id as studentId,
        count(distinct p.postrootparentid) as submissions
    FROM posts p
    JOIN pages pg ON pg.id = p.pageid
    JOIN units u ON u.id = pg.unitid
    JOIN classes cl ON cl.courseid = u.courseid
    JOIN users s ON s.id = p.userid
    WHERE cl.id = :classId and p.is_teacher=0 and p.id = p.postrootparentid
    GROUP BY pg.id,s.id
SQL;
    public static $queryGetPageLatestGrade = <<<SQL
      SELECT grade_posts.grade FROM
       posts
       JOIN grade_posts ON posts.id = grade_posts.post_id
       WHERE posts.pageid = :pageId and posts.userid = :userId
       ORDER BY posts.id desc;
SQL;
}
