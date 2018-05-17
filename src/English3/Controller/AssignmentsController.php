<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Organization\OrganizationController;
use English3\ResponseView\Assignment;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Normalizer\GetSetMethodNormalizer;

class AssignmentsController
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
        $this->util = new Utility();
        $this->userCalendar=array();
        $this->userDurations = array();

    }

    public function getAssignmentsAction(Request $request)
    {
        if (!$this->loggedIn) return 'Not allowed';
        if ($request->query->has('userid') === false) {
            if ($request->query->has('classid') !== false) {
                return $this->getAssignmentsForClass($request);
            }
            throw new BadRequestHttpException('Missing userid');
        }
        if ($request->query->has('classid') !== false) {
            return $this->getAssignmentsForUserClass($request);
        }

        $userId = $request->query->get('userid');
        if ($userId == 'me') {
            $userId = $_SESSION['USER']['ID'];
        }
        $this->userId = $userId;

        $grouped = $request->query->get('grouped');
        $sql =  self::$queryGetAssignmentsForUser;
        $stmt = $this->read->prepare($sql);
        $stmt->execute(array(':userid' => $userId));
        $assignments = array();

        if($grouped) return $this->prepareAssignmentsForUser($stmt->fetchAll());

        return $this->prepareAssignments($stmt->fetchAll());
    }
//    public function getAssignmentsForUsers(Request $request){
//        $users = json_decode($request->query->get('users'),true);
//        $grouped = $request->query->get('grouped');
//        $sql = self::$queryGetAssignmentsForUsers;
//        $sql = str_replace(':userId',implode(',',$users),$sql);
//        $stmt = $this->read->prepare($sql);
//        if($grouped) return $this->prepareAssignmentsForUsers($stmt->fetchAll());
//        //return $this->prepareAssignments($stmt->fetchAll());
//    }

    public function getAssignmentsForClass(Request $request) {
        $classId = $request->query->get('classid');
        $grouped = $request->query->get('grouped');
        $sql = self::$queryGetAssignmentsForClass;
        $stmt = $this->read->prepare($sql);
        $stmt->execute(array(':classid' => $classId));
        if($grouped) return $this->prepareAssignmentsForClass($stmt->fetchAll());
        return $this->prepareAssignments($stmt->fetchAll());
    }


    public function getAssignmentsForUserClass(Request $request) {
        $classId = $request->query->get('classid');
        $userId = $request->query->get('userid');

        if ($userId == 'me') {
            $userId = $_SESSION['USER']['ID'];
        }
        $sql = <<<SQL
            SELECT
                ca.due as ca_due,
                cl.id as class_id,
                '0' as ca_name,
                p.name as p_name,
                p.id as page_id,
                p.pagegroupid as page_group_id,
                p.quiz_id as quiz_id,
                ca.id as class_assignment_id,
                ca.points as ca_points,
                uc.userid as user_id,
                u.description as unit_description,
                u.name as unit_name,
                cl.show_dates,
                cl.show_grades,
            FROM user_classes as uc
                INNER JOIN classes as cl ON (uc.classid=cl.id)
                INNER JOIN courses as c ON (c.id=cl.courseid)
                INNER JOIN units as u ON (u.courseid=c.id)
                INNER JOIN pages as p ON (u.id=p.unitid)
                LEFT JOIN class_assignments as ca ON (ca.page_id=p.id)
            WHERE
                cl.id = :classid
                AND (is_gradeable = true OR (quiz_id IS NOT NULL and quiz_id>0))
                AND ca.points IS NOT NULL
                AND uc.userid = :userid
                and p.hide_activity = 0
            GROUP BY class_assignment_id, user_id
SQL;
        $stmt = $this->read->prepare($sql);
        $stmt->execute(array(':classid' => $classId,':userid' => $userId));

        return $this->prepareAssignments($stmt->fetchAll(),true);
    }
    public function groupAssignmentsByUnits(&$units,$row,&$root){
        if(!isset($units[$row['unitId']])){
            $units[$row['unitId']] = array('id'=>$row['unitId'],
                'name'=>$row['unit'],
                'position'=>intval($row['unitPosition']),
                'pages'=>array()
            );
        }

        $pageGroups = &$units[$row['unitId']]['pages'];

        if($row['pageGroupId'] >0){
            if(!isset($pageGroups[$row['pageGroupId']])){
                $pageGroups[$row['pageGroupId']]=array(
                    'id'=>$row['pageGroupId'],
                    'name'=>$row['groupName'],
                    'position'=>$row['groupPosition'],
                    'pages'=>array(),
                );
            }
            $pages = &$pageGroups[$row['pageGroupId']]['pages'];
            $page = $this->makePage($row,$root);
            $page['pageGroupId']=$row['pageGroupId'];
            $pages[] = $page;
        }
        else{
            if(!isset($pageGroups[$row['pageId']])){
                $pageGroups[$row['pageId']]=array('id'=>$row['pageId'],
                    'pages'=>array(),
                );
            }
            $pageGroups[$row['pageId']]=$this->makePage($row,$root);
        }
    }
    private function makePage($row,&$root){
        $totalTasks = &$root['totalTasks'];
        $grandTotal = &$root['grandTotal'];
        $grandMaxTotal = &$root['grandMaxTotal'];
        $completedTasks = &$root['completedTasks'];
        $expectedTasks = &$root['expectedTasks'];
        $totalWorkedScore = &$root['totalWorkedScore'];

      $row['pagePosition'] = ($row['pagePosition'])? $row['pagePosition'] : null;
        $page = array(
            'id'=>$row['pageId'],
            'type'=>strtolower($row['layout']),
            'position'=>$row['pagePosition'],
            'name'=>$row['name'],
            'due_date'=>$row['user_due']?$row['user_due']:$row['due'],
            'isExempt'=>$row['isExempt']==1

        );

        if($row['rubricid']){
            $page['useRubric']=true;
            $page['rubricId']=$row['rubricid'];
        }
        $page['points']=array(
            'max'=>round(floatval($row['total']),2),
            'score'=>round(floatval($row['score']),2),
            'scoreOverride'=>round(floatval($row['scoreOverride']),2)
        );
        if(!is_null($row['score']) || !is_null($row['scoreOverride'])){
            $page['isGraded']=true;
        }
        if(!$page['isExempt']){
            $totalTasks++;
            $grandMaxTotal += round(floatval($row['total']),2);
            if(new \DateTime($row['user_due'])< new \DateTime()){
                $expectedTasks++;
            }
            $grandTotal += ($row['scoreOverride'] === null)? floatval($row['score']) : floatval($row['scoreOverride']);
            if($row['scoreOverride'] !== null || $row['score'] !== null) {
                $totalWorkedScore += round(floatval($row['total']),2);
            }
            $completedTasks += ($page['isGraded'])? 1 : 0;
        }



        if($row['submitted']){
            $page['isSubmitted']=true;
            $page['submitted']=$row['submitted'];
        }else{
            $page['isSubmitted']=false;
        }
        if($row['feedback'] || $row['quizFeedback']){
            $page['hasFeedback']=true;
            $page['gradePostId']=$row['feedback'];
        }else{
            $page['hasFeedback']=false;
        }


        if($this->userDurations[$row['userId']] && $this->userDurations[$row['userId']]['classes'][$row['classId']]){
            $durations = &$this->userDurations[$row['userId']]['classes'][$row['classId']];
            $durations['total']+=$row['lesson_duration'];
            if(!$page['isSubmitted'] && !$page['isGraded']){
                $durations['notFinished']+=$row['lesson_duration'];
            }
        }

        return $page;
    }
    public function groupAssignmentsByClass(&$classes,$row){
        if(!isset($classes[$row['classId']])){
            $classes[$row['classId']] = array(
                'id'=>$row['classId'],
                'name'=>$row['className'],
                'showGrades'=>$row['show_grades'],
                'showDates'=>$row['show_dates'],
                'enrollmentDate'=>$row['enrollmentDate'],
                'grandTotal'=>0,
                'grandMaxTotal'=>0,
                'totalWorkedScore'=>0,
                'completedTasks'=>0,
                'expectedTasks'=>0,
                'totalTasks'=>0,
                'units'=>array()
            );
            if($row['show_final_grade']==1){
                $classes[$row['classId']]['finalScore']=$row['final_score'];
            }
            $this->startUserProgress($row['userId'],$row['classId']);
        }
        $this->groupAssignmentsByUnits($classes[$row['classId']]['units'],$row,$classes[$row['classId']]);

    }
//    public function prepareAssignmentsForUsers($results){
//        $users = array();
//        foreach($results as $row){
//            if(!isset($users[$row['userId']])){
//                $users[$row['userId']] = array(
//                    'id'=>$row['userId'],
//                    'enrollmentDate'=>$row['enrollmentDate'],
//                    'classes'=>array()
//                );
//
//            }
//            if($row['show_final_grade']==1){
//                $users[$row['userId']]['finalScore']=$row['final_score'];
//            }
//            $this->groupAssignmentsByClass($users[$row['userId']]['classes'],$row);
//
//        }
//        foreach($users as &$user){
//            foreach($user['classes'] as &$class) {
//                foreach ($class['units'] as &$units) {
//                    $units['pages'] = array_values($units['pages']);
//                }
//                $class['units'] = array_values($class['units']);
//
//                if ($this->userDurations[$user['id']] && $this->userDurations[$user['id']]['classes'][$class['id']]) {
//                    $durations = $this->userDurations[$user['id']]['classes'][$class['id']];
//                    $timeToComplete = (90 / $durations['total']) * $durations['notFinished'];
//                    $user['projectedEndDate'] = ClassesController::_getProjectedEndDate($timeToComplete, $user['id'])->format('Y-m-d');
//                    $user['expectedEndDate'] = ClassesController::_getExpectedDate($user['id'], $class['id']);
//                }
//                $user['classes']=array_values($user['classes']);
//            }
//        }
//        return new JsonResponse(array_values($users));
//    }
    public function prepareAssignmentsForClass($results){
        $users = array();
        $classId = 0;
        $schoolCalendar = 90;
        $util = new Utility();
        foreach($results as $row){
            if(!isset($users[$row['userId']])){
                $users[$row['userId']] = array(
                    'id'=>$row['userId'],
                    'enrollmentDate'=>$row['enrollmentDate'],
                    'units'=>array()
                );
                //getting student advisors
                $users[$row['userId']]['advisors']=UserController::_getAdvisors($row['userId']);

                $this->startUserProgress($row['userId'],$row['classId']);
                if(!$classId){
                    $classId=$row['classId'];
                    $orgId = ClassesController::_getOrgId($this->read,$classId);
                    $orgFlags = OrganizationController::_get($orgId,false);
                    $schoolCalendar = floatval($util->fetchOne(ClassesController::$queryGetClass,['classId'=>$classId],'course_length'));



                }
            }
            if($row['show_final_grade']==1){
                $users[$row['userId']]['finalScore']=$row['final_score'];
            }
            $this->groupAssignmentsByUnits($users[$row['userId']]['units'],$row,$users[$row['userId']]);

        }
        foreach($users as &$user){
            $user['orgFlags']=array(
                'hide_actual_score'=>$orgFlags['hide_actual_score'],
                'hide_grade_clompleted_word'=>$orgFlags['hide_grade_clompleted_word'],
                'hide_expected_by_today'=>$orgFlags['hide_expected_by_today'],
                'hide_completed_so_far'=>$orgFlags['hide_completed_so_far'],
                'hide_progress'=>$orgFlags['hide_progress'],
                'hide_projected_end_date'=>$orgFlags['hide_projected_end_date'],
                'hide_expected_end_date'=>$orgFlags['hide_expected_end_date'],
                'show_gender'=>$orgFlags['show_gender'],
                'show_site'=>$orgFlags['show_site'],
            );


            if($user['totalTasks'] > 0) {
                $user['percentWorkedTasks'] = intval($user['completedTasks'] * 100 / $user['totalTasks']);
                $user['percentExpectedTasks'] = intval($user['expectedTasks'] * 100 / $user['totalTasks']);
            }
            if($user['totalWorkedScore'] > 0 && $user['grandMaxTotal'] > 0) {
                $user['percentPartial'] = intval($user['grandTotal'] * 100 / $user['totalWorkedScore']);
                $user['percentComplete'] = intval($user['grandTotal'] * 100 / $user['grandMaxTotal']);
            } else {
                $user['percentPartial'] = $user['percentComplete'] = 0;
            }
            
            foreach($user['units'] as &$units){
                $units['pages']=array_values($units['pages']);
            }
            $user['units']=array_values($user['units']);

            if($this->userDurations[$user['id']] && $this->userDurations[$user['id']]['classes'][$classId]){
                $durations = $this->userDurations[$user['id']]['classes'][$classId];
                $timeToComplete = ($schoolCalendar/$durations['total'])*$durations['notFinished'];
                $user['projectedEndDate'] = ClassesController::_getProjectedEndDate($timeToComplete, $user['id'])->format('Y-m-d');
                $user['expectedEndDate'] = ClassesController::_getExpectedDate($user['id'],$classId);
            }
        }
        return new JsonResponse(array_values($users));
    }
    public function prepareAssignmentsForUser($results){
        $classes = array();
        $userId = 0;
        $util = new Utility();
        foreach($results as $row){
            if(!isset($classes[$row['classId']])){
                $orgId = ClassesController::_getOrgId($this->read,$row['classId']);
                $orgFlags = OrganizationController::_get($orgId,false);

                $classes[$row['classId']] = array(
                    'id'=>$row['classId'],
                    'name'=>$row['className'],
                    'showGrades'=>$row['show_grades'],
                    'showDates'=>$row['show_dates'],
                    'enrollmentDate'=>$row['enrollmentDate'],
                    'grandTotal'=>0,
                    'grandMaxTotal'=>0,
                    'totalWorkedScore'=>0,
                    'completedTasks'=>0,
                    'expectedTasks'=>0,
                    'totalTasks'=>0,
                    'units'=>array(),
                    'orgFlags'=>array(
                        'hide_actual_score'=>$orgFlags['hide_actual_score'],
                        'hide_grade_clompleted_word'=>$orgFlags['hide_grade_clompleted_word'],
                        'hide_expected_by_today'=>$orgFlags['hide_expected_by_today'],
                        'hide_completed_so_far'=>$orgFlags['hide_completed_so_far'],
                        'hide_progress'=>$orgFlags['hide_progress'],
                        'hide_projected_end_date'=>$orgFlags['hide_projected_end_date'],
                        'hide_expected_end_date'=>$orgFlags['hide_expected_end_date'],
                        'show_gender'=>$orgFlags['show_gender'],
                        'show_site'=>$orgFlags['show_site'],
                    )
                );
                $ctrl = new ClassesController($this->read);
                $rubric = $ctrl->wrapClassObject(ClassesController::_getClass($row['classId']));

                $classes[$row['classId']]['rubric']=$rubric['rubric'];
                if($row['show_final_grade']==1){
                    $classes[$row['classId']]['finalScore']=$row['final_score'];
                }
                $this->startUserProgress($row['userId'],$row['classId']);
            }
            if(!$userId){
                $userId=$row['userId'];
            }
            $this->groupAssignmentsByUnits($classes[$row['classId']]['units'],$row,$classes[$row['classId']]);
        }
        
        foreach($classes as &$class){
            if($class['totalTasks'] > 0) {
                $class['percentWorkedTasks'] = intval($class['completedTasks'] * 100 / $class['totalTasks']);
                $class['percentExpectedTasks'] = intval($class['expectedTasks'] * 100 / $class['totalTasks']);
            }
            if($class['totalWorkedScore'] > 0 && $class['grandMaxTotal'] > 0) {
                $class['percentPartial'] = intval($class['grandTotal'] * 100 / $class['totalWorkedScore']);
                $class['percentComplete'] = intval($class['grandTotal'] * 100 / $class['grandMaxTotal']);
            } else {
                $class['percentPartial'] = $class['percentComplete'] = 0;
            }
            
            foreach($class['units'] as &$units){
                $units['pages']=array_values($units['pages']);
            }
            $class['units']=array_values($class['units']);

            if($this->userDurations[$userId] && $this->userDurations[$userId]['classes'][$class['id']]){
                $durations = $this->userDurations[$userId]['classes'][$class['id']];
                $schoolCalendar = floatval($util->fetchOne(ClassesController::$queryGetClass,['classId'=>$class['id']],'course_length'));
                $timeToComplete = ($schoolCalendar/$durations['total'])*$durations['notFinished'];
                $class['projectedEndDate'] = ClassesController::_getProjectedEndDate($timeToComplete, $userId)->format('Y-m-d');
                $class['expectedEndDate']=ClassesController::_getExpectedDate($userId,$class['id']);
            }

        }

        return new JsonResponse(array_values($classes));
    }

    public function prepareAssignments($results) {
//        if(!$user) return new JsonResponse($results);
        return new JsonResponse($results);
        /*
         * DSerejo 2015-03-17
         * Returning raw results.
         * We will come back to it later
         */

        foreach ($results as $result) {
            $assignment = (new Assignment)
                ->setClassId($result['class_id'])
                ->setUserId($result['user_id'])
                ->setName($result['ca_name'] ?: $result['p_name'])
                ->setUnit($result['unit_description'])
                ->setUnitPosition($result['unit_name'])
                ->setPageId($result['page_id'])
                ->setPageGroupId($result['page_group_id'])
                ->setShow_dates($result['show_dates'])
                ->setShow_grades($result['show_grades'])
            ;
            if ($result['quiz_id']) {
                $score = $this->getScoreForQuiz($result['page_id'], $result['user_id']);

                $sql = <<<SQL
                SELECT count(*) AS total
                FROM quiz_questions
                WHERE quiz_id = :quiz_id
SQL;
                $totalStmt = $this->read->prepare($sql);
                $totalStmt->execute(['quiz_id' => $result['quiz_id']]);
                $totalScore = $totalStmt->fetchColumn();
                $assignment
                    ->setDue(new \DateTime(isset($result['ua_due']) && $result['ua_due'] ?: $result['ca_due']))
                    ->setScore($score['score'])
                    ->setSubmitted(isset($result['submitted']) &&$score['submitted'] ? new \DateTime($score['submitted']) : null)
                    ->setTotal($totalScore)
                ;
            } else {
                $score = $this->getScoreForAssignment($result['page_id'], $result['user_id']);
                $assignment->setDue(new \DateTime($result['ca_due']))
                    ->setScore($score['score'])
                    ->setSubmitted(isset($result['submitted']) && $result['submitted'] ? new \DateTime($result['submitted']) : null)
                    ->setTotal($result['ca_points'])
                    ->setFeedback($score);
                ;
            }

            $assignments[] = $assignment;
        }

        $sortByDate = function ($a1, $a2) {
            if ($a1->getDue() < $a2->getDue()) return -1;
            if ($a1->getDue() > $a2->getDue()) return 1;
            return 0;
        };
        usort($assignments, $sortByDate);

        $normalizer = new GetSetMethodNormalizer();
        $callback = function ($dateTime) {
            return $dateTime instanceof \DateTime
                ? $dateTime->format(\DateTime::ISO8601)
                : '';
        };
        $normalizer->setCallbacks([
            'due' => $callback,
            'submitted' => $callback
        ]);

        $normalized = array();

        $foundNextDue = false;
        $now = new \DateTime();
        foreach ($assignments as $assignment) {
            $next = $normalizer->normalize($assignment);
            if (!$foundNextDue && $assignment->getDue() > $now) {
                $foundNextDue = true;
                $next["isNextDue"] = true;

            }


            $next['feedback']= $assignment->feedback;

            $normalized[] = $next;
        }
        return new JsonResponse($normalized);
    }
    private function startUserProgress($userId,$classId){
        $orgId = ClassesController::_getOrgId($this->read,$classId);
        if(!(ClassesController::_isDueDateSet($userId,$classId) && boolval(OrganizationController::_getField($orgId,'calculate_progress')) )){
            return;
        }
        if(!$this->userDurations[$userId] && is_null($this->userCalendar[$userId])){
            $siteId = SiteController::_getUserSite($userId);
            if(!is_null($siteId)){
                $calendar = json_decode($this->util->fetchOne(SiteController::$queryGetSite,['siteId'=>$siteId],'blackouts'),true);
                if($calendar){
                    $this->userCalendar[$userId]=$calendar;
                    $this->userDurations[$userId]=array(
                        'classes'=>array(
                            $classId=>array(
                                'total'=>0,
                                'notFinished'=>0
                            )
                        )
                    );
                }
                else{
                    $this->userCalendar[$userId]=false;
                }
            }
        }
        else if($this->userCalendar[$userId]){
            $this->userDurations[$userId]['classes'][$classId]=array(
                'total'=>0,
                'notFinished'=>0
            );
        }
    }

    private function getScoreForQuiz($page_id, $user_id)
    {
        $sql = <<<SQL
        SELECT qs.score AS score, qs.submitted AS submitted
        FROM quiz_scores AS qs
        INNER JOIN pages AS p ON (p.id=qs.quiz_id)
        WHERE qs.user_id = :user_id
        AND qs.quiz_id = :page_id
SQL;
        $stmt = $this->read->prepare($sql);
        $stmt->execute(['user_id' => $user_id, 'page_id' => $page_id]);
        $result = $stmt->fetchAll();
        return reset($result);

    }
    private function getScoreForAssignment($page_id,$user_id){
        $sql = <<<SQL
        SELECT if(grade REGEXP '[0-9]+' or grade is null,grade,0) as score,posts.created as submitted,
        grade_posts.id,  users.fname, users.lname, posts.video_thumbnail_url,
        grade_posts.viewed, grade_posts.teacher_notes
        FROM posts
        LEFT JOIN grade_posts on grade_posts.post_id = posts.id
        LEFT JOIN users ON (grade_posts.user_id=users.id)
        WHERE posts.userid = :user_id AND posts.pageid = :pid
        ORDER BY grade_posts.created DESC LIMIT 1
SQL;
        $stmt = $this->read->prepare($sql);
        $stmt->execute(['user_id' => $user_id, 'pid' => $page_id]);
        $result = $stmt->fetchAll();
        return reset($result);
    }
    private function getScoreForAssignment_old($class_assignment_id, $user_id)
    {
        $sql = <<<SQL
        SELECT ua.points AS score, ua.submitted AS submitted
        FROM user_assignments as ua
        WHERE ua.userid = :user_id
        AND ua.class_assignment_id = :cai
SQL;
        $stmt = $this->read->prepare($sql);
        $stmt->execute(['user_id' => $user_id, 'cai' => $class_assignment_id]);
        $result = $stmt->fetchAll();
        return reset($result);

    }
    private static $queryGetAssignmentsForClass = <<<SQL
            SELECT assignments.*,
				if(assignments.max_points>0,assignments.max_points,
					if(layout='VOCAB_QUIZ',count(v.id),sum(quiz_questions.max_points)))
						as total ,
                if( score_ REGEXP '[0-9]+',score_, if(score_ is null,score_,0 )) as score,
                sum(if(ah.time_out is not null,timestampdiff(SECOND,ah.time_in,ah.time_out),0)) as total_time
                FROM (  SELECT
              ca.due as due,
              udd.due_date as user_due,
              cl.id as classId,
              cl.name as className,
              '0' as ca_name,
              p.name as name,
              pg.name as groupName,
              p.id as pageId,
              p.pagegroupid as pageGroupId,
              p.quiz_id as quiz_id,
              p.layout,
              p.moduleid,
              p.rubricid,
              p.lesson_duration,
              p.position as pagePosition,
              ca.id as class_assignment_id,
              if(ca.points >0,ca.points,qs.max_points) as max_points,
              uc.userid as userId,
              uc.final_score,
              uc.created as enrollmentDate,
              u.description as unit,
              u.name as unitPosition,
              u.id as unitId,
              gp.id as feedback,
              gp.created as gradeDate,
              cl.show_dates,
              cl.show_grades,
              cl.show_final_grade,
              sov.score AS scoreOverride,
              sov.byUserId AS overrideBy,
              sov.date AS overrideOn,
              if(qs.score is not null,qs.score,gp.grade) as score_,
              IF(ce.userId IS NULL, 0, 1) AS isExempt,
              if(qs.submitted is not null,qs.submitted,posts.created) as submitted,
              qf.quiz_id as quizFeedback
              FROM user_classes as uc
              INNER JOIN classes as cl ON (uc.classid=cl.id)
              INNER JOIN courses as c ON (c.id=cl.courseid)
              INNER JOIN units as u ON (u.courseid=c.id)
              INNER JOIN pages as p ON (u.id=p.unitid)
              LEFT JOIN pages as pg ON (p.pagegroupid=pg.id)
              LEFT JOIN class_assignments as ca ON (ca.page_id=p.id AND ca.class_id = cl.id)
              LEFT JOIN user_due_dates udd ON udd.pageid = p.id AND uc.userid = udd.userid
              LEFT JOIN (
                SELECT MAX(id) AS id, pageid, userid, created
                FROM posts WHERE is_deleted = 0 GROUP BY pageid,userid
            ) AS posts ON posts.pageid=p.id and posts.userid= uc.userid
            LEFT JOIN (SELECT * FROM grade_posts order by created DESC ) as gp
				 ON (gp.post_id=posts.id)
              LEFT JOIN quiz_scores qs on p.id = qs.quiz_id and qs.user_id = uc.userid
              LEFT JOIN scores_overrides sov ON p.id = sov.pageId AND uc.userid = sov.userId AND cl.id = sov.classId
              LEFT JOIN (SELECT caId, userId FROM class_exempted) ce ON ce.caId = ca.id AND ce.userId = uc.userid
              LEFT JOIN (SELECT quiz_id,user_id FROM quiz_feedback WHERE feedback is not null GROUP BY quiz_id,user_id) qf ON qf.quiz_id = p.quiz_id and qf.user_id = uc.userid

                WHERE
            cl.id = :classid
			AND (p.is_gradeable = true OR p.layout like '%QUIZ%')
			and p.hide_activity = 0

		GROUP BY p.id, uc.userid
      ) AS assignments
      LEFT JOIN ( SELECT quiz_questions.*,
		   if(quiz_questions.points or quiz_questions.random,
				if(quiz_questions.random,
					if(quiz_questions.points,quiz_questions.points,1)*quiz_questions.random,
					quiz_questions.points),
				questions.max_points) as max_points
          FROM quiz_questions
          LEFT JOIN questions on quiz_questions.question_id = questions.id
        ) quiz_questions on assignments.quiz_id = quiz_questions.quiz_id
      LEFT JOIN vocabularies v on assignments.moduleid = v.module_id and assignments.layout='VOCAB_QUIZ'
      LEFT JOIN activity_history ah on assignments.pageId =ah.pageid and assignments.userId = ah.userid
      group by pageId,userId
      ORDER BY unitPosition,pagePosition
SQL;

    private static $queryGetAssignmentsForUser = <<<SQL
        SELECT assignments.*,
        if(assignments.max_points>0,assignments.max_points,
          if(layout='VOCAB_QUIZ',count(v.id),sum(quiz_questions.max_points)))
            as total ,
                if( score_ REGEXP '[0-9]+',score_, if(score_ is null,score_,0 )) as score,
                sum(if(ah.time_out is not null,timestampdiff(SECOND,ah.time_in,ah.time_out),0)) as total_time
                FROM (  SELECT
              ca.due as due,
              udd.due_date as user_due,
              cl.id as classId,
              cl.name as className,
              '0' as ca_name,
              p.name as name,
              pg.name as groupName,
              pg.position as groupPosition,
              p.id as pageId,
              p.pagegroupid as pageGroupId,
              p.quiz_id as quiz_id,
              p.layout,
              p.moduleid,
              p.rubricid,
              p.position as pagePosition,
              p.lesson_duration,
              ca.id as class_assignment_id,
              if(ca.points >0,ca.points,qs.max_points) as max_points,
              uc.userid as userId,
              uc.final_score,
              uc.created as enrollmentDate,
              u.description as unit,
              u.name as unitPosition,
              u.id as unitId,
              gp.id as feedback,
              gp.created as gradeDate,
              cl.show_dates,
              cl.show_grades,
              cl.show_final_grade,
              sov.score AS scoreOverride,
              sov.byUserId AS overrideBy,
              sov.date AS overrideOn,
              IF(ce.exemptedBy IS NULL, 0, 1) AS isExempt,
              if(qs.score is not null,qs.score,gp.grade) as score_,
              if(qs.submitted is not null,qs.submitted,posts.created) as submitted,
              qf.quiz_id as quizFeedback
              FROM user_classes as uc
              INNER JOIN classes as cl ON (uc.classid=cl.id)
              INNER JOIN courses as c ON (c.id=cl.courseid)
              INNER JOIN units as u ON (u.courseid=c.id)
              INNER JOIN pages as p ON (u.id=p.unitid)
              LEFT JOIN pages as pg ON (p.pagegroupid=pg.id)
              LEFT JOIN class_assignments as ca ON (ca.page_id=p.id)
              LEFT JOIN user_due_dates udd ON udd.pageid = p.id AND uc.userid = udd.userid
              LEFT JOIN (
                SELECT MAX(id) AS id, pageid, userid, created
                FROM posts WHERE userid = :userid AND is_deleted = 0 GROUP BY pageid
              ) AS posts ON posts.pageid=p.id
              LEFT JOIN (SELECT * FROM grade_posts order by created DESC ) as gp ON (gp.post_id=posts.id)
              LEFT JOIN quiz_scores qs on p.id = qs.quiz_id and qs.user_id = uc.userid
              LEFT JOIN scores_overrides sov ON p.id = sov.pageId AND uc.userid = sov.userId AND cl.id = sov.classId
              LEFT JOIN (SELECT caId, byUserId AS exemptedBy FROM class_exempted WHERE userId = :userid) ce ON ce.caId = ca.id
              LEFT JOIN (SELECT quiz_id FROM quiz_feedback WHERE user_id = :userid and feedback is not null GROUP BY quiz_id) qf ON qf.quiz_id = p.quiz_id
            WHERE uc.userid = :userid and uc.is_student=1
      AND (p.is_gradeable = true OR p.layout like '%QUIZ%')
      and p.hide_activity = 0
      group by p.id
      ) AS assignments
      LEFT JOIN
        ( SELECT quiz_questions.*,
		   if(quiz_questions.points or quiz_questions.random,
				if(quiz_questions.random,
					if(quiz_questions.points,quiz_questions.points,1)*quiz_questions.random,
					quiz_questions.points),
				questions.max_points) as max_points
          FROM quiz_questions
          LEFT JOIN questions on quiz_questions.question_id = questions.id
        ) quiz_questions on assignments.quiz_id = quiz_questions.quiz_id
      LEFT JOIN vocabularies v on assignments.moduleid = v.module_id and assignments.layout='VOCAB_QUIZ'
      LEFT JOIN activity_history ah on assignments.pageId =ah.pageid and assignments.userId = ah.userid
      group by pageId
      ORDER BY unitPosition,pagePosition


SQL;

}
