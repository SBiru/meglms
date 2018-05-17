<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use MyProject\Proxies\__CG__\stdClass;
use SimpleXML;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CloneController{

	private $reader;
	private $me;
	private $util;
	private static $cloneQuizzes;
	private static $clonePrompts;

	public function __construct(Connection $reader) {
		$this->util = new Utility($reader);
		$this->reader = $reader;
	}

	/* THROWS: HttpException */
	private function checkPermissions() {
		$this->me = UserController::me($this->reader);
		if(!$this->me) {
			throw new HttpException(403, 'Not logged in');
		}
		if(!$this->me->isTeacher()) {
			throw new HttpException(403, 'You must be a teacher');
		}
	}

	/* Template (static function ready) */
	public function clonePage(Request $request, $id) {
		return $this->cloneAny($request, 'page', $id);
	}

	/* Template (static function ready) */
	public function clonePageGroup(Request $request, $id) {
		return $this->cloneAny($request, 'pageGroup', $id);
	}

	public function cloneUnit(Request $request, $id) {
		return $this->cloneAny($request, 'unit', $id);
	}

	private function cloneAny(Request $request, $type, $id) {
		$this->checkPermissions();
		Utility::clearPOSTParams($request);
		$targetId = intval($request->request->get('target'));
		if(!$targetId) {
			throw new HttpException(400, 'Missing parameter target');
		}
		switch ($type) {
			case 'unit':
				$id = self::_cloneUnit($this->reader, $id, $targetId);
				break;
			case 'pageGroup':
				$id = self::_clonePageGroup($this->reader, $id, $targetId);
				break;
			case 'page':
				$id = self::_clonePage($this->reader, $id, $targetId);
				break;
			default:
				throw new HttpException(400, 'Unknown type');
				break;
		}
		// if id is false, error ocurred
		if(!$id) {
			throw new HttpException(400, 'Error ocurred while inserting cloned row');
		}
		return $id;
	}

	public function cloneCourse(Request $request, $id) {
		$this->checkPermissions();
		Utility::clearPOSTParams($request);
		// id's
		$targetId = intval($request->request->get('target'));
		$cloneQuizzes = boolval($request->request->get('cloneQuizzes'));
		$clonePrompts = boolval($request->request->get('clonePrompts'));
		self::$cloneQuizzes = $cloneQuizzes;
		self::$clonePrompts = $clonePrompts;
		if(!$targetId) {
			throw new HttpException(400, 'Missing parameters target');
		}
		$result = self::_cloneCourse($this->reader, $id, $targetId);
		if($result) {
			return new JsonResponse($result);
		} else {
			throw new HttpException(400, 'An error ocurred while cloning course. Either course already has content or params are invalid');
		}
	}
	public function cloneTimedGroup(Request $request, $id) {
		$newId = self::clonePromptGroup($id);
		$promptsInGroup = Utility::getInstance()->fetch('SELECT id FROM timed_review_prompts where groupid = :id',['id'=>$id]);
		foreach($promptsInGroup as $prompt){
			self::clonePrompt($prompt['id'],$newId);
		}
		$newGroup = Utility::getInstance()->fetchRow(TimedReviewController::$queryGetGroups.' and g.id=:id',['id'=>$newId]);
		return new JsonResponse($newGroup);
	}
	public function cloneTimedPrompt(Request $request, $id) {
		$newId = self::clonePrompt($id);
		return new JsonResponse(['id'=>$newId]);
	}

	// STATIC FUNCTIONS

	public static function _clonePage(Connection $reader, $sourcePageId, $targetUnitId, $pageGroupId = 0,$cloneQuizzes=false,$clonePrompts=false) {
		$util = new Utility($reader);
		$page = $util->fetch(self::$queryGetPage, array('pageId' => $sourcePageId));
		$unit = $util->fetchRow(self::$queryGetUnit, array('unitId' => $targetUnitId));
		if(!$page || !$unit) {
			// page and/or unit don't exist
			return false;
		}
		$page = array_pop($page); // actual row
		// check and retrieve class_assignments if page is gradeable
		$assignment = array();
		if(boolval($page['is_gradeable']) || $page['layout']=='QUIZ') {
			$assignment = $util->fetch(
				self::$queryGetPageAssignment,
				array('pageId' => $page['id'])
			);
			if($assignment) {
				$assignment = array_pop($assignment);
			}
		}
		$oldPageId = $page['id'];
		// set up page for insertion
		unset($page['id']); // remove id (won't be inserted)
		$page['unitid'] = $targetUnitId;
		$page['position'] = self::getNextPageNumber($reader,$targetUnitId);
		$page['pagegroupid'] = $pageGroupId;
		$page['created'] = date('Y-m-d H:i:s');

		if(($cloneQuizzes || self::$cloneQuizzes) && $page['quiz_id'] && $page['layout']=='QUIZ'){
			$page['quiz_id']= self::_cloneQuiz($page['quiz_id'],['courseId'=>$unit['courseid']]);
		}
		if($page['timed_id']){
			$clonePrompts = $clonePrompts?:self::$clonePrompts;
			$page['timed_id']=self::_cloneTimedReview($page['timed_id'],$clonePrompts);
		}


		// actual cloning
		$reader->insert('pages', $page);
		$pageId = $reader->lastInsertId();

		// if page is gradeable, insert assignment entry
		if(count($assignment)) {
			$classId = $util->fetchOne(self::$queryGetClassFromUnit, array('unitId' => $targetUnitId));
			unset($assignment['id']);
			$assignment['page_id'] = $pageId;
			$assignment['class_id'] = $classId;
			$assignment['has_exempted'] = 0;
			$util->insert(
				self::$queryInsertPageAssignment,
				$assignment
			);
		}
		$util->insert(self::$queryInsertPageMeta,[
			'newPageId'=>$pageId,
			'oldPageId'=>$oldPageId
		]);
        \English3\Controller\Pages\PageVersions::_save($pageId,$page['content'],true    );
		return $pageId;
	}

	public static function _clonePageGroup(Connection $reader, $sourcePageGroupId, $targetUnitId,$id = null) {
		$util = new Utility($reader);
		$pageGroup = $util->fetch(self::$queryGetPage, array('pageId' => $sourcePageGroupId));
		$unit = $util->fetchRow(self::$queryGetUnit, array('unitId' => $targetUnitId));
		if(!$pageGroup || !$unit) {
			// pagegroup and/or unit don't exist
			return false;
		}
		$pageGroup = array_pop($pageGroup);
		unset($pageGroup['id']); // remove id (won't be inserted)
		$pageGroup['unitid'] = $targetUnitId;
		$pageGroup['created'] = date('Y-m-d H:i:s');

		if(is_null($id)){
			// actual cloning
			if($pageGroup['pagegroupid']==0){
				$pageGroupId = self::_clonePage($reader, $sourcePageGroupId, $targetUnitId);
			}
			else{
				if(self::$cloneQuizzes && intval($pageGroup['quiz_id'])>0){
					$pageGroup['quiz_id']= self::_cloneQuiz($pageGroup['quiz_id'],['courseId'=>$unit['courseid']]);
				}
				if($pageGroup['timed_id']){
					$clonePrompts = self::$clonePrompts;
					$pageGroup['timed_id']=self::_cloneTimedReview($pageGroup['timed_id'],$clonePrompts);
				}
				$reader->insert('pages', $pageGroup);
				$pageGroupId = $reader->lastInsertId();
			}

		}
		else{
			$pageGroupId=$id;
		}

		// insert pages to target new pageGroup
		$pageGroupPages = $util->fetch(self::$queryGetPageGroupPages, array('pageId' => $sourcePageGroupId));
		foreach ($pageGroupPages as $page) {
			self::_clonePage($reader, $page['id'], $targetUnitId, $pageGroupId);
		}
		return $pageGroupId;
	}

	public static function _cloneUnit(Connection $reader, $sourceUnitId, $targetCourseId) {
		$util = new Utility($reader);
		$unit = $util->fetch(self::$queryGetUnit, array('unitId' => $sourceUnitId));
		$course = $util->fetch(self::$queryGetCourse, array('courseId' => $targetCourseId));
		if(!$unit || !$course) {
			return false;
		}
		$unit = array_pop($unit);
		unset($unit['id']); // remove id (won't be inserted)
		$unit['courseid'] = $targetCourseId;
		$unit['name'] = $unit['name']==-1?$unit['name']:self::getNextUnitNumber($reader, $targetCourseId);
		$unit['created'] = date('Y-m-d H:i:s');


		$unit['superunitid'] = $unit['superunitid']?self::_cloneSuperUnit($unit['superunitid'],$targetCourseId):0;
		// actual cloning
		$unitId = $util->insert(
			self::$queryInsertUnit,
			$unit
		);
		// get source unit's pages
		$unitPages = $util->fetch(
			self::$queryGetUnitPageGroups,
			array('unitId' => $sourceUnitId)
		);
		// insert pages to target new unit
		foreach ($unitPages as $page) {
			self::_clonePageGroup($reader, $page['id'], $unitId);
		}
		return $unitId;
	}
	public static function _cloneSuperUnit($sourceSuperUnitId,$targetCourseId){
		$createdSuperUnits = &self::$createdSuperUnits;
		if($createdSuperUnits[$sourceSuperUnitId]){
			return $createdSuperUnits[$sourceSuperUnitId];
		}
		$util = Utility::getInstance();
		$sourceSuperUnit = $util->fetchRow(self::$queryGetSuperUnit, array('id' => $sourceSuperUnitId));
		$classId = ClassesController::_getFromCourseId($targetCourseId);
		$sourceSuperUnit['classid']=$classId;

		unset($sourceSuperUnit['id']);



		$id = $util->insert(self::$queryInsertSuperUnit,$sourceSuperUnit);
		$createdSuperUnits[$sourceSuperUnitId] = $id;
		return $id;
	}
	public static function _cloneCourse(Connection $reader, $sourceCourseId, $targetCourseId) {
		$util = Utility::getInstance();
		$sourceCourse = $util->fetch(self::$queryGetCourse, array('courseId' => $sourceCourseId));
		$targetCourse = $util->fetch(self::$queryGetCourse, array('courseId' => $targetCourseId));
		if(!$sourceCourse || !$targetCourse) {
			// one of the courses does not exist
			return false;
		}
		if(self::countCourseUnits($reader, $targetCourseId)) {
			// course has units (as of now, can only clone from empty course to empty course)
			return false;
		}
		$units = $util->fetch(self::$queryGetCourseUnits, array('courseId' => $sourceCourseId));
		if (!$units || !count($units)) {
			// source course has no units
			return false;
		}
		$unitIds = array();
		foreach ($units as $unit) {
			$unitIds[] = self::_cloneUnit($reader, $unit['id'], $targetCourseId);
		}
		return $unitIds;
	}
	public static function _cloneQuiz($quizId,$params=array()){
		$util = new Utility();
		$sourceQuiz = $util->fetchRow(QuizController::$queryGetQuiz,['quizId'=>$quizId]);
		$sourceQuestions = $util->fetch(QuizController::$queryGetQuizQuestions,['quizId'=>$quizId]);
		if(isset($params['courseId'])){
			$sourceQuiz['course_id']=$params['courseId'];
		}
		if(!isset($params['title'])){
			$sourceQuiz['title'].= '';
		}else{
			$sourceQuiz['title'] = $params['title'];
		}
		unset($sourceQuiz['modified']);
		unset($sourceQuiz['id']);
		$sourceQuiz['created_by'] = $_SESSION['USER']['ID'];

		$util->reader->insert('quizzes',$sourceQuiz);
		$newQuizId = $util->reader->lastInsertId();

		//clone questions
		foreach($sourceQuestions as $question){
			$newQuestionId = self::_cloneQuestion($question['id']);
			$points = $question['specificPoints']?:$question['max_points'];
			$quizQuestion = array(
				'quiz_id'=>$newQuizId,
				'question_id'=>$newQuestionId,
				'position'=>$question['position'],
				'bank_id'=>$question['bank_id'],
				'random'=>$question['random'],
				'points'=>!is_null($points)?$points:0
			);
			$util->reader->insert('quiz_questions',$quizQuestion);
		}
		return $newQuizId;
	}
	public static function _cloneQuestion($questionId){
		$util = new Utility();
		$question = $util->fetchRow(QuizController::$queryGetQuestion,['questionId'=>$questionId]);
		$question['modified_by']=$_SESSION['USER']['ID'];
		unset($question['id']);
		unset($question['modified']);
		$util->reader->insert('questions',$question);
		$newId = $util->reader->lastInsertId();

		self::_cloneQuestionOptions($questionId,$newId);

		return $newId;
	}

	public static function _cloneQuestionOptions($sourceQuestionId,$targetQuestionId){
		$util = new Utility();

		$options = $util->fetch(QuizController::$queryGetQuestionOptions,['questionId'=>$sourceQuestionId]);
		foreach($options as $option){
			$option['question_id']=$targetQuestionId;
			unset($option['id']);
			$util->reader->insert('question_options',$option);
		}

	}
	public static function _cloneTimedReview($sourceId,$shouldClonePrompts){
		$timedReviewData = Utility::getInstance()->fetchRow('SELECT * FROM timed_review WHERE id = :id',['id'=>$sourceId]);
		unset($timedReviewData['id']);
		$db = Utility::getInstance()->reader;
		if(!$timedReviewData){
			return null;
		}

		$db->insert('timed_review',$timedReviewData);
		$newId = $db->lastInsertId();
		if($shouldClonePrompts){
			self::clonePrompts($newId,$timedReviewData['dialog_json']);
		}
		return $newId;
	}
	protected  static function clonePrompts($timedTargetId,$dialog_json){
		$prompts = json_decode($dialog_json,true);
		$newPrompts = array();
		foreach($prompts as $prompt){
			if($prompt['type']=='randomFromGroup'){
				$newPrompts[]=$prompt;
			}else{
				if($prompt['selected']['prompt']){
					$prompt['selected']['prompt']= self::clonePrompt($prompt['selected']['prompt']);
					$newPrompts[]=$prompt;
				}

			}
		}
		$newDialoag_json = json_encode($newPrompts);
		Utility::getInstance()->reader->update('timed_review',['dialog_json'=>$newDialoag_json],['id'=>$timedTargetId]);
	}
	protected  static function clonePromptGroup($sourceId){
		$groupData = Utility::getInstance()->fetchRow('SELECT * FROM timed_review_groups WHERE id = :id',['id'=>$sourceId]);
		unset($groupData['id']);
		unset($groupData['modified_on']);
		$groupData['title'] = $groupData['title'].' CLONED';
		$db = Utility::getInstance()->reader;
		$db->insert('timed_review_groups',$groupData);
		return $db->lastInsertId();
	}
	protected  static function clonePrompt($sourceId,$groupId = null){
		$promptData = Utility::getInstance()->fetchRow('SELECT * FROM timed_review_prompts WHERE id = :id',['id'=>$sourceId]);
		unset($promptData['id']);
		unset($promptData['modified_on']);
		if($groupId){
			$promptData['groupid']=$groupId;
		}

		$db = Utility::getInstance()->reader;
		$db->insert('timed_review_prompts',$promptData);
		return $db->lastInsertId();
	}

	protected static function countCourseUnits(Connection $reader, $courseId) {
		$util = new Utility($reader);
		$count = $util->fetchOne(self::$queryCountCourseUnits, array('courseId' => $courseId));
		return ($count)? $count : 0;
	}

	protected static function getNextUnitNumber(Connection $reader, $courseId) {
		$util = new Utility($reader);
		$next = $util->fetchOne(self::$queryGetNextUnitNumber, array('courseId' => $courseId));
		return ($next)? $next : 1;
	}

	public static function getNextPageNumber(Connection $reader, $unitId) {
		$util = new Utility($reader);
		$next = $util->fetchOne(self::$queryGetNextPageNumber, array('unitId' => $unitId));
		return ($next)? $next : 1;
	}


	protected static $queryCountCourseUnits = <<<SQL
		SELECT COUNT(*)
		FROM units
		WHERE courseid = :courseId;
SQL;

	protected static $queryGetNextUnitNumber = <<<SQL
		SELECT MAX(name) + 1 as next
		FROM units
		WHERE courseid = :courseId;
SQL;

	protected static $queryGetNextPageNumber = <<<SQL
		SELECT MAX(position) + 1 as next
		FROM pages
		WHERE unitid = :unitId;
SQL;

	public static $queryGetPage = <<<SQL
		SELECT *
		FROM pages
		WHERE id = :pageId
SQL;

	protected static $queryGetPageAssignment = <<<SQL
		SELECT *
		FROM class_assignments
		WHERE page_id = :pageId
SQL;

	protected static $queryGetClassFromUnit = <<<SQL
		SELECT id
		FROM classes
		WHERE courseid IN (SELECT courseid FROM units WHERE id = :unitId);
SQL;
	public static $queryGetClassFromPage = <<<SQL
		SELECT c.id
		FROM pages p
		JOIN units u on p.unitid = u.id
		JOIN classes c on c.courseid = u.courseid
		WHERE p.id=:pageId;
SQL;

	public static $queryGetUnit = <<<SQL
		SELECT *
		FROM units
		WHERE id = :unitId
SQL;

	protected static $queryGetCourse = <<<SQL
		SELECT *
		FROM courses
		WHERE id = :courseId
SQL;
	protected static $queryGetSuperUnit = <<<SQL
		SELECT *
		FROM super_units
		WHERE id = :id
SQL;

	protected static $queryGetCourseUnits = <<<SQL
		SELECT units.id
		FROM units
		LEFT JOIN super_units su ON su.id = units.superunitid
		WHERE units.courseid = :courseId
		ORDER BY su.position,units.name ASC
SQL;

	protected static $queryGetUnitPageGroups = <<<SQL
		SELECT id
		FROM pages
		WHERE unitid = :unitId
			AND pagegroupid = 0
		ORDER BY position ASC
SQL;

	public static $queryGetPageGroupPages = <<<SQL
		SELECT id
		FROM pages
		WHERE pagegroupid = :pageId
		ORDER BY position ASC
SQL;

	protected static $queryInsertPage = <<<SQL
		INSERT INTO pages (
			unitid,
			pagegroupid,
			name,
			subtitle,
			moduleid,
			content,
			layout,
			position,
			allow_video_post,
			allow_text_post,
			allow_upload_post,
			is_private,
			is_gradeable,
			hide_activity,
			created,
			quiz_id,
			time_limit,
			allowed_takes,
			password,
			listen_course,
			listen_lesson,
			listen_numEx,
			native_lang,
			target_lang,
			timed_id,
			timed_limit,
			timed_pause,
			searchquiz,
			objective,
			gate,
			minimum_score,
			rubricid,
			task_type,
			task_duration,
			show_created_date,
			show_objectives,
			automatically_grade
		) VALUES (
			:unitid,
			:pagegroupid,
			:name,
			:subtitle,
			:moduleid,
			:content,
			:layout,
			:position,
			:allow_video_post,
			:allow_text_post,
			:allow_upload_post,
			:is_private,
			:is_gradeable,
			:hide_activity,
			:created,
			:quiz_id,
			:time_limit,
			:allowed_takes,
			:password,
			:listen_course,
			:listen_lesson,
			:listen_numEx,
			:native_lang,
			:target_lang,
			:timed_id,
			:timed_limit,
			:timed_pause,
			:searchquiz,
			:objective,
			:gate,
			:minimum_score,
			:rubricid,
			:task_type,
			:task_duration,
			:show_created_date,
			:show_objectives,
			:automatically_grade
		)
SQL;

	protected static $queryInsertUnit = <<<SQL
		INSERT INTO units (
			courseid,
			name,
			description,
			position,
			is_active,
			created,
			hide_from_student,
			superunitid,
			image_url,
			tab_name
		) VALUES (
			:courseid,
			:name,
			:description,
			:position,
			:is_active,
			:created,
			:hide_from_student,
			:superunitid,
			:image_url,
			:tab_name
		)
SQL;
	protected static $queryInsertPageMeta = <<<SQL
		INSERT INTO page_meta (pageid,meta_key,meta_value)
			SELECT :newPageId, meta_key,meta_value
			FROM page_meta
			where pageid=:oldPageId
SQL;
	protected static $queryInsertSuperUnit = <<<SQL
	INSERT INTO super_units (classid, name, position, hide_from_student, required_pages) VALUES (:classid, :name, :position, :hide_from_student, :required_pages)
	ON DUPLICATE KEY UPDATE name = values(name), hide_from_student = values(hide_from_student), required_pages = values(required_pages)
SQL;
	protected static $queryInsertPageAssignment = <<<SQL
		INSERT INTO class_assignments (
			class_id,
			page_id,
			points,
			due,
			due_offset_days,
			allowed_takes,
			no_due_date,
			has_exempted
		) VALUES (
			:class_id,
			:page_id,
			:points,
			:due,
			:due_offset_days,
			:allowed_takes,
			:no_due_date,
			:has_exempted
		)

SQL;
	private static $createdSuperUnits = [];
}