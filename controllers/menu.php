<?php
require_once('usertools/orm.php');
require_once('sql.php');

use English3\Controller\ClassesController;
use English3\Controller\JournalController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\PostsController;
use English3\Controller\QuizController;
use English3\Controller\Utility;

global $orgId;
function throwError($message){
    $data = new \stdClass();
    $data->message=$message;
    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

function get_menu_id($uri) {
    $uri = strtok($uri, '?');
    $uri = str_replace('/menu/', '', $uri);
    $uri = strtok($uri, '/');
    return intval($uri);
}
function is_course_editor($uri) {
    $uri = strtok($uri, '?');
    $uri = str_replace('/menu/', '', $uri);
    $uri = strtok($uri, '/');
    return intval($uri);
}
function class_expiration_date($courseid){
    global $app;
    $reader = $app['dbs']['mysql_read'];
    $util  = new Utility($reader);
    $expiration_date = $util->fetchOne("select expiration_date from classes where courseid = {$courseid}");
    return $expiration_date;
}
function make_menu_query($user_id, $menu_id,$is_admin = false,$isCourseEditor=false,$superUnitId=false,$pageId = null) {
    $userWhereClause = "user_classes.userid={$user_id} AND ";
    $hideUnits = $isCourseEditor?'':'and units.hide_from_student = 0';
    if($superUnitId){
        $useSuperUnit = sprintf('JOIN super_units su ON su.id = units.superunitid AND su.id = %s',$superUnitId);
    }else{
        $useSuperUnit = 'LEFT JOIN super_units su ON su.id = units.superunitid';
    }
    $wherePageId = $pageId?' AND pages.id = '.$pageId:'';
    if($is_admin) $userWhereClause="";
    return "SELECT
            units.id, units.name,units.tab_name, units.description, units.image_url,pages.allow_video_post,
            pages.allow_text_post, pages.allow_upload_post, pages.allow_upload_only_post, pages.is_gradeable, pages.keep_highest_score as page_keep_highest_score , pages.hide_activity, pages.id as 'page_id',
            pages.pagegroupid as 'header_id', pages.layout, pages.name as 'pagename',
            pages.gate,pages.minimum_score,
            sov.score AS scoreOverride,
            sov.byUserId AS overrideBy,
            sov.date AS overrideOn,
            sov.is_deleted as overrideDeleted,
            pages.subtitle,
            pages.content,
            pages.show_mastery,
            pages.required_pages,
            pages.mastery_percentage,
            pages.objective,
            pages.no_menu_go_back,
			
			sat.number_of_attempts,
            
			class_assignments.due as 'class_due_date',
            class_assignments.no_due_date,
            class_assignments.points as 'total_points',
            if(udd.manual_due_date,udd.manual_due_date,udd.due_date) as 'user_due_date',
            posts.created,
            posts.resubmissions,
            grade_posts.teacher_notes,
            grade_posts.grade,
            grade_posts.created as 'graded',
            quiz_scores.score as 'quiz_score',
            quiz_scores.highest_score,
            quiz_scores.is_finished as 'quizFinished',
            quiz_scores.max_points as quiz_max_points,
            pages.quiz_id,
            classes.courseid,
            classes.id as classId,
            classes.hide_exempted_activities,
            classes.show_dates as 'showDate',
            classes.show_grades as 'showGrades',
            IFNULL(hiddenpages.hidden_group, 0) AS hidden_group,
            if(ah.time_in is null, 0, 1) as isViewed,
            IF(ce.exemptedBy IS NULL, 0, 1) AS isExempt,
            user_classes.is_suspended,
            user_classes.finished_the_class,
            quizzes.is_survey,
            quizzes.keep_highest_score,
            pages.can_return,
            pages.survey_points,
            pages.minimum_score_for_completion,
            pages.disable_visual_indicators,
            pageGroup.disable_visual_indicators as parent_disable_visual_indicators,
            ce.page_group as pageGroupExempted,
            ce.all_pages as pageGroupExemptedIncludingContentPages,
            if(qr.quiz_response_id,1,0) as quiz_needing_grade,
            gb.post_feedback_id,
            gb.has_quiz_feedback,
            gb.score as gbScore,
            su.name as superUnitName,
            posts.lastPostDate,
            grade_posts.gradedPostDate
        FROM `user_classes`
            JOIN classes ON (user_classes.classid=classes.id)
            JOIN units ON (classes.courseid=units.courseid) {$hideUnits}
            {$useSuperUnit}
            LEFT JOIN pages ON (pages.unitid=units.id)
			
			LEFT JOIN (SELECT s.* FROM `student_activity_track` AS s WHERE s.student_id = {$user_id}) AS sat on sat.activity_id = pages.id AND sat.course_id = classes.courseId 
			
			
			
            LEFT JOIN quizzes on quizzes.id = pages.quiz_id
            LEFT JOIN class_assignments ON (class_assignments.page_id=pages.id)
            LEFT JOIN user_due_dates udd ON udd.pageid=pages.id and user_classes.userid=udd.userid
            LEFT JOIN (SELECT posts.*, count(posts.id) as resubmissions,max(posts.created) as lastPostDate  FROM
                (SELECT posts.id, pageid, userid, posts.created,postrootparentid
                FROM posts JOIN pages on pages.id = posts.pageid WHERE userid = {$user_id} and if(pages.automatically_grade=0,posts.id = posts.postrootparentid,1) AND is_deleted = 0 order by posts.created desc
            ) posts  GROUP BY pageid) AS posts ON posts.pageid=pages.id
            LEFT JOIN (
              SELECT grade_posts.teacher_notes,grade_posts.grade,grade_posts.created,posts.pageid,posts.userid,grade_posts.post_id,posts.created as gradedPostDate
              from grade_posts
              join posts on posts.id = grade_posts.post_id
              where posts.userid = {$user_id} and posts.is_deleted = 0
              order by grade_posts.created) as grade_posts
				 ON (grade_posts.pageid = pages.id and grade_posts.userid = {$user_id} and posts.id=grade_posts.post_id)
            LEFT JOIN quiz_scores ON quiz_scores.quiz_id=pages.id AND quiz_scores.user_id= {$user_id}
            LEFT JOIN quiz_responses qr on if(quizzes.keep_highest_score and quiz_scores.highest_attempt_id,qr.attempt_id = quiz_scores.highest_attempt_id,qr.attempt_id = quiz_scores.attempt_id) and qr.user_id = user_classes.userid and qr.quiz_id=pages.id and qr.is_correct = -1
            LEFT JOIN (
                SELECT pages.id, pages.hide_activity AS hidden_group
                FROM pages,posts
                WHERE 
                posts.userid = {$user_id}
                AND
                posts.pageid=pages.id
                AND
                pages.hide_activity = 1

            ) AS hiddenpages ON (hiddenpages.id = pages.pagegroupid)
            LEFT JOIN pages pageGroup ON pageGroup.id = pages.pagegroupid
            LEFT JOIN activity_history ah ON ah.userid = user_classes.userid and ah.pageid = pages.id
            LEFT JOIN scores_overrides sov ON pages.id = sov.pageId AND user_classes.userid = sov.userId AND classes.id = sov.classId
            LEFT JOIN gradebook gb ON gb.userid = user_classes.userid and gb.pageid = pages.id
            LEFT JOIN (SELECT caId,page_group,all_pages, byUserId AS exemptedBy FROM class_exempted WHERE userId = {$user_id}) ce
              ON if(ce.page_group=1,
                    ce.caId = pages.id or (ce.caId = pageGroup.id and pages.layout='CONTENT' and pages.is_gradeable<>1),
                    ce.caId = class_assignments.id)
        WHERE
            {$userWhereClause} classes.courseid={$menu_id} {$wherePageId}
        GROUP BY pages.id,units.name
        ORDER BY units.name, pages.position ASC";
}

function is_valid_user($sess) {
    return isset($sess['USER']) &&
    isset($sess['USER']['LOGGED_IN']) &&
    isset($sess['USER']['ID']) &&
    $sess['USER']['ID'] > 0 &&
    $sess['USER']['LOGGED_IN']==true;
}
function getPermission($row){
    $allowed=true;
    $class_expiration_date = class_expiration_date($row->courseid);

    $is_expired = $class_expiration_date && (new \DateTime($class_expiration_date))< (new \DateTime());

    if($row->is_suspended==1 ||
        $row->finished_the_class==1 ||
        $is_expired ||
        $row->isExempt
    ){
        $allowed=false;
        if($row->is_suspended==1){
            $reason='You are suspended from this class';
        }else if($row->finished_the_class){
            $reason='This class is finished';
        }else if ($is_expired){
            $reason= 'This class expired on '.$class_expiration_date;
        }else if ($row->isExempt){
            $reason= 'You are exempt from this assignment';
        }


    }
    return array(
        'allowed'=>$allowed,
        'reason'=>$allowed?null:$reason
    );
}
function getScore(&$nav_item){
    if($nav_item->gbScore){
        $score = $nav_item->gbScore;
        $nav_item->isGraded = true;
        $nav_item->isSubmitted = true;
    }else{
        if($nav_item->overrideDeleted){
            $score=null;
        }else{
            $score = $nav_item->quiz_score;
            if ($score == null) {
                $score = $nav_item->grade;
            }
            if($nav_item->scoreOverride) $score = $nav_item->scoreOverride;
        }
    }


    $total = @$nav_item->max_quiz_point?@$nav_item->max_quiz_point:@$nav_item->total_points;
    return [
        'score'=>$score,
        'total'=>$total
    ];
}
function make_nav_from_row($row, $DB, $user_id) {

    /*
    Golabs tmp fix
    */
    if (!isset($row->hide_group)){
        $row->hide_group = 0;
    }
    $highest_score = floatval($row->highest_score);
    if($highest_score>0 && boolval($row->keep_highest_score)){
        $row->quiz_score = $highest_score;
        $row->quizFinished=1;
    }
    if(strtolower($row->layout)=='journal'){
        $row->grade = JournalController::_getStudentGrade($row->page_id,$user_id);
    }


    $nav_item = new \stdClass();

    $nav_item->id     = $row->page_id;
    $nav_item->header_id = $row->header_id;
    $nav_item->external_link = '';
    $nav_item->layout = strtolower($row->layout);
    $nav_item->label  = $row->pagename;
    $nav_item->unitNumber = $row->name;
    $nav_item->unitTabName = $row->tab_name;
    $nav_item->subtitle  = $row->subtitle;
    $nav_item->objective  = $row->objective;
    $nav_item->no_menu_go_back  = boolval($row->no_menu_go_back);
    $nav_item->allow_video_post = $row->allow_video_post;
    $nav_item->allow_text_post = $row->allow_text_post;
    $nav_item->allow_upload_post = $row->allow_upload_post;
    $nav_item->allow_upload_only_post = $row->allow_upload_only_post;
    $nav_item->is_gradeable_post = $row->is_gradeable;
    $nav_item->page_keep_highest_score = $row->page_keep_highest_score;
    $nav_item->hide_activity = $row->hide_activity;
    $nav_item->hide_group = $row->hide_group;
    $nav_item->class_due_date = $row->user_due_date?$row->user_due_date:$row->class_due_date;
    $nav_item->no_due_date =  ($row->no_due_date == '1')? true:false;
    $nav_item->total_points = round(floatval($row->total_points),2);
    $nav_item->created = $row->created;
    $nav_item->isSubmitted = ($row->created)? true : false;
    $nav_item->number_of_attempts = ($row->number_of_attempts == null) ? 0 : $row->number_of_attempts;
    $nav_item->overrideDeleted = boolval(@$row->overrideDeleted);
    $nav_item->isGraded = (($row->grade !== null || @$row->quiz_score !== null || @$row->scoreOverride !== null) && !$nav_item->overrideDeleted)? true : false;
    $nav_item->is_gradeable = $row->is_gradeable;
    $nav_item->showMastery = boolval($row->show_mastery);
    $nav_item->masteryPercentage = $row->mastery_percentage;
    $nav_item->graded = $row->graded;
    $nav_item->grade = round(floatval($row->grade),2);
    $nav_item->gbScore = round(floatval($row->gbScore),2);
    $nav_item->canReturn = boolval($row->can_return);
    $nav_item->disableVisualIndicators = boolval(@$row->disable_visual_indicators) || boolval(@$row->parent_disable_visual_indicators);
    $nav_item->quiz_score = !is_null($row->quiz_score)?round(floatval($row->quiz_score),2):null;
    $nav_item->teacher_notes = $row->teacher_notes;
    $nav_item->quiz_id = $row->quiz_id;
    $nav_item->showDate = $row->showDate;
    $nav_item->showGrades = $row->showGrades;
    $nav_item->isViewed = $row->isViewed==1;
    $nav_item->isExempt = $row->isExempt==1;
    $nav_item->gate = $row->gate;
    $nav_item->minimum_score = $row->minimum_score;
    $nav_item->scoreOverride = $row->scoreOverride;
    $nav_item->requiredPages = json_decode(@$row->required_pages);
    $nav_item->overrideBy = $row->overrideBy;
    $nav_item->overrideOn = $row->overrideOn;
    $nav_item->superUnitName = $row->superUnitName;
    $nav_item->quizFinished = $row->quizFinished==1;
    $nav_item->minimum_score_for_completion = intval($row->minimum_score_for_completion);
    $nav_item->postFeedbackId = intval(@$row->post_feedback_id);
    $nav_item->hasQuizFeedback = boolval(@$row->has_quiz_feedback);
    $nav_item->hasFeedback = $nav_item->postFeedbackId || $nav_item->hasQuizFeedback;
    if($nav_item->isExempt && boolval(@$row->pageGroupExempted)){
        if(!boolval(@$row->pageGroupExemptedIncludingContentPages)){
            $nav_item->disableVisualIndicators = true;
            if($nav_item->layout=='header' || ($nav_item->layout=='content' && !boolval(@$row->is_gradeable))){
                $nav_item->isExempt=false;
                $row->isExempt=false;
            }
        }
    }
    $nav_item->grade = \English3\Controller\MenuController::getPageGrade($row->page_id,$user_id);
    if(boolval($row->hide_exempted_activities) && boolval($row->isExempt) && $nav_item->layout!='header'){
        return null;
    }
    $nav_item->permission=getPermission($row);
    if(intval(@$row->resubmissions) && !$nav_item->isGraded){
        $nav_item->grade = PostsController::getPageLatestGrade($row->page_id,$user_id);
        if($nav_item->grade){
            $nav_item->isGraded = true;
            $nav_item->waitingForGrade = true;
        }
    }
    if($nav_item->isGraded && $row->gradedPostDate < $row->lastPostDate){
        $nav_item->waitingForGrade = true;
    }
    if($nav_item->layout=='quiz'){
        $nav_item->waitingForGrade=boolval(QuizController::_isWaitingForGrade($row->page_id,$_SESSION['USER']['ID']));
    }

    if($nav_item->layout=='vocab_quiz') {
        $quizMaxQuery = "SELECT vocabularies.id FROM vocabularies
                            LEFT JOIN pages ON vocabularies.module_id = pages.moduleid
                            WHERE pages.id = {$nav_item->id}";
    }
    $countAsFinished = $nav_item->quizFinished || !$nav_item->canReturn;
    if((!is_null($nav_item->quiz_score) && $countAsFinished) || ($nav_item->layout=='vocab_quiz' )){
        if((!is_null($nav_item->quiz_score) && $countAsFinished)){
            $nav_item->isSubmitted = true;
        }

        if(!is_null($row->quiz_max_points)){
            if($row->quiz_max_points==0){
                $nav_item->total_points =round(floatval(QuizController::_getQuizMaxPoints($nav_item->quiz_id)),2);
                $nav_item->max_quiz_points =$nav_item->total_points;
            }else{
                $nav_item->total_points =round(floatval($row->quiz_max_points),2);
                $nav_item->max_quiz_points =round(floatval($row->quiz_max_points),2);
            }

        }
        else{
            if($nav_item->layout=='vocab_quiz'){
                $quizMaxResult = $DB->mysqli->query($quizMaxQuery);
                $nav_item->total_points = $quizMaxResult->num_rows;
                $nav_item->max_quiz_points = $quizMaxResult->num_rows;
            }
            else {
                $quizMaxQuery = "SELECT * from quiz_questions WHERE quiz_id = {$nav_item->quiz_id}";
                $quizMaxResult = $DB->mysqli->query($quizMaxQuery);
                $nav_item->total_points = $quizMaxResult->num_rows;
                $nav_item->max_quiz_points = $quizMaxResult->num_rows;

                /*
                Looking for random total in the quizz included added questions.
                */
                $queryRandomcheck = "SELECT * from quiz_questions,quizzes WHERE  quizzes.id = {$nav_item->quiz_id} AND quiz_questions.quiz_id = quizzes.id";
                $RandomcheckResult = $DB->mysqli->query($queryRandomcheck);
                if ($RandomcheckResult && $RandomcheckResult->num_rows > 0) {
                    $RandomcheckRow = $RandomcheckResult->fetch_object();
                    if ($RandomcheckRow->random > 0){
                        $nav_item->max_quiz_points = $RandomcheckRow->random;
                    }
                    //$sess['USER']['ID']
                    $queryResponses = "select * from meglms.quiz_responses where quiz_responses.quiz_id ={$nav_item->id} AND user_id = ".$user_id;
                    $nav_item->queryResponses = $queryResponses;
                    $responsesResult = $DB->mysqli->query($queryResponses);
                    if ($responsesResult && $responsesResult->num_rows > 0) {
                        $nav_item->quiz_score = 0;
                        while ($responsesRow = $responsesResult->fetch_object()) {
                            $responses[] = $responsesRow;
                            if ($responsesRow->is_correct == 1){
                                $nav_item->quiz_score+=1;
                            }
                        }
                    }
                }
            }
        }



    }
    if(boolval($row->is_survey)){
        $nav_item->is_survey = true;
        $nav_item->max_quiz_points = floatval($row->survey_points);
        if($row->quizFinished){
            $nav_item->quiz_score = floatval($row->survey_points);
        }
    }
    $points = getScore($nav_item);
    if($nav_item->showMastery && $nav_item->isGraded){
        $nav_item->mastery=floatval($points['score']/$points['total'])*100>=intval($nav_item->masteryPercentage);
    }
    if($nav_item->minimum_score_for_completion && $nav_item->isGraded){
        $nav_item->minimumNotAchieved=floatval($points['score']/$points['total'])*100<intval($nav_item->minimum_score_for_completion);
    }

    if($nav_item->isSubmitted) {
        $nav_item->icon='checkmark.png';
    } else {
        $nav_item->isSubmitted = false;

        if($nav_item->allow_upload_post == 1){
            $nav_item->icon='uploadicon.png';
        }
        if($nav_item->allow_video_post == 1){
            $nav_item->icon='videoicon.png';
        }
        else if($nav_item->allow_text_post == 1){
            $nav_item->icon='texticon.svg';
        }
        else if($nav_item->layout == 'vocab'){
            $nav_item->icon='vocabicon.png';
        }
        else if($nav_item->layout == 'quiz'||$nav_item->layout == 'vocab_quiz'){
            $nav_item->icon='quizicon.png';
        } else {
            $nav_item->icon='lightbulbicon.png';
        }
    }
    if($nav_item->layout == 'external_link') {
        $nav_item->external_link = $row->content;
    }
    if($row->layout == "SCORM"){
        $query = "select * from gradebook where userid = $user_id and pageid = $row->page_id";
        $responsesResult = $DB->mysqli->query($query)->fetch_object();
        $nav_item->score = $responsesResult->score;
        $nav_item->max_score = $responsesResult->max_score;
    }
    return $nav_item;
}

function getuserRoles($courseId,&$data){
    $util = new Utility();
    $userId = $_SESSION['USER']['ID'];

    $query = "SELECT user_classes.is_student,user_classes.is_observer,user_classes.is_teacher,user_classes.is_edit_teacher
        FROM user_classes
        JOIN classes on user_classes.classid = classes.id
        WHERE user_classes.userid=:userId and classes.courseid = :courseId";

    $roles = $util->fetchRow($query,[
        'courseId'=>$courseId,
        'userId'=>$userId
    ]);

    $data->isStudent = boolval($roles['is_student']);
    $data->isTeacher = boolval($roles['is_teacher']);
    $data->isEditTeacher = boolval($roles['is_edit_teacher']);
    $data->isObserver = boolval($roles['is_observer']);


}

function show_units($units,$courseId,$isDueDateSet=null,$isCourseEditor = false) {
    $user_id = $_SESSION['USER']['ID'];
    global $orgId;
    $data = new \stdClass();
    $data->units = array_values($units);
    if(\English3\Controller\Classes\NoMenuClass::isNoMenu($courseId)){
        $noMenuClass = \English3\Controller\Classes\NoMenuClass::initWithUnits($data->units);
        $data->currentPage = $noMenuClass->findCurrentActivity();
        $data->isLastPage = $noMenuClass->isLastPage();
    }
    if(!is_null($isDueDateSet)){
        $data->isDueDateSet = $isDueDateSet;
    }

    if($isCourseEditor){
        $data->orgDetails = OrganizationController::_get($orgId,false);
    }
    $stylesController = new \English3\Controller\Organization\OrganizationStyleCustomization($orgId);
    $data->stylesAndColors = $stylesController->load()->getPreferences();
    getuserRoles($courseId,$data);
    print json_encode($data);
}
function getRequiredPage($menu_id,$user_id,$pageId){
    global $DB;
    $row = Utility::getInstance()->fetchRow(make_menu_query($user_id,$menu_id,false,false,false,$pageId));
    return make_nav_from_row(json_decode(json_encode($row)),$DB,$user_id);
}
function checkRequiredPages($allPages,$menu_id,$user_id,$superUnit=null){
    foreach($allPages as &$page){
        if($superUnit){
            $page->requiredPages = $page->requiredPages?:[];
            $page->requiredPages = @array_merge($page->requiredPages,$superUnit['required_pages']);
        }
        if($page->requiredPages){

            foreach(@$page->requiredPages as $rPage){
                $rPage = (object) $rPage;
                $requiredPage = $allPages[$rPage->id];
                if(!$requiredPage){
                    try{
                        $requiredPage = getRequiredPage($menu_id,$user_id,$rPage->id);
                    }catch(\Exception $e){
                        continue;
                    }

                    $allPages[$rPage->id]=$requiredPage;
                }
                if($requiredPage->is_gradeable || strpos($requiredPage->layout,'quiz')!==false){
                    if(@$rPage->minimumCompletion){
                        if(@$requiredPage->isGraded){
                            $points = getScore($requiredPage);
                            $requiredPage->completed = floatval($points['score']/$points['total'])*100>=floatval($rPage->minimumCompletion);
                        }else{
                            $requiredPage->completed = false;
                        }
                    }else{
                        $requiredPage->completed = $requiredPage->isSubmitted;
                    }
                }else{
                    $requiredPage->completed = @$requiredPage->isViewed;
                }
                if(!$requiredPage->completed){
                    if($page->permission['allowed']!==false){
                        $page->permission=array(
                            'allowed'=>false,
                            'reason'=>  sprintf('Must complete activity %s, unit %s %s',$requiredPage->label,$requiredPage->unitNumber,($requiredPage->superUnitName?"({$requiredPage->superUnitName})":''))
                        );
                    }
                }
            }
        }
    }
}
function main($DB) {
    global $orgId;
    header('Content-Type: application/json');
    global $DB;
    if(!is_valid_user($_SESSION)) {
        throwError("Invalid user");
        exit();
    }

    $isCourseEditor = isset($_REQUEST['isCourseEditor']) && boolval($_REQUEST['isCourseEditor']);
    $menu_id = get_menu_id($_SERVER['REQUEST_URI']);

    if($menu_id <= 0) {
        throwError("Invalid menu_id");
    }

    $user_id = INTVAL($_SESSION['USER']['ID']);
    $doNotCalculate = isset($_REQUEST['doNotCalculate']) && array_search($menu_id,json_decode($_REQUEST['doNotCalculate'],true))!==false;

    //if the user is in a site, we need to check if he has set the due dates
    $siteId = \English3\Controller\SiteController::_getUserSite($user_id);
    $util = new Utility();
    $classId = $util->fetchOne(ClassesController::$queryGetClassFromCourseId,['courseId'=>$menu_id],'id');
    $orgId = ClassesController::_getOrgId($util->reader,$classId);
    if(!$doNotCalculate && $util->checkStudent($classId,false,false) && boolval(OrganizationController::_getField($orgId,'calculate_progress'))){
        //We are forcing to calculate due dates everytime the user access the course for now
        //$isDueDateSet = !is_null(ClassesController::_isDueDateSet($user_id,$classId));
        $isDueDateSet = false;
        if(!$isDueDateSet){
            print json_encode(['isDueDateSet'=>$isDueDateSet]);
            exit();
        }
    }

    $orm = new PmOrm($_SESSION,$DB);
    $query = make_menu_query($user_id, $menu_id,$orm->am_i_super_user() || $orm->am_i_organization_admin(),$isCourseEditor,$_REQUEST['superUnitId']);

    $result = $DB->mysqli->query($query);

    if(!$result || $result->num_rows <= 0) {
        throwError("Could not create menu");
        exit();
    }

    $hiddenpages = array();
    $hiddenpages_result = $DB->mysqli->query("SELECT id"
        . " FROM pages"
        . " WHERE unitid IN (SELECT id FROM units WHERE courseid = " . $menu_id . ")"
        . " AND hide_activity = 1"
    );
    while($hidden = $hiddenpages_result->fetch_object()) {
        $hiddenpages[] = $hidden->id;
    }

    $units = array();
    // $first_unit_id = 0;
    // $added_vocab = false;

    $allPages=array();
    while($row = $result->fetch_object()) {
        // make the unit definition if it doesn't exist
        if(!isset($units[$row->id])) {
            $units[$row->id] = new \stdClass();
            $units[$row->id]->id = $row->id;
            $units[$row->id]->name = $row->name;
            $units[$row->id]->tab_name = $row->tab_name;
            $units[$row->id]->description = $row->description;
            $units[$row->id]->image_url = $row->image_url;
            $units[$row->id]->pages = array();
        }

        // make a nav item, append to the unit pages list
        if(isset($row->page_id) && $row->page_id > 0) {
            if(in_array($row->header_id, $hiddenpages)) {
                $row->hide_activity = "1";
            }
            $page = make_nav_from_row($row, $DB, $user_id);
            if(is_null($page)){
                continue;
            }
            $allPages[$page->id]=$page;
            $units[$row->id]->pages[] = &$allPages[$page->id];
        }
    }

    if (!isset($isDueDateSet)){
        $isDueDateSet=null;
    }
    if(!Utility::getInstance()->checkTeacher($classId,null,false)){
        $superUnit = null;
        if($_REQUEST['superUnitId']){
            $s = \English3\Controller\Classes\SuperUnitDB::fromId($_REQUEST['superUnitId']);
            $s->prepareForDisplay();
            $superUnit = $s->data;
        }

        checkRequiredPages($allPages,$menu_id,$user_id,$superUnit);
    }
    show_units($units,$menu_id,$isDueDateSet,$isCourseEditor);
    //include_once($PATHS->app_path . $PATHS->data_path . '/' . $menu_id . '.json');
    exit();
}

global $PATHS, $DB;

main($DB);

?>
