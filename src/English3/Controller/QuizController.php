<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Glossary\Glossary;
use English3\Controller\Glossary\GlossaryLinkOptions;
use English3\Controller\Glossary\GlossaryLinks;
use English3\Controller\QuizzesAndQuestions\QuestionTags\QuestionTagsFilter;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class QuizController {

	private $me;
	private $reader;
	private $util;
    private $prepareGlossary;
	public function __construct(Connection $reader) {
		$this->reader = $reader;
		$this->me = UserController::me($reader);
		$this->util = new Utility($reader);
	}

	/* Template */
	public function get(Request $request,$id) {
		return new JsonResponse(self::_get($this->reader,$id));
	}
	public function getOrgQuizzes(Request $request,$id) {
		return new JsonResponse(self::_getOrgQuizzes($id));
	}


	public function create(Request $request, $courseId) {
		// check permissions here
		if(!$this->me){
			throw new HttpException(403, 'You must be logged in');
		}
		if(!$this->me->isTeacher()) {
			throw new HttpException(403, 'You must be a teacher to edit quizzes');
		}
		Utility::clearPOSTParams($request);
		if(!$request->request->get('title')) {
			throw new HttpException(400, 'Required params: title');
		}
		return new JsonResponse(self::_create(
			$this->reader,
			$request->request->get('title'),
			$courseId,
			$this->me->user->getUserId(),
			$request->request->get('orgId'), // list of id's
			$request->request->get('departmentId'), // list of id's
			$request->request->get('questions'), // list of id's
			$request->request->get('randomGroups'), // list of bankId=>numberOfRandomQuestions
			$request->request->get('options') // contains nullable parameters
		));
	}

	public static function _get(Connection $reader, $id, $userId = null, $pageId = null,$includeResponses=false) {
		$util = new Utility($reader);
		$quiz = $util->fetchRow(self::$queryGetQuiz, array('quizId' => $id));
		$result = null;
		if($quiz) {
			$result = array(
				'id' => intval($quiz['id']),
				'name' => $quiz['title'],
				'description' => $quiz['description'],
				'isPrivate' => boolval($quiz['is_private']),
				'random' => ($quiz['qtype'] == 'random')
			);
			// add user's data to quiz if $userId exists ($pageId needed also)
			if($userId && $pageId) {
				$userId = intval($userId);
				$query = self::$queryGetUserQuizData;
				$userQuizData = $util->fetchRow(
					$query,
					array(
						'quizId' => $pageId,	// quiz_id in quiz_scores table is actually the page's id
						'userId' => $userId
					)
				);
				if($userQuizData) {
					$result['score'] = boolval($userQuizData['keep_highest_score'])?floatval($userQuizData['highest_score']):floatval($userQuizData['score']);
					$result['maxScore'] = floatval($userQuizData['max_points']);
					$result['isFinished'] = boolval($userQuizData['is_finished']);
					$result['completedAttempts'] = intval($userQuizData['attempts_completed']);
					$result['submitDate'] = strtotime($userQuizData['submitted']) * 1000;
				}
			}
			if($includeResponses){
				$result['questions']= self::_getQuizCurrentPointsPerQuestion($pageId,$userId);
			}else{
				$result['questions'] = self::_getQuizQuestions($reader, $id);
			}



		}
		return $result;
	}
	public function getAllAttempts(Request $request,$pageId){
		$util = new Utility();
		$classId = ClassesController::_getFromPage($util->reader,$pageId);
		$util->checkTeacher($classId);

		$pageInfo = PageController::_get($util->reader,$pageId);
		if(!$pageInfo['quiz']){
			return Utility::buildHTTPError('Page is not a quiz',400);
		}
		$quiz = $pageInfo['quiz'];
		$quiz['students']=array();
		$quiz['completedAttempts']=0;
		unset($quiz['isFinished']);

		$userType = $_GET['user'];
        $quiz['activeStudentsCount'] = intval($util->fetchOne(self::$queryGetActiveStudents,['pageId'=>$pageId],'students'));
        $quiz['inactiveStudentsCount'] = intval($util->fetchOne(self::$queryGetInActiveStudents,['pageId'=>$pageId],'students'));
        $quiz['totalStudentsCount'] = $quiz['activeStudentsCount'] + $quiz['inactiveStudentsCount'];
        if($userType == 'active')
		    $allStudentAttemps = $util->fetch(self::$queryGetActiveAttempts,['pageId'=>$pageId]);
        else if($userType == 'removed')
            $allStudentAttemps = $util->fetch(self::$queryGetRemovedAttempts,['pageId'=>$pageId]);
        else
            $allStudentAttemps = $util->fetch(self::$queryAlltRemovedAttempts,['pageId'=>$pageId]);
		foreach($allStudentAttemps as $row){
			$studentAttempt = self::_get($util->reader,$quiz['id'],$row['user_id'],$pageId,true);
			$studentAttempt['firstName']=$row['fname'];
			$studentAttempt['lastName']=$row['lname'];
			$studentAttempt['id']=$row['user_id'];
			$submitDate =date('m/j/y H:i',strtotime($row['submitted']));
			$studentAttempt['submitDate']= $submitDate;
			$siteId = SiteController::_getUserSite($row['user_id']);
			if($siteId){
				$studentAttempt['site']=$util->fetchOne(SiteController::$queryGetSite,['siteId'=>$siteId],'name');
			}else{
				$studentAttempt['site']='';
			}
			unset($studentAttempt['name']);
			unset($studentAttempt['description']);
			$quiz['students'][]= $studentAttempt;
			$quiz['completedAttempts']+=$studentAttempt['completedAttempts'];
		}
		$quiz['studentCount']=count($quiz['students']);
		$quiz['maxScore']=0;
		foreach($quiz['questions'] as $question){
			$quiz['maxScore']+=$question['maxPoints'];
		}
		return new JsonResponse($quiz);
	}
	public static function _updateMaxScore($quizId,$maxScore){
		$util = new Utility();
		$questions = $util->fetch(self::$queryGetQuizQuestions, array('quizId' => $quizId));
		$points = floatval($maxScore)/count($questions);
		foreach($questions as $question){
			if($question['random']){
				$points_per_question = $points/$question['random'];
			}
			else{
				$points_per_question = $points;
			}
			$util->reader->update(
				'quiz_questions',
				array('points'=>$points_per_question),
				array('id'=>$question['quizQuestionId'])
			);
		}
	}
	public static function _getFromString(Connection $reader, $str = '', $userId = null, $pageId = null) {
		if(empty($str)) {
			return null;
		}
		$util = new Utility($reader);
		$str = '%' . $str . '%';
		$quizId = $util->fetchOne(self::$queryGetQuizFromString, array('search' => $str));
		if($quizId) {
			return self::_get($reader, $quizId, $userId, $pageId);
		} else {
			return null;
		}
	}
	//If the user is returning to the quiz, we need to know which questions from random groups where answered.
	//In this case, $userId,$pageId, and $attemptId are required
	public static function _getQuizQuestions(Connection $reader, $quizId,$userId=null,$pageId=null,$attemptId=null) {
		$util = Utility::getInstance();
		if($userId && $attemptId!==null && $pageId){
			$answeredQuestions = $util->fetch(self::$queryGetQuestionsAnswered,['userId'=>$userId,'pageId'=>$pageId,'attemptId'=>$attemptId]);
			$quizQuestions=array();
			foreach($answeredQuestions as $q){
				if($q['quiz_question_id'] && !isset($quizQuestions[$q['quiz_question_id']])){
					$quizQuestions[$q['quiz_question_id']]=array();
				}
				$q['quizQuestionId']=$q['quiz_question_id'];
				$quizQuestions[$q['quiz_question_id']][]=$q;
			}
			$questions = $util->fetch(self::$queryGetQuizQuestions, array('quizId' => $quizId));

			foreach($questions as $i=>&$q){
				if( intval($q['random'])>0){
					if(isset($quizQuestions[$q['quizQuestionId']]) and count($quizQuestions[$q['quizQuestionId']])){
						while(count($quizQuestions[$q['quizQuestionId']]) && $q['random']>0){
							$questions[]=array_splice($quizQuestions[$q['quizQuestionId']],-1)[0];
							$q['random']=intval($q['random'])-1;
						}
					}

				}
				if($q['random']===0){
					array_splice($questions,$i,1);
				}
			}
		}else{
			$questions = $util->fetch(self::$queryGetQuizQuestions, array('quizId' => $quizId));
		}

		return self::formQuestions($questions,null,self::glossaryPageId($pageId));
	}
	private static function glossaryPageId($pageId){
        $classId = ClassesController::_getFromPage(null,$pageId);
	    if(GlossaryLinkOptions::_checkPageType($classId,GlossaryLinkOptions::QUIZZES) &&
            !boolval(PageController::_getPageMeta($pageId,'exclude_glossary'))
        ){
            return intval(Glossary::getForClassId($classId));
        }
    }

	private static function fillQuestions(&$userResponses,$randomGroup){
		while($randomGroup['remainingQuestions']>0){
			$userResponses[]=array(
				'id'=>null,
				'points'=>0,
				'waitingForGrade'=>false,
				'maxPoints'=>$randomGroup['points'],
				'quizQuestionId'=>intval($randomGroup['quizQuestionId'])
			);
			$randomGroup['remainingQuestions']-=1;
		}
	}

	private static function findLastValidAttemptId($pageId,$userId){
		$keepHighestAttempt = boolval(Utility::getInstance()->fetchOne("SELECT quizzes.keep_highest_score FROM quizzes JOIN pages p on p.quiz_id = quizzes.id WHERE p.id =:pageId",['pageId'=>$pageId]));
		if($keepHighestAttempt){
			return self::_getUserHighestAttempt($pageId,$userId)['attempt_id'];
		}
		$quizScoresData  = Utility::getInstance()->fetchRow(self::$queryGetUserQuizData,['userId'=>$userId,'quizId'=>$pageId]);
		if(boolval($quizScoresData['is_finished'])){
			return $quizScoresData['attemptId'];
		}else{
			if(intval($quizScoresData['attemptId'])>0){
				return intval($quizScoresData['attemptId'])-1;
			}else{
				return 0;
			}
		}
	}
	public static function _getQuizCurrentPointsPerQuestion($pageId,$userId){
		$util = new Utility();
		$attemptId = self::findLastValidAttemptId($pageId,$userId);
		$attemptId = $attemptId?:0;
		$data = $util->fetch(self::$queryGetQuizCurrentPoints,['userId'=>$userId,'pageId'=>$pageId,'attemptId'=>$attemptId]);
		$userResponses = array();
		$randomGroup = array(
			'quizQuestionId'=>null,
			'remainingQuestions'=>0,
			'points'=>1
		);


		foreach($data as $row){
			if($row['random']){
				if($randomGroup['quizQuestionId']==$row['quiz_question_id']){
					$randomGroup['remainingQuestions']-=1;
				}
				else{
					if($randomGroup['remainingQuestions']==0){
						$randomGroup = array(
							'quizQuestionId'=>$row['quiz_question_id'],
							'remainingQuestions'=>intval($row['random']),
							'points'=>$row['points']?floatval($row['points']):1
						);
						if($row['question_id']){
							$randomGroup['remainingQuestions']-=1;
						}
					}
					else{
						self::fillQuestions($userResponses,$randomGroup);
						$randomGroup = array(
							'quizQuestionId'=>$row['quiz_question_id'],
							'remainingQuestions'=>intval($row['random'])
						);
						if($row['question_id']){
							$randomGroup['remainingQuestions']-=1;
						}else{

						}
					}
				}
			}
			if($row['question_id']) {
				$question = array(
					'id' => intval($row['question_id']),
					'points' => max(0, floatval($row['is_correct'])),
					'waitingForGrade' => $row['is_correct'] == -1,
					'maxPoints' => $row['points'] ? floatval($row['points']) : floatval($row['max_points']),
					'quizQuestionId' => intval($row['quiz_question_id'])
				);
				$userResponses[] = $question;
			}

		}
		self::fillQuestions($userResponses,$randomGroup);

		return $userResponses;
	}
	public static function _recalculateHighestAttempt($pageId,$userId){
		$params = [];
		$highestAttempt = self::_getUserHighestAttempt($pageId,$userId);
		$params['highest_score']=$highestAttempt['score'];
		$params['highest_attempt_id']=$highestAttempt['attempt_id'];

		Utility::getInstance()->reader->update(
			'quiz_scores',
			$params,
			[
				'user_id'=>$userId,
				'quiz_id'=>$pageId
			]
		);
	}
	public static function _getUserHighestAttempt($pageId,$userId){
		$util = new Utility();
		$highest_attempt = array('score'=>0,'attempt_id'=>0);
		$data = $util->fetch(self::$queryGetQuizAllAttemptsResponsePoints,['quizId'=>$pageId,'userId'=>$userId]);
		foreach($data as $row){
			if(floatval($row['score'])>$highest_attempt['score']){
				$highest_attempt=$row;
			}
		}
		return $highest_attempt;
	}
	public static function _getAttempt($pageId,$userId,$attemptId){
		$u = Utility::getInstance();
		$data = $u->fetch(self::$queryGetUserAttempt,['pageId'=>$pageId,'userId'=>$userId,'attemptId'=>$attemptId]);
		$questions = array();
		foreach($data as $row){
			if(!isset($questions[$row['question_id']])){
				$questions[$row['question_id']]=$row;
			}
		}
		return $questions;
	}
	public static function _getUserAttempts($pageId,$userId,$needingGrade=false){
		$util = Utility::getInstance();
		if($needingGrade){
			return $util->fetch(self::$queryGetUserAttemptsNeedingGrade,['pageId'=>$pageId,'userId'=>$userId]);
		}
		else{
			return $util->fetch(self::$queryGetQuizAllAttemptsResponsePoints,['quizId'=>$pageId,'userId'=>$userId]);
		}

	}
	public static function _getQuizCurrentPoints($pageId,$userId,$attemptId=null) {
		$util = new Utility();
		if(is_null($attemptId)){
			$attemptId = $util->fetchOne(self::$queryGetUserQuizData,['userId'=>$userId,'quizId'=>$pageId],'attempt_id');
		}
		$data = $util->fetch(self::$queryGetQuizResponsePoints, array('quizId' => $pageId,'userId'=>$userId,'attemptId'=>$attemptId));
		$total = $data[0]['is_correct'];


		return $total;
	}
	public static function _getQuizMaxPoints($quizId) {
		$util = new Utility();
		$maxPoints = $util->fetchOne(self::$queryGetQuizMaxPoints, array('quizId' => $quizId));
		return $maxPoints;
	}
	public static function _getQuizFromPageId($pageId) {
		$util = new Utility();
		$quizId = $util->fetchOne(self::$queryGetQuizFromPageId, array('pageId' => $pageId));
		return $quizId;
	}
	/*
	 get all quizzes from org or classes where the user is edit_teacher
	  */
	public static function _getOrgQuizzes($orgId){
		$util = new Utility();
		if($util->checkAdmin($orgId,true,false)){
			return $util->fetch(self::$queryGetOrgQuizzesForAdmin,['orgId'=>$orgId]);
		}
		return $util->fetch(self::$queryGetOrgQuizzesForEditTeacher,['orgId'=>$orgId,'userId'=>$util->me->user->getUserId()]);
	}
	public static function _quizObjectives($quizId){
		$util = new Utility();
		$data = $util->fetch(self::$queryGetQuizObjectives,['quizId'=>$quizId]);
		$objectives = array();
		foreach($data as $row){
			if(!$row['objectiveId']) continue;
			if(!isset($objectives[$row['objectiveId']])){
				$objectives[$row['objectiveId']]=array(
					'id'=>$row['objectiveId'],
					'name'=>$row['name'],
					'questions'=>array()
				);
			}
			$objectives[$row['objectiveId']]['questions'][]= $row['quizQuestionId'];
		}
		return array_values($objectives);
	}
	public static function _getRandomQuestions($bankId, $number = 1,$glossaryPageId=null) {
		$util = Utility::getInstance();
		$questions = $util->fetch(
			self::$queryGetRandomQuestions . ' LIMIT ' . $number,
			array(
				'bankId' => $bankId
			)
		);
		return self::formQuestions($questions,null,$glossaryPageId);
	}
	public static function _getRandomQuestionsFromTags($tags, $number = 1,$glossaryPageId=null) {
		$filter = new QuestionTagsFilter();
		$questions = $filter->filterQuestionIds($tags,$number,1,null,true)->data;
		return self::formQuestions($questions,null,$glossaryPageId);
	}
	public static function _getLastQuestionPosition($quizId){
		return Utility::getInstance()->fetchOne('SELECT max(position) FROM quiz_questions WHERE quiz_id = :quizId',['quizId'=>$quizId]);
	}
	private static function formQuestions($questions,$pointsPerQuestion=null,$glossaryPageId=null) {
		$me = UserController::me(Utility::getInstance()->reader);
		$result = array();
		if($questions) {
			foreach ($questions as $question) {
				//the question is in fact a group of questions
				if((@$question['bank_id'] || @$question['tags']) && @$question['random']){
					$data = @$question['tags']?self::_getRandomQuestionsFromTags($question['tags'],
                        $question['random'],$glossaryPageId):self::_getRandomQuestions($question['bank_id'],
                        $question['random'],$glossaryPageId);
					$pointsPerQuestion = isset($question['specificPoints'])?$question['specificPoints']:1;
					$randomQuestions = array();
					foreach($data as $randomQuestion){
						$randomQuestion['quizQuestionId'] = $question['quizQuestionId'];
						$randomQuestions[]=$randomQuestion;
					}
					$partialResult = self::formQuestions($randomQuestions,$pointsPerQuestion);
					foreach($partialResult as $randomQuestion){
						$result[]=$randomQuestion;
					}
				}
				//normal question
				else{
					//the question comes from a random group
					if($pointsPerQuestion){
						$maxPoints = $pointsPerQuestion;
					}
					//the question has specific points for this quiz
					else if(@$question['specificPoints']){
						$maxPoints = $question['specificPoints'];
					}
					//getting points from question table (no specific points was assigned)
					else{
						$maxPoints = $question['max_points'];
					}

					$tmpQuestion = array(
						'id' => intval($question['id']),
						'prompt' => $glossaryPageId?GlossaryLinks::processIfNeededUsingPageId($glossaryPageId,
                            $question['prompt']):$question['prompt'],
						'type' => $question['type'],
						'feedback' => $question['feedback'],
						'maxPoints' => round(floatval($maxPoints),2),
						'extra' => $question['extra'],
						'hasPagebreak' => boolval($question['pagebreak']),
						'optionParams' => $question['options'],
						'quizQuestionId'=>@$question['quizQuestionId'],
						'fromRandomGroup'=>!is_null($pointsPerQuestion)
					);
					if($me->isTeacher()) {
						$tmpQuestion['solution'] = $question['solution'];
					}
					// check for options and add them
					$tmpQuestion['options'] = self::getQuestionOptions(Utility::getInstance()->reader, $question['id']);
					$result[] = $tmpQuestion;
				}
			}
		}
		return $result;
	}

	public static function getQuestionOptions(Connection $reader, $id) {
		$util = new Utility($reader);
		$options = $util->fetch(self::$queryGetQuestionOptions, array('questionId' => $id));
		$result = array();
		if($options) {
			foreach ($options as $option) {
				$result[] = array(
					'id' => intval($option['id']),
					'text' => $option['text'],
					'order' => intval($option['sort_order'])
				);
			}
		}
		return $result;
	}

	public static function _giveExtraAttempt(Connection $reader, $id, $userId) {
		$util = new Utility($reader);
		return $util->execute(self::$queryGiveExtraAttempt, array('quizId' => $id, 'userId' => $userId));
	}
	public static function _isWaitingForGrade($pageId,$userId){
		$util = new Utility();
		$attemptId = $util->fetchOne(self::$queryGetUserQuizData,['userId'=>$userId,'quizId'=>$pageId],'attempt_id');
		return $util->fetchOne(self::$queryIsWaitingGrade,['pageId'=>$pageId,'userId'=>$userId,'attemptId'=>$attemptId]);
	}

	public static function _create(Connection $reader, $title, $courseId, $createdBy, $orgId, $departmentid, $questions = array(), $randomGroups = array(), $options = array()) {
		$util = new Utility($reader);
		// $testbank array
		$quiz = array(
			'title' => $title,
			'courseId' => intval($courseId),
			'createdBy' => intval($createdBy),
			'orgId' => intval($orgId),
			'departmentId' => intval($departmentid)
		);
		// defaults for nullable params in db
		$defaults = array(
			'modified' => date('Y-m-d H:i:s'),
			'description' => '',
			'qtype' => 'normal',
			'random' => 0,
			'isPrivate' => 0
		);
		// replace defaults if necessary
		foreach ($defaults as $key => $value) {
			if(!array_key_exists($key, $options)) {
				$quiz[$key] = $value;
			} else {
				$quiz[$key] = $options[$key];
			}
		}
		// insert quiz
		$quiz['id'] = $util->insert(
			self::$queryInsertQuiz,
			$quiz
		);
		if(!$quiz['id']) {
			// error
			throw new HttpException(500, 'An error occured while inserting question');
		}
		$quiz['questions'] = array();
		// assign questions to quiz
		if(count($questions)) {
			$quiz['questions'] = array_merge($quiz['questions'], self::_assignQuestions($reader, $quiz['id'], $questions));
		}
		// assign random groups of questions
		if(count($randomGroups)) {
			$quiz['questions'] = array_merge($quiz['questions'], self::_assignRandomGroups($reader, $quiz['id'], $randomGroups));
		}
		return $quiz;
	}

	public static function _assignQuestions(Connection $reader, $quizId, $questions) {
		$util = new Utility($reader);
		$added = array();
		foreach ($questions as $question) {
			// assign quiz (insert into quiz_questions)
			$added[] = $util->insert(
				self::$queryInsertQuizQuestion,
				array(
					'quizId' => $quizId,
					'questionId' => $question
				)
			);
		}
		// should probably return entire question here, not just id's. For now, this is OK.
		// Edit in the future to make endpoint more useful
		return $added;
	}

	public static function _assignRandomGroups(Connection $reader, $quizId, $randomGroups) {
		$util = new Utility($reader);
		$added = array();
		foreach ($randomGroups as $bankId => $number) {
			$added[] = $util->insert(
				self::$queryInsertQuizRandomGroup,
				array(
					'quizId' => $quizId,
					'bankId' => $bankId,
					'random' => $number
				)
			);
		}
		return $added;
	}
	public static function _sendQuestionFeedBack($questionId,$quizId,$studentId,$feedback,$quizQuestionId,$attemptId){
		$util = new Utility();
		$util->insert(
			self::$queryInsertQuestionFeedback,
			[
				'studentId'=>$studentId,
				'questionId'=>$questionId,
				'quizId'=>$quizId,
				'feedback'=>$feedback,
				'byUser'=>$_SESSION['USER']['ID'],
				'quizQuestionId'=>$quizQuestionId,
				'attemptId'=>$attemptId
			]
		);
	}
	public static function _getPagesUsingQuiz($quizId){
		return Utility::getInstance()->fetch(self::$queryGetPagesUsingQuiz,['quizId'=>$quizId]);
	}
	public static function _getAdvancedSettings($quizId){

    }
	public static function _assignTestbank(Connection $reader, $quizId, $bankId) {
		$util = new Utility($reader);
		$util->insert(
			self::$queryInsertQuizTestbank,
			array(
				'quizId' => $quizId,
				'bankId' => $bankId
			)
		);
		// nothing to return
	}

	public static function _getAll($params){
		$util = new Utility();

		$deptId = @$params['deptId'];
		$orgId = @$params['orgId'];
		$classId = @$params['classId'];
		$userId = @$params['userId'];

		$queryParams = array();

		$whereOrgId = ' and q.org_id = :orgId ';
		$whereDeptId = ' and d.id = :deptId ';
		$whereClassId = ' and c.id = :classId ';
		$whereUserId = ' and q.created_by = :userId ';

		$query = self::$queryGetQuizzes;

		if($orgId){
			$query .= $whereOrgId;
			$queryParams['orgId']=$orgId;
		}
		if($deptId){
			$query .= $whereDeptId;
			$queryParams['deptId']=$deptId;
		}
		if($classId){
			$query .= $whereClassId;
			$queryParams['classId']=$classId;
		}
		if($userId){
			$query .= $whereUserId;
			$queryParams['userId']=$userId;
		}

		return $util->fetch($query.' group by q.id',$queryParams);
	}
    public static function canLeaveAndReturn($pageId){
	    return boolval(Utility::getInstance()->fetchOne("SELECT can_return FROM pages where id = ".$pageId));
    }

	public static $queryGetQuiz = <<<SQL
		SELECT * FROM quizzes WHERE id = :quizId
SQL;

	public static $queryGetUserQuizData = <<<SQL
		SELECT qs.*,q.keep_highest_score
		FROM quiz_scores qs
		JOIN pages p on qs.quiz_id = p.id
		JOIN quizzes q ON q.id = p.quiz_id
		WHERE qs.user_id = :userId AND qs.quiz_id = :quizId;
SQL;

	protected static $queryGetUserRandomQuizData = <<<SQL
		SELECT *
		FROM quiz_scores
		WHERE user_id = :userId AND randomquiz_id = :quizId;
SQL;

	protected static $queryGetOrgQuizzesForAdmin = <<<SQL
		SELECT q.id,
			q.title,
			sum(if(qq.random is not null and qq.random>0,qq.random,1)) as questionCount,
			q.course_id
		FROM quizzes q
		JOIN quiz_questions qq on qq.quiz_id = q.id
		JOIN courses on courses.id = q.course_id
		JOIN departments d on courses.departmentid = d.id
		WHERE d.organizationid = :orgId
		GROUP BY q.id
SQL;
	protected static $queryGetOrgQuizzesForEditTeacher = <<<SQL
		SELECT q.id,
				q.title,
				sum(if(qq.random is not null and qq.random>0,qq.random,1)) as questionCount,
				q.course_id
		FROM quizzes q
		JOIN quiz_questions qq on qq.quiz_id = q.id
		JOIN classes c on c.courseid = q.course_id
		JOIN user_classes uc on uc.classid = c.id
		JOIN courses on courses.id = q.course_id
		JOIN departments d on courses.departmentid = d.id
		WHERE uc.userid = :userId and uc.is_edit_teacher=1 and d.organizationid = :orgId
		GROUP BY q.id

SQL;
	protected static $queryGetQuizFromPageId = <<<SQL
		SELECT q.id
		FROM quizzes q
		JOIN pages on q.id = pages.quiz_id
		WHERE pages.id = :pageId
SQL;
	protected static $queryGetPagesUsingQuiz = <<<SQL
		SELECT p.name,c.name as className
		FROM pages p
		JOIN units u ON u.id = p.unitid
		JOIN classes c ON c.courseid = u.courseid
		WHERE p.quiz_id = :quizId
SQL;

	protected static $queryGetQuizFromString = <<<SQL
		SELECT id
		FROM quizzes
		WHERE title LIKE :search
		ORDER BY RAND()
		LIMIT 1
SQL;

	protected static $queryGetQuizBankId = <<<SQL
		SELECT bank_id
		FROM quiz_questions
		WHERE quiz_id = :quizId
			AND NOT bank_id = 0;
SQL;
	//changing from inner join to left join due randomQuestions
	public static $queryGetQuizQuestions = <<<SQL
		SELECT q.id, q.prompt, q.type, q.options, q.feedback, q.max_points, q.extra, q.pagebreak, q.solution,
		qq.id as quizQuestionId, qq.random,qq.bank_id,qq.tags,qq.position,qq.points as specificPoints,qq.id as quizQuestionId
		FROM quiz_questions qq
		JOIN quizzes ON quizzes.id = qq.quiz_id
		LEFT JOIN questions q ON qq.question_id = q.id
		WHERE qq.quiz_id = :quizId
		ORDER BY if(quizzes.sort_mode='random',rand(),qq.position)
SQL;
	//1. if question is a random group, then max points will be pointsPerQuestion (points, default 1) * random
	//2, if has qq.points (specific points for the quiz) otherwise we get points from question table
	protected static $queryGetQuizMaxPoints = <<<SQL
		SELECT sum(if(qq.random,
						if(qq.points,qq.random*qq.points,qq.random),
						if(qq.points,qq.points,q.max_points)
					 )
				   )
		FROM quiz_questions qq
		LEFT JOIN questions q ON qq.question_id = q.id
		WHERE qq.quiz_id = :quizId
SQL;
	protected static $queryGetQuizCurrentPoints = <<<SQL
		SELECT qr.is_correct,
			qq.id as quiz_question_id,
			qr.question_id,
			qq.points,
			qq.random,
			q.max_points
		FROM quiz_questions qq
		JOIN pages p ON qq.quiz_id = p.quiz_id
		JOIN quiz_scores qs ON p.id = qs.quiz_id and qs.user_id = :userId
		JOIN quizzes qu ON p.quiz_id = qu.id
			LEFT JOIN quiz_responses qr on if(qq.question_id and qq.random = 0,qr.question_id = qq.question_id and qr.user_id=:userId,qq.id = qr.quiz_question_id and qr.user_id=:userId) and if(:attemptId is not null,qr.attempt_id=:attemptId,qs.attempt_id=qr.attempt_id) and qr.quiz_id = p.id
		LEFT JOIN questions q on qr.question_id=q.id
		WHERE
		p.id = :pageId
		and (qr.user_id = :userId or qr.is_correct is null or qr.response is null)
		group by qq.id,qr.question_id
		ORDER BY qq.position,qq.id
SQL;
	protected static $queryGetQuizAllAttemptsResponsePoints = <<<SQL
		select sum(if(is_correct=-1,0,is_correct)) as score,attempt_id,submited as submitted from (select distinct qr1.quiz_response_id from
	(select * from quiz_responses where quiz_id=:quizId and user_id = :userId and attempt_id is not null) qr1
	left join
	(select * from quiz_responses where quiz_id=:quizId and user_id = :userId and attempt_id is not null) qr2
	on qr1.quiz_id=qr2.quiz_id and qr1.user_id =qr2.user_id
	and qr1.question_id = qr2.question_id and qr1.attempt_id = qr2.attempt_id
	and qr1.quiz_response_id<qr2.quiz_response_id
	where qr2.quiz_response_id is null)
	 testing
	 join quiz_responses qr on qr.quiz_response_id = testing.quiz_response_id
	group by attempt_id
SQL;
	protected static $queryGetQuizResponsePoints = <<<SQL
		select sum(if(is_correct=-1,0,is_correct)) as is_correct from (select distinct qr1.quiz_response_id from
	(select * from quiz_responses where quiz_id=:quizId and user_id = :userId and attempt_id=:attemptId) qr1
	left join
	(select * from quiz_responses where quiz_id=:quizId and user_id = :userId and attempt_id=:attemptId) qr2
	on qr1.quiz_id=qr2.quiz_id and qr1.user_id =qr2.user_id
	and qr1.question_id = qr2.question_id and qr1.attempt_id = qr2.attempt_id
	and qr1.quiz_response_id<qr2.quiz_response_id
	where qr2.quiz_response_id is null)
	 testing
	 join quiz_responses qr on qr.quiz_response_id = testing.quiz_response_id;

SQL;
	public static $queryGetRandomQuestions = <<<SQL
		SELECT q.*
		FROM bank_questions bq
		INNER JOIN questions q ON q.id = bq.question_id
		WHERE bq.bank_id = :bankId AND q.prompt NOT LIKE '%ng-scope%'
		ORDER BY RAND()
SQL;

	public static $queryGetQuestionOptions = <<<SQL
		SELECT *
		FROM question_options
		WHERE question_id = :questionId
SQL;

	protected static $queryGiveExtraAttempt = <<<SQL
		UPDATE quiz_scores
		SET attempts_completed = attempts_completed - 1
		WHERE quiz_id = :quizId AND user_id = :userId;
SQL;

	protected static $queryInsertQuiz = <<<SQL
		INSERT INTO quizzes (title, course_id, created_by, org_id, department_id, modified, description, qtype, random, is_private)
		VALUES (:title, :courseId, :createdBy, :orgId, :departmentId, :modified, :description, :qtype, :random, :isPrivate)
SQL;

	protected static $queryInsertQuizQuestion = <<<SQL
		INSERT INTO quiz_questions (quiz_id, question_id)
		VALUES (:quizId, :questionId)
SQL;

	protected static $queryInsertQuizRandomGroup = <<<SQL
		INSERT INTO quiz_questions (quiz_id, bank_id, random)
		VALUES (:quizId, :bankId, :random)
SQL;

	protected static $queryInsertQuizTestbank = <<<SQL
		INSERT INTO quiz_questions (quiz_id, bank_id)
		VALUES (:quizId, :bankId)
SQL;
	protected static $queryGetQuizzes = <<<SQL
			SELECT distinct q.id,
				q.title,
				d.organizationid as orgId,
				courses.id as courseId,
				q.description,
				sum(if(qq.random is not null and qq.random>0,qq.random,if(qq.id is not null,1,0))) as count
				FROM quizzes q
				LEFT JOIN quiz_questions qq on qq.quiz_id = q.id
				JOIN classes c on c.courseid = q.course_id
				JOIN courses on courses.id = q.course_id
				JOIN departments d on courses.departmentid = d.id
			WHERE 1

SQL;
	public static $queryGetQuestion = <<<SQL
			SELECT * FROM questions where id=:questionId
SQL;
	private static $queryInsertQuestionFeedback =  <<<SQL
		INSERT INTO quiz_feedback (user_id, quiz_id, question_id, feedback, by_user, date, quiz_question_id,attempt_id)
			VALUES (:studentId,:quizId,:questionId,:feedback,:byUser,CURRENT_TIMESTAMP(),:quizQuestionId,:attemptId)
			ON DUPLICATE KEY UPDATE date = CURRENT_TIMESTAMP(), feedback = :feedback, viewed = 0
SQL;
	private static $queryAlltRemovedAttempts = <<<SQL
(SELECT qs.*,us.fname,us.lname FROM quiz_scores qs
		 JOIN users us on us.id = qs.user_id
		 JOIN pages p ON p.id = qs.quiz_id
		 JOIN units u ON u.id = p.unitid
		 JOIN classes cl ON cl.courseid = u.courseid
		 JOIN user_classes_history uc ON qs.user_id = uc.userid and cl.id = uc.classid
		WHERE p.id = :pageId and (is_finished=1 or qs.attempt_id>0) and uc.is_student = 1)
union ALL 
		(SELECT qs.*,us.fname,us.lname FROM quiz_scores qs
		 JOIN users us on us.id = qs.user_id
		 JOIN pages p ON p.id = qs.quiz_id
		 JOIN units u ON u.id = p.unitid
		 JOIN classes cl ON cl.courseid = u.courseid
		 JOIN user_classes uc ON qs.user_id = uc.userid and cl.id = uc.classid
		WHERE p.id = :pageId and (is_finished=1 or qs.attempt_id>0) and uc.is_student = 1)
SQL;

	private static $queryGetRemovedAttempts = <<<SQL
SELECT qs.*,us.fname,us.lname FROM quiz_scores qs
		 JOIN users us on us.id = qs.user_id
		 JOIN pages p ON p.id = qs.quiz_id
		 JOIN units u ON u.id = p.unitid
		 JOIN classes cl ON cl.courseid = u.courseid
		 JOIN user_classes_history uc ON qs.user_id = uc.userid and cl.id = uc.classid
		WHERE p.id = :pageId and (is_finished=1 or qs.attempt_id>0) and uc.is_student = 1
SQL;
	private static $queryGetActiveAttempts = <<<SQL
		SELECT qs.*,us.fname,us.lname FROM quiz_scores qs
		 JOIN users us on us.id = qs.user_id
		 JOIN pages p ON p.id = qs.quiz_id
		 JOIN units u ON u.id = p.unitid
		 JOIN classes cl ON cl.courseid = u.courseid
		 JOIN user_classes uc ON qs.user_id = uc.userid and cl.id = uc.classid
		WHERE p.id = :pageId and (is_finished=1 or qs.attempt_id>0) and uc.is_student = 1
SQL;
    private static $queryGetActiveStudents = <<<SQL
		SELECT COUNT(DISTINCT(us.id)) as students FROM quiz_scores qs
		 JOIN users us on us.id = qs.user_id
		 JOIN pages p ON p.id = qs.quiz_id
		 JOIN units u ON u.id = p.unitid
		 JOIN classes cl ON cl.courseid = u.courseid
		 JOIN user_classes uc ON qs.user_id = uc.userid and cl.id = uc.classid
		WHERE p.id = :pageId and (is_finished=1 or qs.attempt_id>0) and uc.is_student = 1
SQL;
    private static $queryGetInActiveStudents = <<<SQL
		SELECT COUNT(DISTINCT(us.id)) as students FROM quiz_scores qs
		 JOIN users us on us.id = qs.user_id
		 JOIN pages p ON p.id = qs.quiz_id
		 JOIN units u ON u.id = p.unitid
		 JOIN classes cl ON cl.courseid = u.courseid
		 JOIN user_classes_history uc ON qs.user_id = uc.userid and cl.id = uc.classid
		WHERE p.id = :pageId and (is_finished=1 or qs.attempt_id>0) and uc.is_student = 1
SQL;
	private static $queryIsWaitingGrade = <<<SQL
	SELECT * FROM quiz_responses WHERE is_correct=-1 and quiz_id = :pageId and user_id = :userId and attempt_id = :attemptId LIMIT 1
SQL;
	public static $queryUpdateQuizScores = <<<SQL
	UPDATE quiz_scores
		JOIN pages p ON p.id = quiz_scores.quiz_id
	 SET score = score*(:newMaxPoints/:oldMaxPoints), max_points = :newMaxPoints
	 WHERE p.quiz_id = :quizId
SQL;
	public static $queryGetQuizClasses = <<<SQL
	SELECT c.* FROM classes c
	JOIN units u on u.courseid = c.courseid
	JOIN pages p on p.unitid = u.id
	WHERE p.quiz_id = :quizId
SQL;
	public static $queryGetQuizObjectives = <<<SQL
	SELECT qq.id as quizQuestionId,
		   b.id as bankId,
		   o.id as objectiveId,o.name
	 	FROM quiz_questions qq
	LEFT JOIN bank_questions bq ON bq.question_id = qq.question_id
	LEFT JOIN banks b ON if(qq.bank_id,qq.bank_id=b.id,bq.bank_id=b.id)
	LEFT JOIN objectives o ON b.default_objective_id = o.id
	WHERE qq.quiz_id = :quizId
SQL;
	public static $queryGetUserAttempts = <<<SQL
	SELECT submited as submitted,attempt_id FROM quiz_responses where quiz_id = :pageId and user_id = :userId and attempt_id is not null group by attempt_id
SQL;
	public static $queryGetUserAttempt = <<<SQL
	SELECT * FROM quiz_responses where quiz_id = :pageId and user_id = :userId and attempt_id = :attemptId
SQL;
	public static $queryGetUserAttemptsNeedingGrade = <<<SQL
	SELECT submited as submitted,qr.attempt_id FROM quiz_responses qr
join pages p on p.id = qr.quiz_id
join quiz_scores qs on qs.user_id = qr.user_id and qs.quiz_id = qr.quiz_id
 where if(p.can_return and qs.attempt_id = qr.attempt_id,qs.is_finished = 1,1) and is_correct = -1 and qr.quiz_id = :pageId and qr.user_id = :userId and qr.attempt_id is not null group by qr.attempt_id
SQL;
	public static $queryGetQuestionsAnswered = <<<SQL
	select q.*,bq.bank_id,qr.quiz_question_id from quiz_responses qr
	join bank_questions bq on bq.question_id = qr.question_id
	join questions q on q.id = bq.question_id
	where qr.quiz_id = :pageId and qr.user_id = :userId and qr.attempt_id=:attemptId
SQL;

//TEMPORARY SOLUTION FOR QUIZ ATTEMPTS ISSUE//
/////////////////////////////////////////////
	public function fixAttemptIssue(Request $request,$pageId){
		$u = Utility::getInstance();
		$classId=ClassesController::_getFromPage($u->reader,$pageId);
		$u->checkTeacher($classId);

		$u->insert(self::$queryDeleteDupResponses,['pageId'=>$pageId]);

		$students = $u->fetch(self::$queryGetQuizResponsesUsers,['pageId'=>$pageId]);
		foreach($students as $student) {
			$userId = $student['user_id'];
			$lastAttempt = $u->fetchOne(self::$queryGetUserLastAttempt, ['pageId' => $pageId, 'userId' => $userId]);
			$points = self::_getQuizCurrentPoints($pageId,$userId,$lastAttempt);
			$attempts = $u->fetch(self::$queryGetUserAttempts,['pageId'=>$pageId,'userId'=>$userId]);
			$highest = $points;
			$highest_attempt=$lastAttempt;
			foreach($attempts as $row){
				$attemptPoints = self::_getQuizCurrentPoints($pageId,$userId,$row['attempt_id']);
				if($attemptPoints>$highest){
					$highest=$attemptPoints;
					$highest_attempt=$row['attempt_id'];
				}
			}
			$u->reader->update('quiz_scores',
				[
					'score'=>$points,
					'highest_score'=>$highest,
					'highest_attempt_id'=>$highest_attempt
				],
				[
					'user_id'=>$userId,
					'quiz_id'=>$pageId
				]);
			GradebookController::_recalculate($userId,$pageId);
		}
		return new JsonResponse('Done');
	}
	private static $queryGetQuizResponsesUsers = <<<SQL
	SELECT distinct user_id FROM quiz_responses where quiz_id=:pageId
SQL;
	private static $queryGetUserLastAttempt = <<<SQL
	SELECT max(attempt_id) FROM quiz_responses where quiz_id=:pageId and user_id=:userId
SQL;
	public static $queryGetQuestionAttempt = <<<SQL
	SELECT * FROM quiz_responses where quiz_id = :pageId and user_id = :userId and attempt_id = :attemptId and question_id = :questionId
SQL;
	private static $queryDeleteDupResponses = <<<SQL
	delete qr from
	 (select distinct qr1.quiz_response_id from
	(select * from quiz_responses where quiz_id=:pageId) qr1
	left join
	(select * from quiz_responses where quiz_id=:pageId) qr2
	on qr1.quiz_id=qr2.quiz_id and qr1.user_id =qr2.user_id
	and qr1.question_id = qr2.question_id and qr1.attempt_id = qr2.attempt_id
	and qr1.quiz_response_id<qr2.quiz_response_id
	where qr2.quiz_response_id is not null)
	 testing
	join quiz_responses qr on qr.quiz_response_id = testing.quiz_response_id;
SQL;
/////////////////////////////////////////////
//////////////////////////////////////////////
    public static $defaultAdvancedSettings = [
        'show_question_number'=>true,
        'show_question_box'=>true,
        'font_size'=>'12px',
        'font_family'=>'Verdana, Geneva, sans-serif',
        'checkbox_style'=>'circle'
    ];
}