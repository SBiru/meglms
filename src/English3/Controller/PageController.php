<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\QuizController;
use English3\Controller\VocabController;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\Response;
use English3\Controller\CloneController;
use English3\Controller\ClassesController;
use English3\Controller\Organization\OrganizationController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PageController
{

    private $util;
    private $me;

    public function __construct(Connection $reader)
    {

        Utility::getInstance()->reader = $reader;
        $this->util = new Utility($reader);

    }

    public function get(Request $request, $id = null)
    {
        $this->me = UserController::me(Utility::getInstance()->reader);
        if (!$this->me) {
            throw new HttpException(403, 'Not logged in');
        }
        $dbpassword = $this->util->fetchOne(self::$queryGetPagePassword, array('pageId' => $id));
        if (!empty($dbpassword)) {
            if (!$this->me->isTeacher()) {
                $parampassword = $request->query->get('password');
                if ($dbpassword != $parampassword) {
                    if (empty($parampassword)) {
                        return new JsonResponse(array(
                            'id' => intval($id),
                            'locked' => true,
                            'error'=>'Invalid password'
                        ));
                    } else {
                        throw new HttpException(403, 'Wrong password: ' . $parampassword);
                    }
                }
            } else {
                $testpassword = $request->query->get('testpassword');
                if ($testpassword) {
                    if ($dbpassword == $testpassword) {
                        return new JsonResponse(true);
                    } else {
                        return new JsonResponse(false);
                    }
                }
            }
        }
        $userId = $request->query->get('userId');
        $userId = ($userId && $this->me->isTeacher()) ? $userId : $this->me->user->getUserId();
        $page = self::_get(Utility::getInstance()->reader, $id, $this->me->isTeacher(), $userId);
        if($request->query->get('includeMeta')){
            $page = array_merge($page,PageController::_getPageMeta($id));
        }
        if (!$page) {
            $page['error'] = 'Page not found';
        }
        return new JsonResponse($page);
    }

    public function giveExtraAttempt(Request $request, $id, $userId)
    {
        $this->me = UserController::me(Utility::getInstance()->reader);
        if (!$this->me) {
            throw new HttpException(403, 'Not logged in');
        }
        if (!$this->me->isTeacher()) {
            throw new HttpException(403, 'You must be a teacher');
        }
        $page = self::_get(Utility::getInstance()->reader, $id, $this->me->isTeacher(), $userId);
        $invalid = !$page
            || !array_key_exists('quiz', $page)
            || !array_key_exists('completedAttempts', $page['quiz'])
            || intval($page['quiz']['completedAttempts']) < 1;
        if(array_key_exists('extraAttemptOption', $page)){
            PageController::_subContentPageAttempts($page['id'], $userId);
            return new JsonResponse($page);
        }
        if ($invalid) {
            throw new HttpException(400, 'Page was not found or this operation is not valid on this page');
        }
        if (QuizController::_giveExtraAttempt(Utility::getInstance()->reader, $page['id'], $userId)) {
            $page['quiz']['completedAttempts']--;
        }
        return new JsonResponse($page);
    }

    public function movePage(Request $request, $id)
    {
        $body = json_decode($request->getContent());
        if (!isset($body->toUnit)) {
            throw new HttpException(400, 'Required: toUnit');
        }
        if (!isset($body->toPosition) || intval($body->toPosition) <= 0) {
            throw new HttpException(400, 'Required: toPosition');
        }
        $orgId = OrganizationController::_getFromUnit($body->toUnit);
        $classId = ClassesController::_getFromPage(Utility::getInstance()->reader, $id);

        //checking for edit permissions
        $this->util->checkEditTeacher($classId, $orgId);


        return new JsonResponse(self::_movePage(Utility::getInstance()->reader, $id, $body->toUnit, $body->toPosition));
    }
    public function updatePasswords(Request $request, $classId){
        Utility::getInstance()->checkTeacher($classId);
        Utility::clearPOSTParams($request);

        if($request->request->has('pages')){
            $values = array();
            foreach($request->request->get('pages') as $page){
                $values[] = "('".$page['id']."','".$page['password']."')";
            }
            $query = str_replace(':values',implode(",",$values),$this->queryUpdatePasswords);
            Utility::getInstance()->insert($query);
        }
        return new JsonResponse('ok');
    }
    public function moveToUnit(Request $request, $id, $unitId)
    {
        if (self::_moveToUnit(Utility::getInstance()->reader, $id, $unitId)) {
            return new JsonResponse(['ok' => true]);
        }
        throw new HttpException(500, "Invalid page or unit");
    }
    public static function _getOption($id,$field){
        return Utility::getInstance()->fetchOne(
            self::$queryGetPage,
            array('pageId' => $id),
            $field
        );
    }
    public static function isGradeable( $id){
        return boolval(Utility::getInstance()->fetchOne(self::$queryIsGradeable,['id'=>$id]));
    }

    public static function _get(Connection $reader, $id, $isTeacher = false, $userId = null)
    {
        $util = Utility::getInstance();

        $me = UserController::me($reader);
        $page = $util->fetchRow(
            self::$queryGetPage,
            array('pageId' => $id)
        );
        $result = array();
        if ($page) {
            // get page, unit, and pagegroup (if not null)
            $result = array(
                'id' => intval($id),
                'name' => $page['name'],
                'position' => intval($page['position']),
                'created' => strtotime($page['created']) * 1000,
                'hide' => boolval($page['hide_activity'])
            );
            if ($page['assignmentId']) {
                $result['assignmentId'] = intval($page['assignmentId']);
                if ($me->isTeacher()) {
                    $result['exemptStudents'] = self::getExemptStudents($reader, $result['assignmentId']);
                }
                $result['maxPoints']=floatval($page['points']);
            }
            // add sub-pages (if any)
            $subpages = $util->fetch(
                self::$queryGetSubPages,
                array('pageId' => $id)
            );
            if ($subpages) {
                $result['subPages'] = array();
                foreach ($subpages as $subpage) {
                    $result['subPages'][] = array(
                        'id' => intval($subpage['id']),
                        'name' => $subpage['name']
                    );
                }
            } else {
                $result['subtitle'] = $page['subtitle'];
                $result['content'] = $page['content'];
                $result['layout'] = strtolower($page['layout']);
                $result['objective'] = $page['objective'];
                $result['showObjective'] = boolval($page['show_objectives']);
                $result['allowVideo'] = boolval($page['allow_video_post']);
                $result['allowText'] = boolval($page['allow_text_post']);
                $result['allowUpload'] = boolval($page['allow_upload_post']);
                $result['allowTemplate'] = boolval($page['allow_template_post']);
                $result['isPrivate'] = boolval($page['is_private']);
                $result['isGradeable'] = boolval($page['is_gradeable']);
                $result['isGate'] = boolval($page['gate']);
                $result['rubricId'] = intval($page['rubricid']);
                $result['hasPassword'] = !empty($page['password']);
                if ($isTeacher && $result['hasPassword']) {
                    $result['password'] = $page['password'];
                }
                $result['requireSubmission']=$result['allowVideo']||
                                            $result['allowText'] ||
                                            $result['allowUpload'] ||
                                            $result['allowTemplate'];
                if ($page['layout']=='JOURNAL') {
                    $result['gradingType']=$page['journal_grading_type'];
                }
                if ($page['pagegroupid']) {
                    $result['parent'] = array(
                        'id' => intval($page['pagegroupid']),
                        'name' => $page['pagegroupname']
                    );
                } else {
                    $result['parent'] = null;
                }
            }
            // add unit info
            $result['unit'] = array(
                'id' => intval($page['unitid']),
                'number' => intval($page['unitnumber']),
                'name' => $page['unitname']
            );
            // QUIZZES (quiz, quiz_list)
            if (boolval($page['quiz_id']) || $result['layout'] == 'quiz_list') {
                $quiz = null;
                $userId = ($userId) ? $userId : $me->user->getUserId();
                // check if page has quiz and add it
                if (boolval($page['quiz_id'])) {
                    $quiz = QuizController::_get($reader, $page['quiz_id'], $userId, $id);
                }
                // check if page has quiz_list (random quiz from matching string 'searchquiz')
                if ($result['layout'] == 'quiz_list') {
                    $quiz = QuizController::_getFromString($reader, $page['searchquiz'], $userId, $id);
                    $result['layout'] = 'quiz';
                }
                if ($quiz) {
                    $result['quiz'] = $quiz;
                    $result['quiz']['canReturn'] = boolval($page['can_return']);
                    $result['quiz']['timeLimit'] = ($page['time_limit']) ? intval($page['time_limit']) : null;
                    $result['quiz']['allowedTakes'] = ($page['allowed_takes']) ? intval($page['allowed_takes']) : 0;
                }
            }
            if ($result['layout'] == 'content') {

                $contentPageAttempts = PageController::_getContentPageAttempts($id,$userId);
                if($contentPageAttempts){
                    $postLimit = PageController::_getPageMeta($id,'post_limit');
                    if($postLimit){
                        if($contentPageAttempts['attempts_completed']>=$postLimit){
                            $result['extraAttemptOption'] = true;
                        }
                    }
                }
                else{
                    $postLimit = PageController::_getPageMeta($id,'post_limit');
                    if($postLimit){
                        $totalPosts = PostsController::_getTotalUserPostsForPage($id,$userId);
                        PageController::_setContentPageAttempts($id, $userId, $totalPosts);
                        if($totalPosts>=$postLimit){
                            $result['extraAttemptOption'] = true;
                        }
                    }
                }


                $postLimit = PageController::_getPageMeta($id,'post_limit');
                if($postLimit){
                    $totalPosts = PostsController::_getTotalUserPostsForPage($id,$userId);
                    if($totalPosts==$postLimit){
                        $result['extraAttemptOption'] = true;
                    }
                }
            }
            // VOCAB layout
            if ($result['layout'] == 'vocab') {
                $result['moduleId'] = intval($page['moduleid']);
                $result['phrases'] = VocabController::_get($reader, $page['moduleid']);
            }
            // VOCAB_QUIZ layout
            if ($result['layout'] == 'vocab_quiz') {
                $result['moduleId'] = intval($page['moduleid']);
                $result['questions'] = VocabController::_get($reader, $page['moduleid'], true);
                $result['allowedTakes'] = ($page['allowed_takes']) ? intval($page['allowed_takes']) : 0;
                if ($isTeacher) {
                    $result['phrases'] = VocabController::_get($reader, $page['moduleid']);
                }
            }
            // LESSON_LISTENING layout
            if ($result['layout'] == 'lesson_listening') {
                $defaultLang = 'ENG';
                $result['layout'] = 'listening';
                $result['params'] = array(
                    'email' => $me->user->getEmail(),
                    'firstName' => $me->user->getFirstName(),
                    'nativeLang' => (boolval($page['native_lang'])) ? $page['native_lang'] : $defaultLang,
                    'targetLang' => (boolval($page['target_lang'])) ? $page['target_lang'] : $defaultLang,
                    'appName' => 'lessonListening',
                    'course' => $page['listen_course'],
                    'lesson' => $page['listen_lesson'],
                    'exNumber' => intval($page['listen_numEx'])
                );
            }
        }
        return $result;
    }

    public static function _getPageMeta($pageId, $key = null)
    {
        $util = new Utility();
        if (is_null($key)) {
            $data = $util->fetch(self::$queryGetPageMetaData, ['pageId' => $pageId]);
            $arrayData = array();
            foreach ($data as $row) {
                $arrayData[$row['meta_key']] = $row['meta_value'];
            }
            return $arrayData;
        } else {
            return $util->fetchOne(self::$queryGetPageMetaKey, ['pageId' => $pageId, 'metaKey' => $key]);
        }

    }
    public static function _getPagePoints($pageId,$classId){
        $util = new Utility();
        return floatval($util->fetchOne(self::$queryGetPagePoints,[
            'pageId'=>$pageId,
            'classId'=>$classId
        ]));
    }

    /* Get all students exempt in this class (0 or more) */
    public static function getExemptStudents(Connection $reader, $assignmentId,$credited = false)
    {
        $util = new Utility($reader);
        $data = $util->fetch(
            self::$queryGetExemptStudents,
            array('assignmentId' => $assignmentId,'credited'=>$credited)
        );
        $exemptStudents = array();
        foreach ($data as $exemptStudent) {
            $exemptStudents[] = array(
                'id' => intval($exemptStudent['userId']),
                'comments' => $exemptStudent['comments'],
                'date' => strtotime($exemptStudent['date']) * 1000,
                'firstName' => $exemptStudent['fname'],
                'lastName' => $exemptStudent['lname'],
                'email' => $exemptStudent['email'],
                'byUser' => intval($exemptStudent['byUserId'])
            );
        }
        return $exemptStudents;
    }
    public function updateMaxScore(Request $request, $id) {
        $requiredFields = ['newScore','oldScore'];
        $util = new Utility();
        $util->checkRequiredFields($requiredFields,$request->query->all());

        $newScore = $request->query->get('newScore');
        $oldScore = $request->query->get('oldScore');

        return new JsonResponse(self::_updateMaxScore($id,$newScore,$oldScore));
    }

    private static function _isMovingToPageGroup(Connection $reader, $position, $unitId)
    {
        //if moving to top the pagegroup should be 0
        if ($position == 0) {
            return 0;
        }
        $util = new Utility($reader);

        $pageGroup = $util->fetchOne(self::$queryGetPageFromPosition, ['unitId' => $unitId, 'position' => $position], 'pagegroupid');
        return intval($pageGroup);
    }

    public static function getPageGroupPages(Connection $reader, $pageId)
    {
        $util = new Utility($reader);
        return $util->fetch(CloneController::$queryGetPageGroupPages, ['pageId' => $pageId]);
    }

    //sometimes the position field is not consistent, We need to query and look for the right position
    private static function _rightPosition(Connection $reader, $position, $unitId)
    {
        $util = new Utility($reader);
        $pages = $util->fetch(self::$queryGetUnitPages, ['unitId' => $unitId]);
        if (!$pages) {
            return 0;
        }
        if (count($pages) > $position) {
            return $pages[$position]['position'];
        } else {
            return intval(array_pop($pages)['position']) + 1;
        }
    }

    public static function _updateMaxScore($pageId,$newScore,$oldScore,Connection $reader = null){
        if(!$reader){
            global $app;
            $reader = $app['dbs']['mysql_read'];
        }
        $instance = new ClassesController($reader);

        $pageInfo = $instance->util->fetchRow(self::$queryGetPage,['pageId'=>$pageId]);
        $classId = ClassesController::_getFromPage($reader,$pageId);
        $users = $instance->getUsers($classId);

        //new_grade = grade*coef
        $coef=floatval($newScore)/floatval($oldScore);

        foreach($users['students'] as $student){

            $grade = self::_studentGrade($pageId,$student['id'],$classId,$pageInfo['layout']);
            if($grade!==false){
                $instance->util->reader->delete(
                    'scores_overrides',
                    array(
                        'userId'=>$student['id'],
                        'pageId'=>$pageId,
                        'classId'=>$classId
                    )
                );

                if(isset($grade['quizScoreId'])){
                    $instance->util->reader->update(
                        'quiz_scores',
                        [
                            'score'=>floatval($grade['score'])*$coef,
                            'max_points'=>floatval($grade['max_points'])*$coef,
                        ],
                        ['id'=>$grade['quizScoreId']]
                    );
                    $grade=$grade['score'];
                }

                else{
                    $instance->util->insert(
                        self::$queryUpdateGradePosts,
                        [
                            'pageId'=>$pageId,
                            'coef'=>$coef
                        ]
                    );
                    $instance->util->insert(
                        ClassesController::$queryOverrideScore,
                        array(
                            'score' => floatval($grade)*$coef,
                            'userId'=>$student['id'],
                            'pageId'=>$pageId,
                            'classId'=>$classId,
                            'is_deleted'=>0,
                            'byUserId'=>$_SESSION['USER']['ID'],
                        )
                    );
                }
                $instance->util->reader->insert(
                    'page_maxpoints_log',
                    [

                        'pageid'=>$pageId,
                        'userid'=>$student['id'],
                        'changedBy'=>$_SESSION['USER']['ID'],
                        'old_score'=>$grade,
                        'new_score'=>floatval($grade)*$coef
                    ]
                );
                GradebookController::_recalculate($student['id'],$pageId);
            }
        }


        return ['ok'=>true];
    }
    public static function _studentGrade($pageId,$studentId,$classId,$pageType=null){
        $util = new Utility();
        if(!$pageType){
            $pageInfo = $util->fetchRow(self::$queryGetPage,['pageId'=>$pageId]);
            $pageType = $pageInfo['layout'];
        }

        $scoreOverride = $util->fetchOne(ClassesController::$queryGetScoreOverrideData,[
            'userId'=>$studentId,
            'pageId'=>$pageId,
            'classId'=>$classId
        ],
            'score');

        if(strpos($pageType,'QUIZ')!==false){
            $userQuizData = $util->fetchRow(
                QuizController::$queryGetUserQuizData,
                array(
                    'quizId' => $pageId,	// quiz_id in quiz_scores table is actually the page's id
                    'userId' => $studentId
                )
            );

            if($userQuizData){
                return [
                    'score'=>$scoreOverride?$scoreOverride:$userQuizData['score'],
                    'quizScoreId'=>$userQuizData['id'],
                    'max_points'=>$userQuizData['max_points']
                ];
            }
        }else{
            if($scoreOverride){
                return $scoreOverride;
            }
            $gradePostData = $util->fetchRow(
                self::$queryGetStudentGrade,
                array(
                    'pageId' => $pageId,
                    'userId' => $studentId
                )
            );
            if($gradePostData){
                return $gradePostData['grade'];
            }

        }
        return false;
    }

    private static function _movePageGroup(Connection $reader, $id, $targetUnitId, $newPosition, $page)
    {
        $oldPosition = $page['position'];
        $oldUnit = $page['unitid'];

        $children = self::getPageGroupPages($reader, $id);

        //moving up pages from old unit
        $reader->executeUpdate(self::$queryMovingPagesUp, ['unitId' => $oldUnit, 'startPosition' => $oldPosition + count($children), 'howMany' => count($children) + 1]);

        //moving down pages from new unit
        $reader->executeUpdate(self::$queryMovingPagesDown, ['unitId' => $targetUnitId, 'startPosition' => $newPosition, 'howMany' => count($children) + 1]);

        //updating our group
        $reader->update('pages', [
            'unitid' => $targetUnitId,
            'position' => $newPosition,
        ],
            ['id' => $id]);
        $newPosition++;

        foreach ($children as $childPage) {
            $reader->update('pages', [
                'unitid' => $targetUnitId,
                'position' => $newPosition,
            ],
                ['id' => $childPage['id']]);
            $newPosition++;
        }
        return ['ok' => true];

    }

    public static function _movePage(Connection $reader, $id, $targetUnitId, $newPosition)
    {
        $util = new Utility($reader);
        $page = $util->fetch(CloneController::$queryGetPage, array('pageId' => $id));
        $unit = $util->fetch(CloneController::$queryGetUnit, array('unitId' => $targetUnitId));
        if (!$page || !$unit) {
            // page and/or unit don't exist
            return false;
        }
        $page = array_pop($page);

        $oldPosition = $page['position'];
        $oldUnit = $page['unitid'];


        //looking for the right page position
        $newPosition = self::_rightPosition($reader, $newPosition - 1, $targetUnitId);

        // Getting the pagegroup of our destination. If the target position is not
        // inside a pagegroup, we will update the pagegroupid to 0
        $pageGroup = self::_isMovingToPageGroup($reader, intval($newPosition), $targetUnitId);

        $lastPage = $util->fetchOne(self::$queryGetUnitLastPage, ['unitId' => $targetUnitId]);


        //are we moving a group?
        if ($page['layout'] == 'HEADER') {
            if ($pageGroup) {
                //User is not allowed to move a group to inside another group
                throw new HttpException(403, 'Move a group to inside another group is not allowed');
            }
            return self::_movePageGroup($reader, $id, $targetUnitId, $newPosition, $page);
        }

        //moving up pages from old unit
        $reader->executeUpdate(self::$queryMovingPagesUp, ['unitId' => $oldUnit, 'startPosition' => $oldPosition, 'howMany' => 1]);


        if ($oldUnit == $targetUnitId && intval($newPosition) > intval($oldPosition) && $newPosition <= $lastPage) {
            $newPosition--;
        }

        //moving down pages from new unit
        $reader->executeUpdate(self::$queryMovingPagesDown, ['unitId' => $targetUnitId, 'startPosition' => $newPosition, 'howMany' => 1]);

        //updating our page
        $reader->update('pages', [
            'unitid' => $targetUnitId,
            'position' => $newPosition,
            'pagegroupid' => $pageGroup
        ],
            ['id' => $id]);
        return ['ok' => true];
    }
    public static function _getPageIdFromPost($postId){
        return Utility::getInstance()->fetchOne(self::$queryGetPageIdFromPost,['id'=>$postId]);
    }
    public static function _moveToUnit(Connection $reader, $id, $targetUnitId)
    {
        $util = new Utility($reader);
        $page = $util->fetch(CloneController::$queryGetPage, array('pageId' => $id));
        $unit = $util->fetch(CloneController::$queryGetUnit, array('unitId' => $targetUnitId));
        if (!$page || !$unit) {
            // page and/or unit don't exist
            return false;
        }
        $page = array_pop($page);
        $newPosition = CloneController::getNextPageNumber($reader, $targetUnitId);
        $oldPosition = $page['position'];
        $oldUnit = $page['unitid'];

        //moving up pages that are bellow our target page
        $reader->executeUpdate(self::$queryMovingPagesUp, ['unitId' => $oldUnit, 'startPosition' => $oldPosition, 'howMany' => 1]);

        //moving our page to the target unit
        $reader->update('pages', ['unitid' => $targetUnitId, 'position' => $newPosition], ['id' => $id]);

        return true;
    }

    public static function _hasQuizBeenTaken($pageId){
        $util = new Utility();
        $hasBeenTaken = $util->fetchOne(self::$queryHasQuizBeenTaken,['pageId'=>$pageId]);
        return !is_null($hasBeenTaken);
    }
    public static function _getByCaId($caId){
        $util = new Utility();
        return $util->fetchOne(self::$queryGetPageByCaId,['id'=>$caId]);
    }

    public static function _getContentPageAttempts($pageId, $userId){
        $util = new Utility();
        return $util->fetchRow(self::$queryGetContentPageAttempts,['page_id'=>$pageId, 'user_id'=>$userId]);
    }

    public static function _setContentPageAttempts($pageId, $userId, $attempts_completed){
        $util = new Utility();
        return $util->executeUpdate(self::$querySetContentPageAttempts,['page_id'=>$pageId, 'user_id'=>$userId, 'attempts_completed'=>$attempts_completed]);
    }

    public static function _addContentPageAttempts($pageId, $userId){
        $util = new Utility();
        return $util->execute(self::$queryAddContentPageAttempts,['page_id'=>$pageId, 'user_id'=>$userId]);
    }

    public static function _subContentPageAttempts($pageId, $userId){
        $util = new Utility();
        return $util->execute(self::$querySubContentPageAttempts,['page_id'=>$pageId, 'user_id'=>$userId]);
    }
    /* QUERY: Has a quiz page taken?? */
    private static $queryHasQuizBeenTaken = <<<SQL
		SELECT id FROM quiz_scores WHERE quiz_id=:pageId and is_finished=1 LIMIT 1
SQL;

    /* QUERY: get page's password */
    public static $queryGetPagePassword = <<<SQL
		SELECT password FROM pages WHERE id = :pageId
SQL;
    /* QUERY: get page's data */
    public static $queryGetPage = <<<SQL
		SELECT
			pages.*,
			units.id AS unitid,
			units.name AS unitnumber,
			units.description AS unitname,
			parent.name AS pagegroupname,
			ca.id AS assignmentId,
			ca.points
		FROM pages
		INNER JOIN units ON units.id = pages.unitid
		LEFT JOIN pages parent ON parent.id = pages.pagegroupid
		LEFT JOIN (SELECT * FROM class_assignments WHERE page_id = :pageId) ca ON ca.page_id = pages.id
		WHERE pages.id = :pageId;
SQL;
    private static $queryGetPageByCaId=<<<SQL
    SELECT page_id FROM class_assignments where id = :id
SQL;
    /* QUERY: get page's subpages  */
    private static $queryGetSubPages = <<<SQL
		SELECT id, name
		FROM pages
		WHERE pages.pagegroupid = :pageId;
SQL;
    /* QUERY: get assignment's exempt students  */
    private static $queryGetExemptStudents = <<<SQL
		SELECT ce.*, u.fname, u.lname, u.email
		FROM class_exempted ce
		JOIN (SELECT id, fname, lname, email FROM users) u ON ce.userId = u.id
		WHERE ce.caId = :assignmentId and if(:credited,ce.is_credited=1,ce.is_credited=0 or ce.is_credited is null);
SQL;
    /* QUERY: moving pages up*/
    public static $queryMovingPagesUp = <<<SQL
		UPDATE pages
		SET position = position - :howMany
		WHERE unitid = :unitId and position > :startPosition
SQL;
    /* QUERY: moving pages down*/
    public static $queryMovingPagesDown = <<<SQL
		UPDATE pages
		SET position = position + :howMany
		WHERE unitid = :unitId and position >= :startPosition
SQL;
    /* QUERY: get page based on its position*/
    public static $queryGetPageFromPosition = <<<SQL
		SELECT *
		FROM pages
		WHERE position = :position and unitid = :unitId
SQL;
    /* QUERY: get page based on its position*/
    public static $queryGetUnitPages = <<<SQL
		SELECT *
		FROM pages
		WHERE unitid = :unitId
		ORDER BY position
SQL;
    /* QUERY: get page based on its position*/
    public static $queryGetUnitLastPage = <<<SQL
		SELECT position
		FROM pages
		WHERE unitid = :unitId
		ORDER BY position desc limit 1
SQL;
    private static $queryGetPageMetaData = <<<SQL
		SELECT meta_key,meta_value
		FROM page_meta
		WHERE pageid = :pageId
SQL;
    private static $queryGetPageMetaKey = <<<SQL
		SELECT meta_value
		FROM page_meta
		WHERE pageid = :pageId and meta_key= :metaKey
SQL;
    private static $queryGetPagePoints = <<<SQL
		SELECT points
		FROM class_assignments
		WHERE page_id = :pageId and class_id = :classId
SQL;
    public static $queryGetStudentGrade = <<<SQL
      SELECT * FROM posts
        JOIN grade_posts on posts.id = grade_posts.post_id
        WHERE posts.pageid = :pageId and posts.userid = :userId
        ORDER BY grade_posts.created
        LIMIT 1;
SQL;
    public static $queryUpdateGradePosts = <<<SQL
      UPDATE grade_posts gp
      JOIN posts p on gp.post_id = p.id
      SET grade = grade * :coef
      WHERE p.pageid = :pageId
SQL;
    public static $queryGetUnitGradeablePages = <<<SQL
      SELECT * FROM pages WHERE unitid = :unitId and (is_gradeable=1 or layout like "%QUIZ%")
SQL;
    public static $queryGetPageIdFromPost = <<<SQL
    SELECT pageid FROM posts where id = :id
SQL;

    private $queryUpdatePasswords = "INSERT INTO pages (id,password) VALUES :values ON DUPLICATE KEY UPDATE password=values(password),last_password_change=CURRENT_TIMESTAMP()";

    private static $queryIsGradeable = <<<SQL
    SELECT if(layout= 'timed_review',1,p.is_gradeable) FROM pages p WHERE id = :id
SQL;

    private static $queryGetContentPageAttempts = <<<SQL
    SELECT * from content_page_attempts WHERE page_id = :page_id and user_id = :user_id
SQL;

    private static $querySetContentPageAttempts = <<<SQL
    INSERT INTO content_page_attempts (page_id, user_id, attempts_completed) VALUES (:page_id, :user_id, :attempts_completed)
SQL;

    private static $queryAddContentPageAttempts = <<<SQL
    UPDATE content_page_attempts SET attempts_completed = attempts_completed+1 WHERE page_id = :page_id and user_id = :user_id;
SQL;

    private static $querySubContentPageAttempts = <<<SQL
    UPDATE content_page_attempts SET attempts_completed = attempts_completed-1 WHERE page_id = :page_id and user_id = :user_id;
SQL;

}

?>