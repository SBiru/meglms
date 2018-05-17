<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Classes\CustomProgressBar;
use SimpleXML;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class MenuController{

    private $reader;
    private $me;
    private $util;
    private $gatePage;
    private $classExpired;

    public function __construct(Connection $reader) {
        $this->util = new Utility($reader);
        $this->reader = $reader;
        $this->gatePage = null;
    }

    public function get(Request $request,$id){
        $this->checkPermissions();


        $hasGroup = $request->query->has('groupId');

        $query = $this->queryGetMenu();
        $queryParameters = ['menuId'=>$id,'userId'=>$this->me->user->getUserId()];
        $queryParameters['groupId'] = $hasGroup?$request->query->get('groupId'):'';


        $rawData = $this->util->fetch($query,$queryParameters);

        //getting class info
        $me = $this->me->user->getUserId();
        $classData = $this->util->fetchRow(
            $hasGroup?$this->queryGetGroupClassInfo:$this->queryGetClassInfo,
            $hasGroup?['menuId'=>$id,'groupId'=>$request->query->get('groupId'),'userId'=>$me]:['menuId'=>$id,'userId'=>$me]
        );
        $classData['show_dates']=$classData['showDates'];
        $classData['use_custom_progress_bar']=boolval($classData['use_custom_progress_bar']);
        $classData['perc_expected_tasks']=intval($classData['perc_expected_tasks']);
        $classData['perc_completed_tasks']=intval($classData['perc_completed_tasks']);
        $classData['isProficiencyTest'] = ClassesController::isProficiencyTest($classData['id']) || ClassesController::isPracticeTest($classData['id'],$this->me->user->getUserId());

        if($classData['use_custom_progress_bar']){
            $progressBar = CustomProgressBar::fromString($classData['custom_progress_bar']);
            $classData['custom_progress_bar'] = $progressBar->toArray();
        }
        //Checking for teacher role or admin
        $classData['hasTeacherAbilities'] =$this->util->checkTeacher($classData['id'],$classData['orgId'],false);

        $this->classExpired = $this->isClassExpired($classData['expiration_date']);
        if($this->classExpired){
            $classData['isExpired']=true;
        }


        if($rawData){
            $classData['isSuspended']=$rawData[0]['is_suspended']==1;
            $classData['isFinished']=$rawData[0]['finished_the_class']==1;
            $classData['is_active']=$rawData[0]['is_active']==1;            

            if(isset($classData['groupId'])){
                $classData['name'] .= ' - ' . $classData['groupName'];
            }
        }

        list($units,$superUnits) = $this->makeUnits($rawData);


        $classData['units']=array_values($units);
        $classData['superUnits']=array_values($superUnits);

        return new JsonResponse($classData);
    }

    public function getByUnit(Request $request,$id){

        $this->checkPermissions();


        $hasGroup = $request->query->has('groupId');

        $query = $this->queryGetMenuForUnit();
        $queryParameters = [
            'unitId'=>$id,
            'userId'=>$this->me->user->getUserId(),
            'groupId'=>$hasGroup?$request->query->get('groupId'):''
        ];

        $rawData = $this->util->fetch($query,$queryParameters);

        $unit=array();
        foreach($rawData as $row){
            $row = json_decode(json_encode($row));
            $unit[]=$this->makePage($row);
        }
        return new JsonResponse($unit);
    }
    private function stampUserRole($classData){

    }
    private function makeUnits($rawData){
        $units = array();
        $superUnits = array();
        foreach($rawData as $row){
            $row = json_decode(json_encode($row));
            if(@$row->superUnitId){
                Utility::addToObjectIfNotExists($row->superUnitId,array(
                    'id'=>$row->superUnitId,
                    'name'=>$row->superUnitName,
                    'units'=>array()
                ),$superUnits);
            }

            if(!isset($units[$row->id])) {
                $units[$row->id] = new \stdClass();
                $units[$row->id]->id = $row->id;
                $units[$row->id]->position = $row->name;
                $units[$row->id]->description = $row->description;
                $units[$row->id]->pages = array();
                if(@$row->superUnitId){
                    Utility::addToArrayIfNotExists(count($units)-1,$superUnits[$row->superUnitId]['units']);
                }

            }

            if($row->header_id>0){
                if(!isset($units[$row->id]->pages[$row->header_id]->pages)) {
                    $units[$row->id]->pages[$row->header_id] = new \stdClass();
                    @($units[$row->id]->pages[$row->header_id]->pages = array());
                    $units[$row->id]->pages[$row->header_id]->layout = 'header';
                    $units[$row->id]->pages[$row->header_id]->position = $row->page_position;

                }
                if(!$row->hide_activity==1){
                    $page = $this->makePage($row);
                    if(!is_null($page)){
                        $units[$row->id]->pages[$row->header_id]->pages[]=$page;
                    }

                }

            }else{
                if(!$row->hide_activity==1) {
                    $page = $this->makePage($row);
                    if(!is_null($page)){
                        $units[$row->id]->pages[$row->page_id] = $page;
                    }
                }
            }

        }

        foreach($units as &$unit){
            $unit->pages = array_values($unit->pages);
        }
        $this->checkAllowedPages($units);
        return array($units,$superUnits);
    }

    private function makePage($row){

        if (!isset($row->hide_group)){
            $row->hide_group = 0;
        }
        $highest_score = floatval($row->highest_score);
        if($highest_score>0 && boolval($row->keep_highest_score)){
            $row->quiz_score = $highest_score;
            $row->is_finished=1;
        }
        if(strtolower($row->layout)=='journal'){
            $row->grade = JournalController::_getStudentGrade($row->page_id,$_SESSION['USER']['ID']);
        }

        $nav_item = new \stdClass();
        $nav_item->id     = $row->page_id;
        $nav_item->is_suspended     = $row->is_suspended;
        $nav_item->finished_the_class     = $row->finished_the_class;
        $nav_item->position     = $row->page_position;
        $nav_item->header_id = $row->header_id;
        $nav_item->external_link = '';
        $nav_item->layout = strtolower($row->layout);
        $nav_item->label  = $row->pagename;
        $nav_item->subtitle  = $row->subtitle;
        $nav_item->allow_video_post = $row->allow_video_post;
        $nav_item->allow_text_post = $row->allow_text_post;
        $nav_item->allow_upload_post = $row->allow_upload_post;
        $nav_item->allow_upload_only_post = $row->allow_upload_only_post;
        $nav_item->is_gradeable_post = $row->is_gradeable;
        $nav_item->hide_activity = $row->hide_activity;
        $nav_item->hide_group = $row->hide_group;
        $nav_item->due_date = $row->class_due_date;
        $nav_item->no_due_date =  ($row->no_due_date == '1')? true:false;
        $nav_item->total_points = $row->total_points;
        $nav_item->created = $row->created;
        $nav_item->isSubmitted = ($row->created)? true : false;
        $nav_item->overrideDeleted = boolval(@$row->overrideDeleted);
        $nav_item->isGraded = (($row->grade !== null || @$row->quiz_score !== null || @$row->scoreOverride !== null) && !$nav_item->overrideDeleted)? true : false;
        $nav_item->is_gradeable = $row->is_gradeable;
        $nav_item->graded = $row->graded;
        $nav_item->grade = $row->grade;
        $nav_item->quiz_score = $row->quiz_score;
        $nav_item->teacher_notes = $row->teacher_notes;
        $nav_item->quiz_id = $row->quiz_id;
        $nav_item->showDate = $row->showDate;
        $nav_item->showGrades = $row->showGrades;
        $nav_item->isViewed = $row->isViewed==1;
        $nav_item->gate = $row->gate;
        $nav_item->isExempt = $row->isExempt;
        $nav_item->minimum_score = $row->minimum_score;
        $nav_item->scoreOverride = $row->scoreOverride;
        $nav_item->overrideBy = $row->overrideBy;
        $nav_item->overrideOn = $row->overrideOn;
        $nav_item->showMastery = boolval($row->show_mastery);
        $nav_item->disableVisualIndicators = boolval(@$row->disable_visual_indicators) || boolval(@$row->parent_disable_visual_indicators);
        $nav_item->masteryPercentage = $row->mastery_percentage;
        $countAsFinished = boolval($row->is_finished) || !boolval(@$row->can_return);
        if($nav_item->isExempt && boolval(@$row->pageGroupExempted)){
            if(!boolval(@$row->pageGroupExemptedIncludingContentPages)){
                $nav_item->disableVisualIndicators = true;
                if($nav_item->layout=='header' || ($nav_item->layout=='content' && !boolval(@$row->is_gradeable))){
                    $nav_item->isExempt=false;
                    $row->isExempt=false;
                }
            }
        }
        if(boolval($row->hide_exempted_activities) && boolval($row->isExempt) && $nav_item->layout!='header'){
            return null;
        }
        if(intval(@$row->resubmissions) && !$nav_item->isGraded){
            $nav_item->grade = PostsController::getPageLatestGrade($row->page_id,$_SESSION['USER']['ID']);
            if($nav_item->grade){
                $nav_item->isGraded = true;
                $nav_item->waitingForGrade = true;
            }

        }
        if($nav_item->isGraded && $row->gradedPostDate < $row->lastPostDate){
            $nav_item->waitingForGrade = true;
        }

        if(!is_null($nav_item->quiz_score) && $countAsFinished){
            $nav_item->isSubmitted = true;
            $max_points = $this->getMaxPoints($nav_item,$row);
            $nav_item->total_points = $max_points ;
            $nav_item->max_quiz_points = $max_points;
        }
        if($nav_item->layout=='quiz'){
            $nav_item->waitingForGrade=boolval(QuizController::_isWaitingForGrade($row->page_id,$_SESSION['USER']['ID']));
        }
        //get the score from gradebook
        $score = self::getPageGrade($row->page_id,$this->me->user->getUserId());
        if($score){
            $nav_item->isGraded = true;
            $nav_item->isSubmitted = true;
        }
        //$score = $nav_item->scoreOverride?$nav_item->scoreOverride:($nav_item->grade?$nav_item->grade:$nav_item->quiz_score);
        //$score = $nav_item->overrideDeleted?null:$score;
        $nav_item->points = array(
            'score'=>$score,
            'max'=>$nav_item->total_points
        );
        if(boolval($row->is_survey)){
            $nav_item->points['max'] = floatval($row->survey_points);
            if(boolval($row->is_finished)){
                $nav_item->points['score'] = floatval($row->survey_points);
            }
        }
        if($nav_item->showMastery && $nav_item->isGraded){
            $nav_item->mastery=floatval($nav_item->points['score']/$nav_item->points['max'])*100>=intval($nav_item->masteryPercentage);
        }
        if(@$nav_item->minimum_score_for_completion && @$nav_item->isGraded){
            $nav_item->minimumNotAchieved=floatval($nav_item->points['score'])/floatval($nav_item->points['max'])*100<intval($nav_item->minimum_score_for_completion);
        }

        $this->getIcon($nav_item);

        if($nav_item->layout == 'external_link') {
            $nav_item->external_link = $row->content;
        }
        $this->checkGatePage($nav_item,$row);

        return $nav_item;
    }
    //TODO: hide all unnecessary info for not allowed pages
    private function checkPage($page,$unitPosition){
        if(is_null($this->gatePage)){
            return true;
        }
        if(intval($unitPosition)<intval($this->gatePage['unitPosition'])) {
            return true;
        }
        if(intval($unitPosition)>intval($this->gatePage['unitPosition'])) {
            return false;
        }
        if(intval($page->position)<=intval($this->gatePage['pagePosition'])) {
            return true;
        }
        return false;

    }
    private function checkAllowedPages(&$units){
        foreach($units as &$unit) {
            foreach ($unit->pages as &$page) {

                if (isset($page->pages)) {
                    foreach ($page->pages as &$child) {

                        $child->isAllowed = $this->checkPage($child, $unit->position) && ($child->is_suspended==0) && ($child->finished_the_class==0) && !$this->classExpired ;
                        $child->isAllowed = $child->isAllowed&& $page->isExempt!='1';
                    }
                } else {
                    $page->isAllowed = $this->checkPage($page, $unit->position) && ($page->is_suspended==0) && ($page->finished_the_class==0) && !$this->classExpired && !$page->isExempt;
                }
            }
        }
    }
    private function isClassExpired($expiration_date=null){
        if(!$expiration_date){
            return false;
        }
        return (new \DateTime($expiration_date)) < (new \DateTime());
    }
    private function requires_submission($page){
        return $page->allow_video_post == '1' ||
        $page->allow_text_post == '1' ||
        $page->is_gradeable_post == '1'  ||
        strpos('quiz',$page->layout)!==false;
    }
    private function wasCompleted($page){
        return ($this->requires_submission($page) && ($page->isGraded||$page->isSubmitted)) ||
        (!$this->requires_submission($page) && ($page->isViewed));
    }
    private function checkGatePage($page,$row){

        if(!@$page->isExempt && is_null($this->gatePage) && $page->gate==1 && !$this->wasCompleted($page) || intval($page->minimum_score)>intval($page->points['score'])){
            $this->gatePage=array(
                'unitPosition'=>$row->name,
                'unitId'=>$row->id,
                'id'=>$row->page_id,
                'pagePosition'=>$row->page_position,
            );
        }

    }
    private function getMaxPoints($nav_item,$row){

        if(!is_null($row->quiz_max_points)){
            if($row->quiz_max_points==0){
                return floatval(QuizController::_getQuizMaxPoints($nav_item->quiz_id));
            }
            return $row->quiz_max_points;
        }
        if($row->random){
            return $row->random;
        }
        if($nav_item->layout=='vocab_quiz'){
            $max_points = $this->getVocabMaxPoints($nav_item->id);
            return $max_points;
        }
        return $this->getQuizMaxPoints($nav_item->quiz_id);
    }

    private function getVocabMaxPoints($pageId){
        $vocabs = $this->util->fetch($this->queryGetVocabs,['pageId'=>$pageId]);
        return count($vocabs);

    }
    private function getQuizMaxPoints($quizId){
        $max = $this->util->fetch($this->queryGetQuizQuestions,['quizId'=>$quizId]);
        return $max[0]['max'];

    }
    private function getIcon(&$nav_item){
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
    }

    private function checkPermissions()
    {
        $this->me = UserController::me($this->reader);
        if (!$this->me) {
            throw new HttpException(403, 'Not logged in');
        }
    }

    public static function getPageGrade($pageId,$userId){
        return Utility::getInstance()->fetchOne(self::$queryGetGradeFromGradebook,['pageId'=>$pageId,'userId'=>$userId]);
    }

    /*QUERY: get vocabularies */
    private $queryGetVocabs = <<<SQL
        SELECT vocabularies.id FROM vocabularies
        LEFT JOIN pages ON vocabularies.module_id = pages.moduleid
        WHERE pages.id = :pageId
SQL;
    /*QUERY: get questions */
    private $queryGetQuizQuestions = <<<SQL
        SELECT sum(max_points) as max
        from quiz_questions
        join questions on questions.id = quiz_questions.question_id
         WHERE quiz_id = :quizId

SQL;
    private $queryGetGroupClassInfo = <<<SQL
      SELECT pr.*,classes.id,
              classes.courseid as courseId,
              classes.show_table_of_contents,
              classes.name,
              show_dates as showDates,
              show_grades as showGrades,
              show_grades_as_letter,
              show_grades_as_percentage,
              show_grades_as_score,
              groups.name as groupName,
              groups.id as groupId,
              organizations.id as orgId,
              organizations.use_custom_progress_bar,
              organizations.custom_progress_bar

         FROM classes
          JOIN groups ON groups.classid = classes.id
          LEFT JOIN user_classes uc on uc.classid = classes.id and uc.userid=:userId and uc.groupid = groups.id
          LEFT JOIN progress_report pr ON pr.classid = classes.id and pr.userid = uc.userid
          JOIN courses ON (classes.courseid=courses.id)
          JOIN departments ON courses.departmentid = departments.id
          JOIN organizations on departments.organizationid = organizations.id
         WHERE classes.courseid=:menuId and groups.id=:groupId
SQL;
    private $queryGetClassInfo = <<<SQL
      SELECT pr.*,
              classes.id,
              classes.courseid as courseId,
              classes.show_table_of_contents,
              classes.name,
              show_dates as showDates,
              show_grades as showGrades,
              show_grades_as_letter,
              show_grades_as_percentage,
              show_grades_as_score,
              expiration_date,
              organizations.id as orgId,
              organizations.use_custom_progress_bar,
              organizations.custom_progress_bar

         FROM classes
         LEFT JOIN user_classes uc on uc.classid = classes.id and uc.userid=:userId
         LEFT JOIN progress_report pr ON pr.classid = classes.id and pr.userid = uc.userid
         JOIN courses ON (classes.courseid=courses.id)
          JOIN departments ON courses.departmentid = departments.id
          JOIN organizations on departments.organizationid = organizations.id
         WHERE classes.courseid=:menuId
SQL;
    public static $queryGetGradeFromGradebook = <<<SQL
    SELECT score FROM gradebook WHERE pageid=:pageId AND userid=:userId
SQL;

    /*QUERY MENU*/
    private function queryGetMenuForUnit() {
        $qb = $this->reader->createQueryBuilder();
        $qb->select("
            pages.allow_video_post,
            pages.allow_text_post, pages.allow_upload_post, pages.allow_upload_only_post, pages.is_gradeable, pages.hide_activity, pages.id as 'page_id',
            pages.pagegroupid as 'header_id', pages.layout, pages.name as 'pagename',pages.position as page_position,
            pages.gate,pages.minimum_score,
            user_classes.is_suspended,
            user_classes.finished_the_class,
            sov.score AS scoreOverride,
            sov.is_deleted as overrideDeleted,
            sov.byUserId AS overrideBy,
            sov.date AS overrideOn,
            pages.subtitle,
            pages.content,
            class_assignments.due as 'class_due_date',
            class_assignments.no_due_date,
            class_assignments.points as 'total_points',
            posts.created,
            grade_posts.teacher_notes,
            grade_posts.grade,
            grade_posts.created as 'graded',
            quiz_scores.score as 'quiz_score',
            quiz_scores.max_points as quiz_max_points,
            pages.quiz_id,
            pages.can_return,
            pages.minimum_score_for_completion,
            classes.show_dates as 'showDate',
            classes.is_active as 'is_active',
            classes.is_active as 'is_active',
            classes.show_grades as 'showGrades',
            pageGroup.disable_visual_indicators as parent_disable_visual_indicators,
            IFNULL(hiddenpages.hidden_group, 0) AS hidden_group,
            if(ah.time_in is null, 0, 1) as isViewed,
            quizzes.random");
        $qb->from("`user_classes`
            JOIN classes ON (user_classes.classid=classes.id)
            JOIN units ON (classes.courseid=units.courseid) and units.hide_from_student = 0
            LEFT JOIN pages ON (pages.unitid=units.id)
            LEFT JOIN quizzes on pages.quiz_id = quizzes.id
            LEFT JOIN class_assignments ON (class_assignments.page_id=pages.id)
            LEFT JOIN (
                SELECT MAX(id) AS id, pageid, userid, created,,max(posts.created) as lastPostDate
                FROM posts WHERE userid = :userId and (groupid = :groupId or groupid is null) AND is_deleted = 0 GROUP BY pageid
            ) AS posts ON posts.pageid=pages.id
            LEFT JOIN (SELECT * FROM grade_posts order by created DESC ) as grade_posts
				 ON (grade_posts.post_id=posts.id)
            LEFT JOIN quiz_scores ON quiz_scores.quiz_id=pages.id AND quiz_scores.user_id=user_classes.userid
            LEFT JOIN (
                SELECT id, hide_activity AS hidden_group
                FROM pages
                WHERE hide_activity = 1
            ) AS hiddenpages ON (hiddenpages.id = pages.pagegroupid)
            LEFT JOIN activity_history ah ON ah.userid = user_classes.userid and ah.pageid = pages.id
            LEFT JOIN pages pageGroup ON pageGroup.id = pages.pagegroupid
            LEFT JOIN scores_overrides sov ON pages.id = sov.pageId AND user_classes.userid = sov.userId AND classes.id = sov.classId");


        $qb->where('units.id=:unitId');
        $qb->andWhere("user_classes.userid=:userId");
        $qb->andWhere("user_classes.groupid=:groupId or user_classes.groupid is null");
        $qb->groupBy("pages.id,units.name");
        $qb->orderBy("pages.position");
        return $qb->getSQL();
    }
    /*QUERY MENU*/
    private function queryGetMenu() {
        $qb = $this->reader->createQueryBuilder();
        $qb->select("units.id, units.name, units.description, pages.allow_video_post,
            pages.allow_text_post, pages.allow_upload_post, pages.allow_upload_only_post, pages.is_gradeable, pages.hide_activity, pages.id as 'page_id',
            pages.pagegroupid as 'header_id', pages.layout, pages.name as 'pagename',pages.position as page_position,
            pages.gate,pages.minimum_score,
            user_classes.is_suspended,
            user_classes.finished_the_class,
            sov.score AS scoreOverride,
            sov.is_deleted as overrideDeleted,
            sov.byUserId AS overrideBy,
            sov.date AS overrideOn,
            pages.subtitle,
            pages.content,
            pages.show_mastery,
            pages.mastery_percentage,
            if(gb.due_date,gb.due_date,class_assignments.due) as 'class_due_date',
            class_assignments.no_due_date,
            class_assignments.points as 'total_points',
            posts.created,
            posts.resubmissions,
            grade_posts.teacher_notes,
            grade_posts.grade,
            grade_posts.created as 'graded',
            quiz_scores.score as 'quiz_score',
            quiz_scores.max_points as quiz_max_points,
            quiz_scores.is_finished,
            quiz_scores.highest_score,
            quizzes.is_survey,
            quizzes.keep_highest_score,
            pages.survey_points,
            pages.quiz_id,
            pages.minimum_score_for_completion,
            classes.show_dates as 'showDate',
            classes.show_grades as 'showGrades',
            classes.is_active as 'is_active',
            classes.hide_exempted_activities,
            IFNULL(hiddenpages.hidden_group, 0) AS hidden_group,
            IF(ce.exemptedBy IS NULL, 0, 1) AS isExempt,
            ce.page_group as pageGroupExempted,
            ce.all_pages as pageGroupExemptedIncludingContentPages,
            if(ah.time_in is null, 0, 1) as isViewed,
            posts.lastPostDate,
            grade_posts.gradedPostDate,
            pageGroup.disable_visual_indicators as parent_disable_visual_indicators,
            su.id as superUnitId,
            su.name as superUnitName,
            quizzes.random");
        $qb->from("`user_classes`
            JOIN classes ON (user_classes.classid=classes.id)
            JOIN units ON (classes.courseid=units.courseid) and units.hide_from_student = 0
            LEFT JOIN super_units su ON su.id = units.superunitid
            LEFT JOIN pages ON (pages.unitid=units.id)
            LEFT JOIN quizzes on pages.quiz_id = quizzes.id
            LEFT JOIN class_assignments ON (class_assignments.page_id=pages.id)
            LEFT JOIN (SELECT posts.*, count(posts.id) as resubmissions,max(posts.created) as lastPostDate FROM
                (SELECT posts.id, pageid, userid, posts.created,postrootparentid
                FROM posts JOIN pages on pages.id = posts.pageid WHERE userid = :userId and if(pages.automatically_grade=0,posts.id = posts.postrootparentid,1) AND is_deleted = 0 order by posts.created desc
            ) posts  GROUP BY pageid) AS posts ON posts.pageid=pages.id
            LEFT JOIN (
              SELECT grade_posts.teacher_notes,grade_posts.grade,grade_posts.created,posts.pageid,posts.userid,grade_posts.post_id,posts.created as gradedPostDate
              from grade_posts
              join posts on posts.id = grade_posts.post_id
              where posts.userid = :userId and posts.is_deleted = 0
              order by grade_posts.created) as grade_posts
				 ON (grade_posts.pageid = pages.id and grade_posts.userid = :userId and posts.id=grade_posts.post_id)

            LEFT JOIN quiz_scores ON quiz_scores.quiz_id=pages.id AND quiz_scores.user_id=user_classes.userid
            LEFT JOIN (
                SELECT id, hide_activity AS hidden_group
                FROM pages
                WHERE hide_activity = 1
            ) AS hiddenpages ON (hiddenpages.id = pages.pagegroupid)
            LEFT JOIN activity_history ah ON ah.userid = user_classes.userid and ah.pageid = pages.id
            LEFT JOIN pages pageGroup ON pageGroup.id = pages.pagegroupid
            LEFT JOIN scores_overrides sov ON pages.id = sov.pageId AND user_classes.userid = sov.userId AND classes.id = sov.classId
            LEFT JOIN gradebook gb ON gb.userid = user_classes.userid and gb.pageid = pages.id
            LEFT JOIN (SELECT caId,page_group,all_pages, byUserId AS exemptedBy FROM class_exempted WHERE userId = :userId) ce
              ON if(ce.page_group=1,
                    ce.caId = pages.id or (ce.caId = pageGroup.id and pages.layout='CONTENT' and pages.is_gradeable<>1),
                    ce.caId = class_assignments.id)
            ");


        $qb->where('classes.courseid=:menuId');
        $qb->andWhere("user_classes.userid=:userId");
        $qb->andWhere("user_classes.groupid=:groupId or user_classes.groupid is null");
        $qb->groupBy("pages.id,units.name");
        $qb->orderBy("su.position,units.name, pages.position");

        return $qb->getSQL();

    }
}
