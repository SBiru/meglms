<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Classes\EnrollmentExporter;
use English3\Controller\Classes\UserClassDuration;
use English3\Controller\Forum\ForumGraderAPI;
use English3\Controller\Organization\OrganizationController;
use Phinx\Migration\Util;
use Silex\Application;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ClassesController{

	public function __construct(Connection $reader) {
		$this->reader = $reader;
		$this->util = Utility::getInstance();
	}

	private function prepareAndFetch($query, $paramsArray) {
		$preparedStatement = $this->reader->prepare($query);
		$preparedStatement->execute($paramsArray);
		return $preparedStatement->fetchAll();
	}

	private function prepareAndExecute($query, $paramsArray) {
		$preparedStatement = $this->reader->prepare($query);
		return $preparedStatement->execute($paramsArray);
	}

	public static function countUnits(Connection $reader, $courseId = null) {
		if(!$courseId) {
			return false;
		}
		$instance = new self($reader);
		$data = $instance->prepareAndFetch(
			$instance->queryCountUnits,
			array(':courseId' => $courseId)
		);
		if ($data) {
			return intval($data[0]['unitCount']);
		}
		return false;
	}
	public function hasTimedReview(Request $request, $classId){
		$hasTimedReview = boolval(Utility::getInstance()->fetchOne($this->queryHasTimedReview,['id'=>$classId]));
		return new JsonResponse(['hasTimedReview'=>$hasTimedReview]);
	}
    public function _getClassesAs($as,$includePosts=null,$includeUsers=null,$params=null,$echo=true){
        $filter = new ClassesFilter($this);
        return $filter->getClassesAs($as,$includePosts,$includeUsers,$params,$echo);
    }
	public function deleteUserData(Request $request,$classId,$userId){
		$util = Utility::getInstance();
		$userController = new UserController($util->reader);
		$user = $userController->byId($util->reader,$userId);
		if(!$user){
			return Utility::buildHTTPError("Invalid user id",400);
		}
		$util->checkAdmin($user->user->getOrgId());

		$util->insert(self::$queryDeleteGradebookUserData,['userId'=>$userId,'classId'=>$classId]);
		$util->insert(self::$queryDeleteHistoryUserData,['userId'=>$userId,'classId'=>$classId]);
		$util->insert(self::$queryDeletePostsUserData,['userId'=>$userId,'classId'=>$classId]);
		$util->insert(self::$queryDeleteQuizFeedbackUserData,['userId'=>$userId,'classId'=>$classId]);
		$util->insert(self::$queryDeleteQuizResponseUserData,['userId'=>$userId,'classId'=>$classId]);
		$util->insert(self::$queryDeleteQuizScoreUserData,['userId'=>$userId,'classId'=>$classId]);
		$util->insert(self::$queryDeleteScoreOverrideUserData,['userId'=>$userId,'classId'=>$classId]);

		if($request->query->has('recalculate')){
			if($request->query->get('recalculate')=='now'){
				GradebookController::_recalculate($userId,null,$classId);
			}else{
				GradebookController::_setRecalculateGradebook($classId,$userId);
			}
		}

		return new JsonResponse(['ok'=>true]);
	}
	public function calculateDueDates(Request $request, $classId,$userId) {
        $dueDates = self::_calculateDueDates($userId,$classId);
		foreach($dueDates as $pageId => $dueDate){

			$this->reader->executeUpdate(self::$querySetDueDates,[
				'pageId'=>$pageId,
				'userId'=>$userId,
				'dueDate'=>$dueDate,
			]);
		}
		return new JsonResponse(['ok'=>true]);
	}
	public function unsetDueDates(Request $request, $classId,$userId) {
		$this->reader->executeUpdate(self::$queryunsetDueDates,['classId'=>$classId,'userId'=>$userId]);
		return new JsonResponse(['ok'=>true]);
	}
	public function getClassWithPages(Request $request,$id){
		$data = Utility::getInstance()->fetch(self::$queryGetClassWithPages,['classId'=>$id]);
		$class=null;
		$i=0;
		$pageGroupIndex=array();
		foreach($data as $row){
			if(!$class){
				$class=array(
					'id'=>$row['classId'],
					'name'=>$row['className'],
					'units'=>array()
				);
			}
			$units = &$class['units'];

			if(!$units[$row['unitId']]){
				$units[$row['unitId']] = array(
					'id'=>$row['unitId'],
					'name'=>$row['unitName'],
					'position'=>$row['unitPosition'],
					'pageGroups'=>array()
				);
				$i=0;
			}
			$pageGroups = &$units[$row['unitId']]['pageGroups'];
			$page = array(
				'id'=>$row['id'],
				'name'=>$row['name'],
				'layout'=>$row['layout']
			);
			if(!$row['pageGroups']) {
				$pageGroups[$i] = array('id' => null, 'name' => null, 'pages' => array($page));
				$i++;
			} else {
				// pagegroup has already been added before
				if(array_key_exists($row['pageGroupId'], $pageGroupIndex)) {
					$pageGroups[$pageGroupIndex[$row['pageGroupId']]]['pages'][] = $page;
					// new pagegroup
				} else {
					$pageGroups[$i] = array(
						'id' => intval($row['pageGroupId']),
						'name' => $row['pageGroupName'],
						'pages' => array($page)
					);
					$pageGroupIndex[$row['pageGroupId']] = $i;
					$i++;
				}
			}
		}
		return new JsonResponse($class);
	}
	public function getClasses(Request $request, $id = null, $raw = false, $includeAll = false,$groupId=false) {
		//Getting all classes for students,teachers,edit_teachers or observer;
		$curTime = microtime(true);
		if($request->query->has('as')){
			return $this->_getClassesAs($request->query->get('as'),$request->query->get('includePosts'),$request->query->get('includeUsers'),$request->query->all());
		}
		// if [true], teachers and students in class will be added under 'users'
		$includeUsers = boolval($request->query->get('includeUsers')) || $includeAll;
		$from = $request->query->get('from');
		$to = $request->query->get('to');
		$courseId = $request->query->get('courseId');
		$unitId = $request->query->get('unitId');
		$orgId = $request->query->get('orgId');
		// if [true], list of units/pagegroups/pages and scores will be added to class object
		$includeGrades = boolval($request->query->get('includeGrades')) || $includeAll;
		$includeProgress = boolval($request->query->get('includeProgress')) || $includeAll;

		// access permissions
		$this->me = UserController::me($this->reader);
		if(!$this->me) {
			throw new HttpException(403, 'You must be logged in');
		} else if(!$this->me->isTeacher()) {
			throw new HttpException(403, 'You must be a teacher.');
		} else if($id) {
			if(!$this->me->isTeacher($id)) {
				throw new HttpException(403, 'You must be a teacher in this class.');
			}
		}

		// SQL WHERE
		$where = ' WHERE ';
		if($id != null) {
			$id = intval($id);
			$where .= "c.id = $id";
		} else if($courseId){
			$where .= "courses.id = $courseId";
		} else if($unitId) {
			$where .= "units.id = $unitId";
		} else if($orgId){
			$where .= "departments.organizationid = $orgId GROUP BY c.id";
		} else{
			$where .= '1';
		}

		$query = self::$queryGetClasses . $where;
		$data = $this->reader->fetchAll($query);

		$json = array();
		if($data) {
			// get all classes (no [id] was defined)
			if($id == null) {
				foreach ($data as $row) {
					$json[] = $this->wrapClassObject($row, $includeUsers, $includeGrades,null,null,$includeProgress);
				}
			// get class with id = [id]
			} else {
				$result = $this->wrapClassObject($data[0], $includeUsers, $includeGrades, $from, $to,$includeProgress);
				if($raw) {
					return $result;
				} else {
                    $result['enableCreditedAssignments'] = boolval(OrganizationController::_getField($result['orgId'],
                        'enable_credited_assignments'));
					return new JsonResponse($result);
				}
			}
		}


		return new JsonResponse($json);
	}



	public static function _getClass($classId,$usingCourseId=false) {
		$util = Utility::getInstance();
		if($usingCourseId){
			return $util->fetchRow(self::$queryGetClassFromCourseId,['courseId'=>$classId]);
		}
		else{
			return $util->fetchRow(self::$queryGetClass,['classId'=>$classId]);
		}

	}
	public function importGrades(Request $request,$id){
		$util = Utility::getInstance();
		$orgId = self::_getOrgId($util->reader,$id);
		$util->checkAdmin($orgId);
		$importData = json_decode($request->getContent());

		$response = array();
		$students = array();
		foreach($importData as $pageId => $pageData){
			if(isset($pageData->studentgrades)){
				if($pageData->type=="quiz"){
					$points = QuizController::_getQuizMaxPoints(QuizController::_getQuizFromPageId($pageId));
				}else{
					$points = PageController::_getPagePoints($pageId,$id);
				}

				if($points){
					foreach($pageData->studentgrades as $student){
						if(array_search($student->id,$students)===false){
							$students[]=$student->id;
						}
						$studentNewScore = floatval($student->score);

						if($pageData->type=="quiz") {
							$scoreId = $util->fetchOne(QuizController::$queryGetUserQuizData,[
								'userId'=>$student->id,
								'quizId'=>$pageId
							]);
							if($scoreId) {
								$this->reader->update(
									'quiz_scores',
									array(
										'score' => $studentNewScore,
										'max_points'=>$points),
									array(
										'id'=>$scoreId
									)
								);
							}else{
								$this->reader->insert(
									'quiz_scores',
									array(
										'score' => $studentNewScore,
										'max_points'=>$points,
										'user_id'=>$student->id,
										'quiz_id'=>$pageId,
										'class_id'=>$id
									)
								);
							}

						}
						else{
							$scoreId = $util->fetchOne(self::$queryGetScoreOverrideData,[
								'userId'=>$student->id,
								'pageId'=>$pageId,
								'classId'=>$id
							]);
							if($scoreId) {
								$this->reader->delete(
									'scores_overrides',
									array(
										'userId'=>$student->id,
										'pageId'=>$pageId,
										'classId'=>$id
									)
								);
							}
							$util->insert(
								self::$queryOverrideScore,
								array(
									'score' => $studentNewScore,
									'userId'=>$student->id,
									'pageId'=>$pageId,
									'classId'=>$id,
									'is_deleted'=>0,
									'byUserId'=>$_SESSION['USER']['ID'],
								)
							);
						}
					}
					$response[$pageId] = 'success';
				}
				else{
					$response[$pageId]='Page not found or no grademax is set in the system';
				}
			}
		}
		foreach($students as $student){
			GradebookController::_recalculate($student,null,$id);
		}

		return new JsonResponse($response);


	}
	public function exportGrades(Request $request,$id){
		$util = Utility::getInstance();
		$orgId = self::_getOrgId($util->reader,$id);
		$util->checkAdmin($orgId);

		$classData=self::_getClass($id);

		$class = $this->wrapClassObject($classData,true,true);
		/*
		 * Exporting grades indexed by export_id
		 */
		$pages = array();
		if($class){
			/*
			 * Building activities
			 */
			foreach($class['units'] as $unit){
				if(!count($unit['pagegroups'])){
					continue;
				}
				foreach($unit['pagegroups'] as $pagegroup){
					foreach($pagegroup['pages'] as $page){
						$id = $page['id'];

						$pages[$id]=array(
							'_id'=>$page['id'],
							'_export_id'=>$page['export_id'],
							'_moodle_id'=>$page['external_id'],
							'type'=>$page['layout'],
							'studentgrades'=>array(),
							'name'=>$page['name']
						);

					}
				}
			}
			if(isset($class['users']) && isset($class['users']['students'])){
				foreach($class['users']['students'] as $student){
					foreach($student['units'] as $unit) {
						if(!@$unit['pagegroups'] || gettype(@$unit['pagegroups']) !='array'){
							continue;
						}
						foreach (@$unit['pagegroups'] as $pagegroup) {
							foreach ($pagegroup['pages'] as $gradeInfo) {
								$id = isset($gradeInfo['export_id'])?$gradeInfo['export_id']:$gradeInfo['id'];
								$page = &$pages[$id];
								if (!isset($page['grademax'])){
									$page['grademax']=$gradeInfo['maxScore'];
								}

								$student['score']=$gradeInfo['score'];
								$student['grademax']=$gradeInfo['maxScore'];
								unset($student['maxScore']);
								unset($student['units']);
								$page['studentgrades'][]=$student;

							}
						}
					}
				}
			}

		}

		return new JsonResponse($pages);
	}
	public function exportEnrollmentAsCsv(Request $request,$id){
		$util = Utility::getInstance();
		$util->checkTeacher($id);
		$exporter = new EnrollmentExporter(new CSVExporter());
		return new JsonResponse([
				'content' => $exporter->export($id),
				'filename' => $request->query->get('filename').date('Y-m-d').'.csv'
			]
		);
	}
	public function getGradebookCSV(Request $request, Application $app, $id = null){
		global $PATHS, $DB;
		$me = UserController::me($this->reader);

		$groupId=false;
		if(strpos($id,'-')!==false){
			$groupId=explode('-',$id)[1];
			$id=explode('-',$id)[0];
		}
		$data = $this->getClasses($request, $id, true, true);

		$orgfolder = substr(md5('org_' . $me->user->getOrgId()), -10, -5) . $me->user->getOrgId() . '/';
		$full_path = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $orgfolder;
		$this->checkcreatefolder($full_path);
		$userfolder = substr(md5('user_' .  $_SESSION['USER']['ID']),-11,-5).$_SESSION['USER']['ID'] . '/';
		$full_path .= $userfolder;
		$this->checkcreatefolder($full_path);

		// headers
			$result = $data['name'] . "\r\n" . 'Student';
		$grandMaxScore = 0;
		foreach ($data['units'] as $unit) {
			foreach ($unit['pagegroups'] as $pagegroup) {
				foreach ($pagegroup['pages'] as $page) {
					$result .= ',' .$page['name'] . ' ( ' .$page['maxScore'].  ' )';
					$grandMaxScore += $page['maxScore'];
				}
			}
		}
		$result .= ',Completed Tasks (%)';
		$result .= ($data['showGrades']['score'])? ',Current Total' : '';
		$result .= ($data['showGrades']['percentage'])? ',Current Total (%)' : '';
		$result .= ($data['showGrades']['score'])? ',Overall Total' : '';
		$result .= ($data['showGrades']['percentage'])? ',Overall Total (%)' : '';
		$result .= ($data['showGrades']['letter'])? ',Grade' : '';
		$result .= ($data['showFinalGrade'])? ',Final Grade' : '';
		$result .= "\r\n";

		// scores
		foreach ($data['users']['students'] as $student) {
			if($groupId&&$student['groupId']!=$groupId){
				continue;
			}
			$studentTotal = 0;
			$result .= $student['lastName'] . '. ' . $student['firstName'];
			foreach ($student['units'] as $key => $unit) {
				$studentTotal += $unit['totalScore'];
				foreach ($unit['pagegroups'] as $pagegroup) {
					foreach ($pagegroup['pages'] as $page) {
						$score = (array_key_exists('scoreOverride', $page))? $page['scoreOverride'] : $page['score'];
						$result .= ',' . (($score == null)? '-' : $score);
					}
				}
			}
			$result .= ',' . $student['units']['percentWorkedTasks'] . '%';
			$result .= ($data['showGrades']['score'])? ',' . $studentTotal . ' / ' . $student['units']['totalWorkedScore'] : '';
			$result .= ($data['showGrades']['percentage'])? ',' . $student['units']['percentPartial'] . '%' : '';
			$result .= ($data['showGrades']['score'])? ',' . $studentTotal . ' / ' . $student['units']['totalMaxScore'] : '';
			$result .= ($data['showGrades']['percentage'])? ',' . $student['units']['percentComplete'] . '%' : '';
			$result .= ($data['showGrades']['letter'])? ',' . $student['units']['letterGrade'] : '';
			$result .= ($data['showFinalGrade'])? ',' . $student['units']['finalGrade'] : '';
			$result .= "\r\n";
		}

		$filename = 'grades-' . $data['name'] . '-' . date('d.m.Y') . '.csv';
		$full_path .= $filename;
		$targetFile = fopen($full_path, 'w');
		fwrite($targetFile, $result);
		fclose($targetFile);
		if($request->query->get('getData')){
			return new JsonResponse(['filename'=>$filename,'content'=>$result]);
		}else{
			return $app->sendFile($full_path, 200, array('Content-type' => 'text/csv'), 'attachment');
		}

	}

	public function getClassUsers(Request $request, $id = null) {
		$util = Utility::getInstance();

		// access permissions ////////////
		$util->calcLoggedIn();

		$org = OrganizationController::_getOrgFromClassId($id);
		$isTeacher = $util->checkTeacher($id,$org,false);
		$isStudent = $util->checkStudent($id,$org,false);

		if(!$isTeacher && ! $isStudent){
			throw new HttpException(403, 'You are not allowed to see this content.');
		}
		///////////////////////////////

		$includeGrades = boolval($request->query->get('includeGrades'));
		$includeGuardians = boolval(@$request->query->get('includeGuardians'));

		$users = $this->getUsers(intval($id), $includeGrades,null,null,$includeGuardians);



		if($isStudent && !$isTeacher){
			unset($users['students']);
		}
		return new JsonResponse($users);
	}
	public function getPasswords(Request $request,$classId){
		$util = Utility::getInstance();
		$util->checkTeacher($classId);
		$class = self::checkPagePasswordExpiration($classId,false);
		$pages = $class&&count($class)?@$class[0]['pagePasswordsAboutToExpire']:[];
		return new JsonResponse($pages);
	}
	public function getAssignments(Request $request, $classId) {
		$util = Utility::getInstance();
		$util->checkTeacher($classId);
		$onlyGradeable = boolval($request->query->get('onlyGradeable'));
		$pages = $util->fetch(self::$queryGetAssignmentsAndQuizzesForClass,['classId'=>$classId]);
		$preparedPages = array();

		foreach($pages as $page){

			$page['isGradeable']=boolval($page['isGradeable']);
			if($onlyGradeable){
				if($page['isGradeable'])
				$preparedPages[]=$page;
			}else{
				$this->createAssignmentEntryIfNotExists($page,$classId);

				if($page['pageGroupId']){
					$pageGroup = &$this->createPageGroupIfNotExists($preparedPages,$page);
					$pageGroup['pages'][]=$page;
				}else{
					$position = intval($page['unitPosition'])*100 + intval($page['position']);
					$preparedPages[$position]=$page;
				}
			}


		}
		return new JsonResponse(array_values($preparedPages));
	}
	private function createAssignmentEntryIfNotExists(&$page,$classId){
		$util = Utility::getInstance();
		if(!$page['caId']){
			$util->reader->insert(
				'class_assignments',
				[
					'class_id'=>$classId,
					'page_id'=>$page['id']

				]
			);
			$page['caId']=$util->reader->lastInsertId();
		}
	}
	private function &createPageGroupIfNotExists(&$preparedPages,$page){
		$position = intval($page['unitPosition'])*100 + intval($page['pageGroupPosition']);
		if(!(isset($preparedPages[$position]) && isset($preparedPages[$position]['pages']))) {
			$preparedPages[$position] = array(
				'isPageGroup' => true,
				'id' => $page['pageGroupId'],
				'name' => $page['pageGroupName'],
				'pages' => array()
			);
		}
		return $preparedPages[$position];
	}

	public function updateDurations(Request $request,$classId)
	{
		$util=new Utility();
		$orgId = self::_getOrgId($this->reader,$classId);
		$util->checkTeacher($classId,$orgId);

		$body = json_decode($request->getContent(),true);
		$util->checkRequiredFields(['pages'],$body);

		self::_updateDurations($body['pages'],$util);

		if(isset($body['courseLength'])){
			$util->reader->update(
				'classes',
				['course_length'=>intval($body['courseLength'])],
				['id'=>$classId]
			);
		}

		return new JsonResponse($body);
	}
	public static function isProficiencyTest($classId){
		return boolval(Utility::getInstance()->fetchOne('SELECT classid FROM proficiency_classes WHERE classid =:classId',['classId'=>$classId]));
	}
	public static function isPracticeTest($classId,$userId=null){
		return boolval(Utility::getInstance()->fetchOne('SELECT p.classid FROM products p join groups g on g.id = p.practice_group_id join classes c on c.id = p.classid WHERE g.classid =:classId and c.is_j1_class = 1',
			['classId'=>$classId]));
	}
	public static function isJ1($classId){
		return boolval(Utility::getInstance()->fetchOne('SELECT is_j1_class FROM classes WHERE id =:classId',['classId'=>$classId]));
	}
	public function finalizeGrades(Request $request, $classId) {
		// access permissions
		$this->me = UserController::me($this->reader);
		if(!$this->me) {
			throw new HttpException(403, 'You must be logged in');
		}
		if(!$this->me->isTeacher($classId)) {
			throw new HttpException(403, 'You must be a teacher in this class.');
		}
		Utility::clearPOSTParams($request);
		// for individual user, by userId
		$userId = $request->request->get('userId');
		if($userId) {
			$grade = $request->request->get('grade');
			$comments = $request->request->get('comments');
			if(!$grade) {
				throw new HttpException(400, 'You must provide a grade param.');
			}

			//sending email to student
			//EmailController::sendFinalGrade($userId,$classId,$grade,$comments);

			return new JsonResponse(UserController::_finalizeGrade( $userId, $classId, $grade, $comments));
		}
		// for entire class
		// ...

		// for group of students
		// ...
	}

	// wrap class in single object
	public function wrapClassObject($row, $includeUsers = false, $includeGrades = false, $from = null, $to = null,$includeProgress=false,$includeNonActive=false) {
		if($row == null) { return; }
		$rubric = array(
			array(
				'gradeLetter' => 'A+',
				'min' => intval($row['a_plus_min']),
				'use' => boolval($row['use_grade_a_plus'])
			),
			array(
				'gradeLetter' => 'A',
				'min' => intval($row['a_min']),
				'use' => boolval($row['use_grade_a'])
			),
			array(
				'gradeLetter' => 'A-',
				'min' => intval($row['a_minus_min']),
				'use' => boolval($row['use_grade_a_minus'])
			),
			array(
				'gradeLetter' => 'B+',
				'min' => intval($row['b_plus_min']),
				'use' => boolval($row['use_grade_b_plus'])
			),
			array(
				'gradeLetter' => 'B',
				'min' => intval($row['b_min']),
				'use' => boolval($row['use_grade_b_plus'])
			),
			array(
				'gradeLetter' => 'B-',
				'min' => intval($row['b_minus_min']),
				'use' => boolval($row['use_grade_b_minus'])
			),
			array(
				'gradeLetter' => 'C+',
				'min' => intval($row['c_plus_min']),
				'use' => boolval($row['use_grade_c_plus'])
			),
			array(
				'gradeLetter' => 'C',
				'min' => intval($row['c_min']),
				'use' => boolval($row['use_grade_c'])
			),
			array(
				'gradeLetter' => 'C-',
				'min' => intval($row['c_minus_min']),
				'use' => boolval($row['use_grade_c_minus'])
			),
			array(
				'gradeLetter' => 'D+',
				'min' => intval($row['d_plus_min']),
				'use' => boolval($row['use_grade_d_plus'])
			),
			array(
				'gradeLetter' => 'D',
				'min' => intval($row['d_min']),
				'use' => boolval($row['use_grade_d'])
			),
			array(
				'gradeLetter' => 'D-',
				'min' => intval($row['d_minus_min']),
				'use' => boolval($row['use_grade_d_minus'])
			),
			array(
				'gradeLetter' => 'F',
				'min' => 0,
				'use' => true
			),
		);
		$this->rubric = $rubric;
		$wrapped = array(
			'id' => intval(@$row['id']),
			'courseId' => intval(@$row['courseid']),
			'name' => @$row['name'],
			'isActive' => boolval(@$row['is_active']),
			'created' => strtotime(@$row['created']) * 1000,
			'showDates' => boolval(@$row['show_dates']),
			'showFinalGrade' => boolval(@$row['show_final_grade']),
			'studentCount' => intval(@$row['studentCount']),
			'rubric' => $rubric,
			'courseLength'=>intval(@@$row['course_length']),
			'orgId'=>intval(@@$row['orgId'])
		);
		if(boolval($row['show_grades'])) {
			$wrapped['showGrades'] = array(
				'score' => boolval($row['show_grades_as_score']),
				'letter' => boolval($row['show_grades_as_letter']),
				'percentage' => boolval($row['show_grades_as_percentage'])
			);
		} else {
			$wrapped['showGrades'] = false;
		}
		if($includeUsers) {
			$wrapped['users'] = $this->getUsers($row['id'], $includeGrades, $from, $to,false,$includeProgress,false,$includeNonActive);
		}
		if($includeUsers && $includeGrades) {
			$wrapped['units'] = $this->units;
		}
		return $wrapped;
	}
	public static function _getUnitsByClassId($classId,$util=null){
		if(is_null($util)){
			$util = Utility::getInstance();
		}
		$units = array();
		$data = $util->fetch(
			self::$queryGetUnitsByClassId,
			array(':classId' => $classId)
		);
		foreach ($data as $row) {
			$unit = array(
				'id' => intval($row['id']),
				'name' => $row['name'],
				'description' => $row['description'],
			);
			$units[] = $unit;
		}
		return $units;
	}
		
	// wrap users (students and teachers)
	
	public function getUsers($classId, $includeGrades = false, $from = null, $to = null,$includeGuardians = false,$includeProgress=false,$groupId=false,$includeNonActive=false) {
		// get units if they are to be included (happens when grades are included)
		if($includeGrades) {
			$units = self::_getUnitsByClassId($classId);
		}

		// getting users..
		$regEx = ($from && $to)? ("^[$from-$to].*$") : ".*$";
		$data = $this->prepareAndFetch(
			$includeNonActive?$this->queryGetAllUsersByClassId:$this->queryGetUsersByClassId,
			array(':classId' => $classId, ':regEx' => $regEx,':groupId'=>$groupId)
		);
		$users = array(
			'students' => array(),
			'teachers' => array(),
			'edit_teachers' => array(),
		);

		// build final 'users' array if class has users (students or teachers)
		if($data) {
			foreach ($data as $row) {
				$user = array(
					'id' => intval($row['userid']),
					'firstName' => $row['fname'],
					'lastName' => $row['lname'],
					'externalId' => $row['external_id'],
					'groupId'=>$row['groupid'],
					'email' => $row['email'],
					'isActive'=>$row['is_active']
				);
				// include grades (units) if this user is a students and includeGrades
				// is set to [true]
				if(boolval($row['is_student']) && !boolval($row['is_teacher']) && $includeGrades) {
					$userUnits = $this->getStudentUnitsAndGrades($units, $classId, $row['userid'],$includeProgress);
					$user['units'] = $userUnits;
				}
				if($includeGuardians){
					$user['guardians']=UserController::_getGuardians($row['userid']);
				}
				if(boolval($row['is_teacher'])) {
					$users['teachers'][] = $user;
				}
				if(boolval($row['is_edit_teacher'])) {
					$users['edit_teachers'][] = $user;
				}
				if (boolval($row['is_student'])) {
					$users['students'][] = $user;
				}
			}
		}
		return $users;
	}

	// get all grades (query gets all grades per assignments and quiz by user)
	// including empty scores (=null). See $queryGetAssignmentsAndQuizzes for query.
	// In the first read, we'll fill a 'units' objects, to compress size of returned
	// data through http response. Each student (and only students) will have:
	//	units > pagegroups > pages + score
	// while we'll conserve a separate, global object (for main class structure) with:
	//	units > pagegroups > pages + details
	public function getStudentUnitsAndGrades($units, $classId, $userId,$includeProgress=false) {
		// return object
		$unitsAndGrades = array();
		if(!$this->units) {
			$this->buildRootUnits($units);
		}
		$grandTotal = 0;
		$grandMaxTotal = 0;
		$completedTasks = 0;
		$expectedTasks = 0;
		$totalTasks = 0;
		$totalSubmittedTasks = 0;
		$totalWorkedScore = 0;
		$totalCompletedOrDueScore = 0;
		
		$isProficiencyTest = ClassesController::isProficiencyTest($classId);
		if($includeProgress){

			$durationToComplete= 0;
			$totalDuration=0;
		}
		$defaultExemptPoints = ClassesController::getClassField($classId,'default_exempt_points');
		$defaultExemptPoints = $defaultExemptPoints && $defaultExemptPoints!=='null'?$defaultExemptPoints:95;
		
		
		foreach ($units as $unit) {
			// for building pagegroups in units:
			$pagegroups = array();
			$groupIndex = array();
			// building..
			//DB query optomized by Golabs 30/04/2015
			$data = $this->prepareAndFetch(
				self::	$queryGetAssignmentsAndQuizzes,
				array(':classId' => $classId, ':unitId' => $unit['id'], ':userId' => $userId)
			);
			// build 'units' object for root of response
			if(!$this->rootUnitsReady) {
				$this->units[] = $this->buildRootUnits($unit, $data);
			}
			// separate pages into groups
			$i = 0;
			$totalScore = 0;
			foreach ($data as $row) {
				if(boolval($row['hide_activity'])) {
					continue;
				}
				if($row['layout']=='QUIZ'){
					if(boolval(@$row['quizNeedingGrade']) && $row['scoreOverride']===null && $isProficiencyTest){
						$row['score'] = null;
					}else{

                        $highest_score = floatval($row['highest_score']);
                        if($highest_score>0 && boolval($row['keep_highest_score'])){
                            $row['score'] = $highest_score;
                            $row['is_finished']=1;
                        }
                        if(boolval($row['can_return']) && !boolval($row['is_finished'])){
                            $row['score']=null;
                        }
					}
				}
                else {
                    // to get the highest value from grade_posts  tables if Keep_highest_score is enabled
					// scoreOverride should always have priority
                    if (boolval($row['page_keep_highest_score']) && $row['scoreOverride']===null) {
                        $gradePost_highest_score = Utility::getInstance()->fetchRow(
							self::$queryGetGradesFromGradePosts,
							array(':classId' => $classId, ':userId' => $userId, ':pageId' => $row['pageId'])
						);
						if ($gradePost_highest_score['highest_grade'] !== null) {
							$row['score'] = $gradePost_highest_score['highest_grade'];
							$row['post_feedback_id'] = $gradePost_highest_score['id'];
                        }
                    } //if keep_highest_score is disabled
                    else {
                        $row['score'] = isset($row['scoreOverride']) ? (@$row['overrideDeleted'] ? null : $row['scoreOverride']) : $row['score'];
                    }
                }

				if($row['layout']=='JOURNAL'){
					$row['postGrade'] = JournalController::_getStudentGrade($row['pageId'],$userId);
				}
				if($row['layout']=='FORUM'){
					$ctrl = new ForumGraderAPI();
					$gradeInfo =  $ctrl->getStudentGradeInfo($row['pageId'],$userId);
                    $row['postGrade'] = @$gradeInfo['grade'];
                    $row['post_feedback_id'] = @$gradeInfo['id'];
				}



				$page = array(
					'id' => intval($row['pageId']),
					'score' => (
						($row['score'] !== null)?
							floatval($row['score'])
							:
							(($row['postGrade'] !== null)? floatval($row['postGrade']) : null)
						),
					'maxScore' => floatval($row['total']),
					'post_feedback_id'=>$row['post_feedback_id'],
					'has_quiz_feedback'=>$row['has_quiz_feedback'],
					'due_date'=>$row['user_due']?$row['user_due']:$row['due'],
					'submitted'=>$row['submitted']
				);

				if(boolval($row['is_survey'])){
					$page['maxScore']=floatval($row['survey_points']);
					if($row['quizScoreId'] &&$row['is_finished'] ){
						$page['score']=floatval($row['survey_points']);
					}
				}

				$page['layout'] = $row['layout'];
				if($row['scoreOverride'] !== null) {
					$page['scoreOverride'] = floatval($row['scoreOverride']);
					$page['overrideBy'] = intval($row['overrideBy']);
					$page['overrideOn'] = strtotime($row['overrideOn']) * 1000;
					$page['overrideDeleted'] = boolval($row['overrideDeleted']);
				}

				if($row['exemptedBy'] !== null) {
					$page['exemptedBy'] = intval($row['exemptedBy']);
					$page['exemptedOn'] = strtotime($row['exemptedOn']) * 1000;
					$page['exemptedComments'] = $row['exemptedComments'];
					$page['isCredited'] = $row['isCredited'];
					if($defaultExemptPoints && @$row['isCredited']){
						$totalTasks++;
						$expectedTasks++;
						$grandMaxTotal += $page['maxScore'];
						$completedTasks++;
						$totalWorkedScore += $page['maxScore'];
                        $totalCompletedOrDueScore += $page['maxScore'];
						$page['score'] = ($defaultExemptPoints/100)*$page['maxScore'];
						$totalScore += $page['score'];
					}
				} else {
					$totalTasks++;
					if(new \DateTime($row['user_due'])< new \DateTime()){
						$expectedTasks++;
					}
					$grandMaxTotal += $page['maxScore'];
					if($row['minimum_score_for_completion']){
						$score = $row['scoreOverride'] !== null?$row['scoreOverride']:$page['score'];
						$score = @$page['overrideDeleted']?null:$score;
						if($score){
							$completedTasks +=floatval($score/$page['maxScore'])*100>=floatval($row['minimum_score_for_completion'])?1:0;
						}
					}
					else{
						$completedTasks += !@$page['overrideDeleted'] && ($row['scoreOverride'] !== null || $page['score'] !== null)? 1 : 0;
					}
                    $page['overrideDeleted']= @$page['overrideDeleted']?:false;
					if(!@$page['overrideDeleted'] && ($row['scoreOverride'] !== null || $page['score'] !== null)) {
						$totalWorkedScore+=$page['maxScore'];
					}
					if((!@$page['overrideDeleted'] && ($row['scoreOverride'] !== null || $page['score'] !== null) ) ||
						( (new \DateTime($row['user_due']))< new \DateTime()) ) {
						$totalCompletedOrDueScore+=$page['maxScore'];
					}

					$score = ($row['scoreOverride'] === null) || boolval($page['overrideDeleted'])? $page['score'] : $page['scoreOverride'];
                    $totalScore += @$page['overrideDeleted']?0:$score;
                    if($page['submitted'] || ($score && !@$page['overrideDeleted'])){
                        $totalSubmittedTasks++;
                    }

				}




				if($includeProgress){
					if($row['scoreOverride'] === null && $page['score'] === null) {
						$durationToComplete += floatval($row['lesson_duration']);
					}
					$totalDuration+=floatval($row['lesson_duration']);
				}
				//rounding page scores since we made the calculations already
				if($page['score']){
					$page['score']=round($page['score'],2);
				}
				if(@$page['overrideDeleted']){
					$page['score']=null;
				}
				if($page['maxScore']){
					$page['maxScore']=round($page['maxScore'],2);
				}


				if(!$row['groupId']) {
					$pagegroups[$i] = array('id' => null, 'pages' => array($page));
					$i++;
				} else {
					if(array_key_exists($row['groupId'], $groupIndex)) {
						$pagegroups[$groupIndex[$row['groupId']]]['pages'][] = $page;
					// new pagegroup
					} else {
						$pagegroups[$i] = array('id' => intval($row['groupId']), 'pages' => array($page));
						$groupIndex[$row['groupId']] = $i;
						$i++;
					}
				}


			}

			// add to return object (units)
			$unitsAndGrades[] = array('id' => $unit['id'], 'totalScore' => round($totalScore,2), 'pagegroups' => $pagegroups);
			$grandTotal += $totalScore;



		}
		$this->rootUnitsReady = true;
		if($totalTasks > 0) {
			$unitsAndGrades['percentWorkedTasks'] = intval($completedTasks * 100 / $totalTasks);
			$unitsAndGrades['percentExpectedTasks'] = intval($expectedTasks * 100 / $totalTasks);
			$unitsAndGrades['percentSubmittedTasks'] = intval($totalSubmittedTasks * 100 / $totalTasks);
			$unitsAndGrades['submittedTasks'] = $totalSubmittedTasks;
			$unitsAndGrades['completedTasks'] = $completedTasks;
			$unitsAndGrades['expectedTasks'] = $expectedTasks;
			$unitsAndGrades['totalTasks'] = $totalTasks;
		}
		if($totalWorkedScore > 0 && $grandMaxTotal > 0) {
			$unitsAndGrades['percentPartial'] = round(floatval($grandTotal * 100 / $totalWorkedScore),2);
			$unitsAndGrades['percentComplete'] = round(floatval($grandTotal * 100 / $grandMaxTotal),2);
			$unitsAndGrades['percentCompletedOrDueScore'] = round(floatval($grandTotal * 100 / $totalCompletedOrDueScore),2);
		} else {
			$unitsAndGrades['percentPartial'] = $unitsAndGrades['percentComplete'] = 0;
		}
		$unitsAndGrades['totalScore'] = round($grandTotal,2);
		$unitsAndGrades['totalWorkedScore'] = round($totalWorkedScore,2);
		$unitsAndGrades['totalMaxScore'] = round($grandMaxTotal,2);
		$unitsAndGrades['totalCompletedOrDueScore'] = round($totalCompletedOrDueScore,2);

        // get final grade
		$finalGrade = $this->prepareAndFetch(
			$this->queryGetFinalGrade,
			array(':classId' => $classId, ':userId' => $userId)
		);
		$finalGrade = @$finalGrade[0]['finalGrade'];
		$unitsAndGrades['finalGrade'] = ($finalGrade != null)? $finalGrade : null;

		// get letter grade
		$letterGrade = 'F';
		if($grandMaxTotal > 0){
			// in this case, totalScore is a scalar representing a percentage
			$totalScore = intval(($grandTotal * 100) / $grandMaxTotal);
			$found = false;
			foreach($this->rubric as $letter){
				if($found) {
					break;
				}
				if($letter['use'] && $totalScore >= $letter['min']) {
					$letterGrade = $letter['gradeLetter'];
					$found = true;
				}
			};
		}
		
		$unitsAndGrades['letterGrade'] = $letterGrade;
		
		//calculate projected end date
		$orgId = ClassesController::_getOrgId($this->reader,$classId);
		if($includeProgress && SiteController::_getUserSite($userId) && boolval(OrganizationController::_getField($orgId,'calculate_progress')) ){
			//projected time to complete the class (days)
			$util = Utility::getInstance();
			$schoolCalendar = floatval(UserClassDuration::_getClassDuration($userId,$classId));
			$timeToComplete = ($schoolCalendar/$totalDuration)*$durationToComplete;
			$projectedDate  = self::_getProjectedEndDate($timeToComplete,$userId);
			if(gettype($projectedDate)!=="string"){
				$projectedDate = $projectedDate->format('Y-m-d');
			}
			$unitsAndGrades['projectedEndDate'] = $projectedDate;

			$unitsAndGrades['expectedEndDate'] = self::_getExpectedDate($userId, $classId);;
			$unitsAndGrades['enrollmentDate'] = self::getEnrollmentDate($userId,$classId);
		}
		
		return $unitsAndGrades;
	}

	// for root object in response
	// contains all units and their pagegroups and pages
	// also adds total count of points, users, etc.
	private function buildRootUnits($unit = null, $data = null) {
		if(!$unit || !$data) {
			return;
		}
		if(!array_key_exists('grandMaxScore', $this->units)) {
			$this->units['grandMaxScore'] = 0;
		}
		// for building pagegroups in units:
		$pagegroups = array();
		$groupIndex = array();
		// separate pages into groups
		$i = 0;
		$totalMaxScore = 0;
		foreach ($data as $row) {
			if(boolval($row['hide_activity'])) {
				continue;
			}
			$page = array(
				'id' => intval($row['pageId']),
				'name' => $row['pageName'],
				'due' => strtotime($row['due']) * 1000,
				'maxScore' => floatval($row['total']),
				'hasExempted' => boolval($row['hasExempted']),
				'layout' => strtolower($row['layout']),
				'lesson_duration' => floatval($row['lesson_duration']),
				'user_specific_duration' => floatval($row['user_specific_duration']),
				'export_id'=>$row['export_id'],
				'external_id'=>$row['external_id'],
			);
			if(!$row['groupId']) {
				$pagegroups[$i] = array('id' => null, 'name' => null, 'pages' => array($page));
				$i++;
			} else {
				// pagegroup has already been added before
				if(array_key_exists($row['groupId'], $groupIndex)) {
					$pagegroups[$groupIndex[$row['groupId']]]['pages'][] = $page;
				// new pagegroup
				} else {
					$pagegroups[$i] = array(
						'id' => intval($row['groupId']),
						'name' => $row['groupName'],
						'lesson_duration'=>floatval($row['groupDuration']),
						'pages' => array($page)
					);
					$groupIndex[$row['groupId']] = $i;
					$i++;
				}
			}
			$totalMaxScore += $row['total'];
		}
		$this->units['grandMaxScore'] += $totalMaxScore;
		$result = array(
			'id' => intval($unit['id']),
			'number' => intval($unit['name']),
			'description' => $unit['description'],
			'pagegroups' => $pagegroups,
			'totalMaxScore' => $totalMaxScore
		);
		return $result;
	}
	public static function _getGradeAsLetter($classId,$grade){
		if(!is_numeric($grade)){
			return $grade;
		}
		$self = new self(Utility::getInstance()->reader);
		$class = $self->wrapClassObject(self::_getClass($classId));
		return GradebookController::_getLetterGrade($grade,$class['rubric']);
	}
	public static function _getFromCourseId($courseId){
		$util = Utility::getInstance();
		return $util->fetchOne(self::$queryGetClassFromCourseId,['courseId'=>$courseId],'id');
	}
	public static function _getCourseId($classId){
		$util = Utility::getInstance();
		return $util->fetchOne(self::$queryGetClass,['classId'=>$classId],'courseId');
	}
	public static function _getOrgId(Connection $reader,$classid){
		$util = new Utility($reader);
		return $util->fetchOne(self::$queryGetOrgForClass,['classId'=>$classid]);
	}
	public static function _getDeptId($classid){
		$util = Utility::getInstance();
		return $util->fetchOne(self::$queryGetDeptForClass,['classId'=>$classid]);
	}
	public function setScoreOverride(Request $request) {
		if (0 === strpos($request->headers->get('Content-Type'), 'application/json')) {
			$postData = json_decode($request->getContent(), true);
			$request->request->replace(is_array($postData) ? $postData : array());
		}
		// if [true], teachers and students in class will be added under 'users'
		$classId = intval($request->request->get('classId'));
		$pageId = intval($request->request->get('pageId'));
		$userId = intval($request->request->get('userId'));
		$is_deleted=$request->request->get('score')===''?1:0;
		$score = floatval($request->request->get('score'));
		// access permissions
		$this->me = UserController::me($this->reader);
		if(!$this->me->isTeacher($classId)) {
			throw new HttpException(403, 'You must be a teacher in this class.');
		}

		$success = $this->prepareAndExecute(
			self::$queryOverrideScore,
			array(
				':classId' => $classId,
				':pageId' => $pageId,
				':userId' => $userId,
				':score' => $score,
				':is_deleted'=>$is_deleted,
				':byUserId' => intval($this->me->user->getUserId()),
			)
		);
		if(!$success) {
			throw new HttpException(500, 'Error ocurred while inserting score');
		}
		GradebookController::_recalculate($userId,null,$classId);
		return new JsonResponse(GradebookController::_getProgressReport($classId,$userId));
	}
	public static function _updateDurations($pages,$util = null){
		if(is_null($util)){
			$util = Utility::getInstance();
		}
		foreach($pages as $page){
			$required = ['id','lesson_duration'];
			$util->checkRequiredFields($required,$page);
			$util->reader->update(
				'pages',
				['lesson_duration'=>$page['lesson_duration']],
				['id'=>$page['id']]);
		}
	}
	public static function _getFromPage(Connection $reader =null,$pageId){
		$util = Utility::getInstance();
		return $util->fetchOne(CloneController::$queryGetClassFromPage,['pageId'=>$pageId]);
	}
	public static function _isDueDateSet($userId,$classId){
		$util = Utility::getInstance();
		return $util->fetchOne(self::$queryIsDueDateSet,['userId'=>$userId,'classId'=>$classId]);
	}
	public static function _progressReport($classId){
		$util=new Utility();

	}
	public static function _getSchoolCalendar($userId,$classId){
		$siteId = SiteController::_getUserSite($userId);
		$orgId = self::_getOrgId(Utility::getInstance()->reader,$classId);
		if(is_null($siteId)){
			$calendar = Utility::getInstance()->fetchOne(OrganizationController::$queryGetOrg,['orgId'=>$orgId],'blackouts');
		}
		else{
			$siteInfo = Utility::getInstance()->fetchRow(SiteController::$queryGetSite,['siteId'=>$siteId]);
			$calendar = boolval($siteInfo['use_default_calendar'])?Utility::getInstance()->fetchOne(OrganizationController::$queryGetOrg,['orgId'=>$orgId],'blackouts'):$siteInfo['blackouts'];
		}
		$calendar = json_decode($calendar,true);
		if(is_null($calendar)){
			return "Site calendar was not set";
		}
		return $calendar;
	}
	//returns array of {pageId:dueDate}
	public static function _courseDurationFromManualEndDate($startDate,$endDate,$calendar){
		$courseDuration = 0;
		$checkDate = new \DateTime($startDate);
		$endDate = new \DateTime($endDate);
		while($checkDate < $endDate){
			if(!self::isDateHolidayOrWeekend($checkDate,$calendar)){
				$courseDuration++;
			}
			$checkDate->add(new \DateInterval('P1D'));
		}
		return $courseDuration;
	}
	public static function _calculateDueDates($userId,$classId,$save=false){


        if(preg_match("/[0-9]+-[0-9]+/", $classId)){
            $classId = intval(explode('-',$classId)[0]);
        }
        $util=new Utility();

		//this function will return an object array of {pageId:dueDate}
		$due_dates = array();

		//Getting calendar info

		$calendar = self::_getSchoolCalendar($userId,$classId);
		if(gettype($calendar)==='string'){
			return [];
		}

		//Getting assignments info
		$units = self::_getUnitsByClassId($classId);
		foreach($units as &$unit){
			$unit['assignmentsData'] = $util->fetch(
				self::$queryGetAssignmentsAndQuizzes,
				array(':classId' => $classId, ':unitId' => $unit['id'], ':userId' => $userId)
			);
		}

		$enrollmentDate = self::getEnrollmentDate($userId,$classId);
		$nextDueDate = new \DateTime($enrollmentDate);
		$totalClassDuration = self::_getTotalClassDuration($units);
		if($manualEndDate = self::getProgressReportEndDateDate($userId,$classId)){
			$schoolCalendar = floatval(self::_courseDurationFromManualEndDate($enrollmentDate,$manualEndDate,$calendar));
		}else{
			$schoolCalendar = floatval(UserClassDuration::_getClassDuration($userId,$classId));
		}

		if(!$totalClassDuration){
			return;
		}
		$daysPerDurationUnit = ($schoolCalendar/$totalClassDuration);

		foreach($units as $unitData){
			foreach($unitData['assignmentsData'] as $assignment){
				if(isset($assignment['exemptedBy']) && !$assignment['isCredited']){
					continue;
				}
				$nextDueDate = self::_getNextDueDate($nextDueDate,$daysPerDurationUnit*$assignment['lesson_duration'],$calendar);
				if($assignment['due'] && strtotime($assignment['due']) > strtotime('2015-01-01') && !$assignment['no_due_date']){
                    $calculatedOrManuallySet =$assignment['due'];
				}else{
                    $calculatedOrManuallySet = $nextDueDate->format('Y-m-d H:i:s');
				}

				$due_dates[$assignment['pageId']]=$calculatedOrManuallySet;
			}
		}
		$util->reader->update(
			'user_classes',
			['recalculate_due_dates'=>0],
			[
				'userid'=>$userId,
				'classid'=>$classId
			]
		);
		if($save){
			Utility::getInstance()->reader->executeUpdate(self::$queryunsetDueDates,['classId'=>$classId,'userId'=>$userId]);
			foreach($due_dates as $pageId => $dueDate){

				Utility::getInstance()->reader->executeUpdate(self::$querySetDueDates,[
					'pageId'=>$pageId,
					'userId'=>$userId,
					'dueDate'=>$dueDate,
				]);
			}
		}
		else{
			return $due_dates;
		}

	}
	public function getAdviseesClasses(Request $request){
		Utility::getInstance()->calcLoggedIn();
		$user = new UserController();
		$query = sprintf($this->queryGetAdviseesClasses,implode(',',$user->getAdviseeIds($_SESSION['USER']['ID'])));
		return new JsonResponse(Utility::getInstance()->fetch($query));
	}
	public static function getClassField($classId,$field){
		return Utility::getInstance()->fetchOne('SELECT * FROM classes WHERE id = :classId',['classId'=>$classId],$field);
	}
	private static function getEnrollmentDate($userId,$classId){
		if(!$start_date = Utility::getInstance()->fetchOne(self::$queryGetGroupEnrollmentDate,['userId'=>$userId,'classId'=>$classId])){
			$start_date = Utility::getInstance()->fetchOne(self::$queryGetEnrollmentDate,['userId'=>$userId,'classId'=>$classId],'created');
		}
		return $start_date;
	}
	private static function getProgressReportEndDateDate($userId,$classId){
		if($manualDate = Utility::getInstance()->fetchOne(self::$queryGetManualExpectedDate,['userId'=>$userId,'classId'=>$classId])){
			return $manualDate;
		}

	}
	private static function _nextWorkDay(\DateTime $start,$calendar,$offset=0){
		$start->add(new \DateInterval('P'.$offset.'D'));
		$dateString = $start->format('Y-m-d');
		$dayOfWeek = date( "w", $start->getTimestamp());
		while(self::isHolidayOrWeekend($dateString,$dayOfWeek,$calendar)){
			$start->add(new \DateInterval('P1D'));
			$dateString = $start->format('Y-m-d');
			$dayOfWeek = date( "w", $start->getTimestamp());
		}
		return $start;
	}

	private static function isHolidayOrWeekend($dateString,$dayOfWeek,$calendar){
		return @array_search($dateString,$calendar['blackouts'])!==false ||
		@array_search($dayOfWeek,$calendar['weekdays'])!==false;
	}
	private static function isDateHolidayOrWeekend(\DateTime $date,$calendar){
		$dateString = $date->format('Y-m-d');
		$dayOfWeek = date( "w", $date->getTimestamp());
		return self::isHolidayOrWeekend($dateString,$dayOfWeek,$calendar);
	}
	public static function _getProjectedEndDate($timeToComplete,$userId,$calendar=null){
		$util = Utility::getInstance();
		if(!$calendar){
			//Getting calendar info
			$siteId = SiteController::_getUserSite($userId);
			if(is_null($siteId)){
				return "User is not in a site";
			}
			$calendar = $util->fetchOne(SiteController::$queryGetSite,['siteId'=>$siteId],'blackouts');
			if(!$calendar){
				$orgId = $util->fetchOne("SELECT organizationid FROM users WHERE id = :userId",['userId'=>$userId]);
				$calendar = $util->fetchOne(OrganizationController::$queryGetOrg,['orgId'=>$orgId],'blackouts');
			}
			$calendar = json_decode($calendar,true);
			if(is_null($calendar)){
				return "Site calendar was not set";
			}

		}


		$now = new \DateTime();
		$now=self::_nextWorkDay($now,$calendar);

		while($timeToComplete>1){
			$now=self::_nextWorkDay($now,$calendar,1);
			$timeToComplete--;
		}
		if($timeToComplete>0){
			$secondDuration = round($timeToComplete*24*60*60);
			$now->add(new \DateInterval('PT'.$secondDuration.'S'));
			$now = self::_nextWorkDay($now,$calendar);
		}
		return $now;
		
	}
	public static function _getNextDueDate(\DateTime $now,$duration,$calendar){
		$now=self::_nextWorkDay($now,$calendar);
		while($duration>1){
			$now=self::_nextWorkDay($now,$calendar,1);
			$duration--;
		}
		if($duration>0){
			$secondDuration = round($duration*24*60*60);
			$now->add(new \DateInterval('PT'.$secondDuration.'S'));
			$now = self::_nextWorkDay($now,$calendar);
		}
		return $now;
	}
	private static function _getTotalClassDuration($units){
		$total = 0;
		foreach($units as $unit){
			foreach($unit['assignmentsData'] as $assignment){
				if(isset($assignment['exemptedBy']) && !$assignment['isCredited']){
					continue;
				}
				$total+=($assignment['user_specific_duration']?$assignment['user_specific_duration']:$assignment['lesson_duration']);
			}
		}
		return $total;
	}
	public static function _getExpectedDate($userId,$classId,$onlyCalculated=false){
		$util = Utility::getInstance();
		if(!$onlyCalculated && $manualDate = $util->fetchOne(self::$queryGetManualExpectedDate,['userId'=>$userId,'classId'=>$classId])){
			return $manualDate;
		}
		return $util->fetchOne(self::$queryGetExpectedDate,['userId'=>$userId,'classId'=>$classId]);
	}
	public static function _getFromUnitId($unitId){
		$util = Utility::getInstance();
		return $util->fetchOne(self::$queryGetFromUnitId,['unitId'=>$unitId]);

	}

	static function nextPagePasswordExpirationDate($pagePasswordConfig,\DateTime $now){
		if($pagePasswordConfig['password_expiration_type']=='fixed'){
			$dates = $pagePasswordConfig['password_expiration_dates'];
			$newExpirationDate = null;
			foreach($dates as $date){
				if(new \DateTime($date)>$now){
					$newExpirationDate=new \DateTime($date);
				}
			}
		}else{
			$time = $pagePasswordConfig['password_expiration_time'];
			$unit = $pagePasswordConfig['password_expiration_unit'];

			$interval = 'P'.$time.strtoupper(substr($unit,0,1));

			$newExpirationDate = $now->add(new \DateInterval($interval));
		}
		return $newExpirationDate;
	}
	static function getPagesPasswordExpiration($classId,$pagePasswordConfig,$onlyAboutToExpire){
		$pages = Utility::getInstance()->fetch(self::$queryPagesWithPassword,['classId'=>$classId]);
		$aboutToExpire = array();
		foreach($pages as $page){
			$lastPasswordChange = isset($page['last_password_change'])?new \DateTime($page['last_password_change']):new \DateTime($page['created']);

			$nextExpirationDate = self::nextPagePasswordExpirationDate($pagePasswordConfig,$lastPasswordChange);
			$nextExpirationDate=$nextExpirationDate?$nextExpirationDate:new \DateTime();
			$fiveDays = 5*24*60*60;
			$timeUntilExpiration = $nextExpirationDate->getTimestamp()-(new \DateTime())->getTimestamp();
			$page['willExpire']=$page['last_password_change']?$nextExpirationDate->getTimestamp()-(new \DateTime($page['last_password_change']))->getTimestamp()>$fiveDays:true;
			if(($timeUntilExpiration<$fiveDays && $page['willExpire']) || $onlyAboutToExpire===false){
				$page['nextExpirationDate']=$nextExpirationDate;
				$page['timeUntilExpiration']=$timeUntilExpiration;

				$aboutToExpire[]=$page;
			}
		}
		return count($aboutToExpire)?$aboutToExpire:false;
	}
	public static function _getClassMeta($classId, $key = null)
	{
		$util = Utility::getInstance();
		if (is_null($key)) {
			$data = $util->fetch(self::$queryGetClassMetaData, ['classId' => $classId]);
			$arrayData = array();
			foreach ($data as $row) {
				$arrayData[$row['meta_key']] = $row['meta_value'];
			}
			return $arrayData;
		} else {
			return $util->fetchOne(self::$queryGetClassMetaKey, ['classId' => $classId, 'metaKey' => $key]);
		}
	}
	public static function checkPagePasswordExpiration($classId=null,$onlyAboutToExpire=true){

		if($onlyAboutToExpire && isset($_SESSION['LAST_PASSWORD_CHECK'])){
			//we are going to check once a day or every new login;
			$oneDay = 60*60*24;
			if(time() - $_SESSION['LAST_PASSWORD_CHECK']<$oneDay){
				return false;
			}
		}


		Utility::getInstance()->calcLoggedIn();
		$me = Utility::getInstance()->me;

		$classes = 	$classId?[array('id'=>$classId)]:$me->classesIEdit();
		$aboutToExpire=[];
		$orgConfig = array();
		foreach($classes as $class){
			$orgId = OrganizationController::_getOrgFromClassId($class['id']);
			if(!@$orgConfig[$orgId]){
				$orgConfig[$orgId]['pagePasswordConfig'] = json_decode(OrganizationController::_getField($orgId,'page_password_config'),true);
			}

			if(!@$orgConfig[$orgId]['pagePasswordConfig'] || !boolval($orgConfig[$orgId]['pagePasswordConfig']['enable_password_expiration'])){
				return false;
			}
			try{
				$pages = self::getPagesPasswordExpiration($class['id'],$orgConfig[$orgId]['pagePasswordConfig'],$onlyAboutToExpire);
			}catch(\Exception $e){
				$a = $e;
			}

			if($pages){
				$class['pagePasswordsAboutToExpire']=$pages;
				$aboutToExpire[]=$class;
			}
		}
		session_start();
		$_SESSION['LAST_PASSWORD_CHECK'] = time();
		session_write_close();
		return $aboutToExpire;
	}

	function checkcreatefolder($fllefolder) {
		$fllefolder = preg_replace('@\/\/$@', '/', $fllefolder);
		if (!file_exists($fllefolder)) {
			mkdir($fllefolder, 0777, true);
		}
	}

	private $rootUnitsReady = false;
	private $units = array();	// will exist when grades per user are also requested. Appended to root object
	private $reader;

	/* QUERY: override student's score */
	public static $queryOverrideScore = <<<SQL
		INSERT INTO scores_overrides (classId, pageId, userId, score, byUserId, date,is_deleted)
		VALUES (:classId, :pageId, :userId, :score, :byUserId, CURRENT_TIMESTAMP,:is_deleted)
		ON DUPLICATE KEY UPDATE score = :score, date = CURRENT_TIMESTAMP, is_deleted = :is_deleted
SQL;

	/* QUERY: exempt user (one) from assignment */
	private $queryCountUnits = <<<SQL
		SELECT COUNT(*) AS unitCount
		FROM units
		WHERE courseid = :courseId
SQL;
	public static $queryGetClass = <<<SQL
		SELECT c.*
		FROM classes c
		WHERE c.id = :classId
SQL;
	public static $queryGetClassWithPages = <<<SQL
		SELECT
		p.id,
		p.name,
		p.layout,
		pg.id as pageGroupId,
		pg.name as pageGroupName,
		u.id as unitId,
		u.description as unitName,
		u.name as unitPosition,
		c.id as classId,
		c.name as className
		FROM pages p
		JOIN units u ON p.unitid = u.id
		JOIN classes c ON c.courseid = u.courseid
		LEFT JOIN pages as pg ON pg.id = p.pagegroupid
		WHERE c.id = :classId
		GROUP BY p.id
SQL;
	public static $queryGetClassFromCourseId=<<<SQL
	SELECT c.*,departments.organizationid as orgId
		FROM classes c
		JOIN courses on c.courseid = courses.id
		JOIN departments on departments.id = courses.departmentid
		WHERE c.courseid = :courseId
SQL;

	/* QUERY: get list of classes in entire app (WHERE clause can be appended afterwards) */
	private static $queryGetClasses = <<<SQL
		SELECT c.*, cl.studentCount,units.id as unitId,departments.organizationid as orgId
		FROM classes c
		LEFT JOIN (
			SELECT uc.classid AS id, COUNT(userid) AS studentCount
			FROM user_classes uc
			WHERE uc.is_student = 1 AND is_teacher = 0
			GROUP BY uc.classid
		) AS cl ON (c.id = cl.id)
		INNER JOIN courses on c.courseid = courses.id
		INNER JOIN units on c.courseid = units.courseid
		INNER JOIN departments on courses.departmentid = departments.id

SQL;


	/* QUERY: get list of units in class */
	public static $queryGetUnitsByClassId = <<<SQL
		SELECT u.*
		FROM units u
		WHERE u.courseid IN (SELECT c.courseid FROM classes c WHERE c.id = :classId)
			AND u.is_active = 1
		ORDER BY u.name ASC
SQL;

	/* QUERY: get list of users in class (both students and teachers) */
	private $queryGetUsersByClassId = <<<SQL
		SELECT *,1 as is_active
		FROM (
			SELECT u.fname, u.lname, u.email,u.external_id, uc.*
			FROM user_classes uc
			INNER JOIN users u ON (uc.userid = u.id)
				AND (u.lname REGEXP :regEx)
				AND uc.is_student = 1
				AND uc.is_teacher = 0
			UNION
			SELECT u.fname, u.lname, u.email,u.external_id, uc.*
			FROM user_classes uc
			INNER JOIN users u ON (uc.userid = u.id)
				AND uc.is_teacher = 1
		) AS class
		WHERE classid = :classId and if(:groupId,groupid=:groupId,1)
		ORDER BY lname ASC
SQL;
    private $queryGetAllUsersByClassId = <<<SQL
		SELECT *
		FROM (
			SELECT u.fname, u.lname, u.email,u.external_id, uc.*
			FROM (select * from (SELECT *,1 as is_active FROM user_classes union select *,0 as is_active from 
			user_classes_history) a group by userid,classid) uc
			INNER JOIN users u ON (uc.userid = u.id)
				AND (u.lname REGEXP :regEx)
				AND uc.is_student = 1
				AND uc.is_teacher = 0
			UNION
			SELECT u.fname, u.lname, u.email,u.external_id, uc.*,1
			FROM user_classes uc
			INNER JOIN users u ON (uc.userid = u.id)
				AND uc.is_teacher = 1
		) AS class
		WHERE classid = :classId and if(:groupId,groupid=:groupId,1)
		ORDER BY lname ASC
SQL;

	private static $queryGetAssignmentsAndQuizzesForClass = <<<SQL
	SELECT p.name,
			p.id,
			p.position,
			pg.name as pageGroupName,
			pg.id as pageGroupId,
			pg.position as pageGroupPosition,
			ca.id as caId,
			u.name as unitPosition,
			p.password,
			if(
			  p.layout LIKE "%QUIZ%" OR
			  p.is_gradeable=1
		  ,1,0) as isGradeable
	FROM pages p
	LEFT JOIN pages pg ON p.pagegroupid = pg.id
	JOIN units u ON u.id = p.unitid and u.hide_from_student = 0
	JOIN classes cl on cl.courseid = u.courseid
	LEFT JOIN class_assignments ca on ca.page_id = p.id
	WHERE cl.id = :classId
	ORDER BY u.name,p.position

SQL;
	/* QUERY: get graded assignments and quizzes (by 1.classId, 2.unitId, and 3.userId) */
	// should take < 1ms pre-processed
	//
	//Optomized by Golabs 30/04/2015
	private static $queryGetAssignmentsAndQuizzes = <<<SQL
		SELECT a.*,
			if(a.max_points > 0, a.max_points, if(layout='VOCAB_QUIZ', count(v.id), sum(quiz_questions.max_points))) AS total,
			postgr.postGrade AS postGrade,
			postgr.post_feedback_id,
			if(quizScoreId is not null,quizSubmitted,postgr.postSubmitted) as submitted,
			ce.byUserId AS exemptedBy,
			ce.date AS exemptedOn,
			ce.comments AS exemptedComments,
			ce.is_credited as isCredited
		FROM (
				SELECT
				cl.id AS classId,
				p.id AS pageId,
				uc.userid AS userId,
				uc.final_score AS finalGrade,
				p.name AS pageName,
				p.can_return,
				if(p.pagegroupid > 0, p.pagegroupid, null) AS groupId,
				pg.name AS groupName,
				pg.lesson_duration as groupDuration,
				ca.due AS due,
				ca.no_due_date,
				if(udd.manual_due_date,udd.manual_due_date,udd.due_date) as user_due,
				p.quiz_id AS quiz_id,
				p.layout,
				p.moduleid,
				p.hide_activity,
				p.keep_highest_score AS page_keep_highest_score,
				p.lesson_duration,
				udd.page_duration as user_specific_duration,
				p.position,
				p.export_id,
				p.external_id,
				q.is_survey,
				q.keep_highest_score,
				p.survey_points,
				p.minimum_score_for_completion,
				sov.score AS scoreOverride,
				sov.byUserId AS overrideBy,
				sov.date AS overrideOn,
				sov.is_deleted as overrideDeleted,
				qs.score,
				qs.id as quizScoreId,
				qs.highest_score,
				qs.is_finished,
				if(qr.quiz_response_id,1,0) as quizNeedingGrade,
				if(qs.highest_score is not null,qs.submitted,null) as quizSubmitted,
				ca.id AS caId,
				ca.has_exempted AS hasExempted,
				if(ca.points > 0, ca.points, null) AS max_points,
				qf.quiz_id is not null as has_quiz_feedback
				FROM (select * from user_classes union select * from user_classes_history) AS uc
				INNER JOIN classes AS cl ON (uc.classid=cl.id)
				INNER JOIN courses AS c ON (c.id=cl.courseid)
				INNER JOIN units AS u ON (u.courseid=c.id) and u.hide_from_student = 0
				INNER JOIN pages AS p ON (u.id=p.unitid)
				LEFT JOIN quizzes AS q ON p.quiz_id = q.id
				LEFT JOIN pages AS pg ON (p.pagegroupid=pg.id)
				LEFT JOIN page_meta excludeFlag ON pg.id = excludeFlag.pageid and excludeFlag.meta_key='exclude_from_gradebook'
				LEFT JOIN class_assignments AS ca ON (ca.page_id=p.id)
				LEFT JOIN user_due_dates udd ON udd.pageid = p.id AND uc.userid = udd.userid
				LEFT JOIN quiz_scores qs ON p.id = qs.quiz_id AND qs.user_id = uc.userid
				LEFT JOIN quiz_responses qr on qr.user_id = uc.userid and qr.quiz_id=p.id and qr.is_correct = -1
				LEFT JOIN scores_overrides sov ON p.id = sov.pageId AND uc.userid = sov.userId AND cl.id = sov.classId
				LEFT JOIN (SELECT quiz_id,user_id FROM quiz_feedback WHERE feedback is not null GROUP BY quiz_id,user_id) qf ON qf.quiz_id = p.quiz_id and qf.user_id = uc.userid
				WHERE cl.id = :classId
					AND u.id = :unitId
					AND uc.userid = :userId
					AND (p.is_gradeable = true OR p.layout like '%QUIZ%' OR p.layout like '%SURVEY%')
					AND (excludeFlag.meta_value is null or excludeFlag.meta_value = 0)
				GROUP BY p.id, uc.userid
		) AS a
		LEFT JOIN
		 ( SELECT quiz_questions.*,
		   if(quiz_questions.points or quiz_questions.random,
				if(quiz_questions.random,
					if(quiz_questions.points,quiz_questions.points,1)*quiz_questions.random,
					quiz_questions.points),
				questions.max_points) as max_points
          FROM quiz_questions
          LEFT JOIN questions on quiz_questions.question_id = questions.id
        ) quiz_questions ON a.quiz_id = quiz_questions.quiz_id
		LEFT JOIN vocabularies v ON a.moduleid = v.module_id AND a.layout='VOCAB_QUIZ'
		LEFT JOIN ( SELECT *
					FROM (SELECT p2.id AS postid, gp.id as post_feedback_id, p2.classid, p2.userid, p2.pageid, gp.grade AS postGrade,p2.created as postSubmitted FROM (SELECT posts.id,posts.classid,posts.userid,posts.pageid,posts.created from
					 		posts
					 		join pages on pages.id = posts.pageid and if(pages.automatically_grade=0,posts.id = posts.postrootparentid,1) and is_deleted=0
					 		join posts parent on posts.postrootparentid = parent.id
					 		where posts.userid=:userId and if(posts.id!=posts.postrootparentid,posts.userid!=parent.userid,1)
					 		order by posts.created desc) p2
					 		LEFT JOIN grade_posts gp ON gp.post_id = p2.id
					 		 group by pageid
					 		) p2
					) postgr
				ON (postgr.classid = a.classId AND postgr.userid = a.userId AND postgr.pageid = a.pageId)
		LEFT JOIN class_exempted ce ON (ce.userId = a.userId AND ce.caId = a.caId)
		group by a.pageId, a.userId
		ORDER BY position
SQL;

	private $queryGetFinalGrade = <<<SQL
		SELECT final_score AS finalGrade
		FROM user_classes
		WHERE classid = :classId AND userid = :userId
SQL;
	private static $queryGetOrgForClass=<<<SQL
		SELECT o.id
		FROM organizations o
		JOIN departments d on d.organizationid = o.id
		JOIN courses co on co.departmentid = d.id
		JOIN classes c on c.courseid = co.id
		WHERE c.id = :classId
SQL;
	public static $queryGetDeptForClass=<<<SQL
		SELECT d.id FROM departments d
		JOIN courses co on co.departmentid = d.id
		JOIN classes c on c.courseid = co.id
		WHERE c.id = :classId
SQL;
	protected static $queryIsDueDateSet = <<<SQL
		SELECT userid FROM user_due_dates udd
		JOIN pages p ON p.id = udd.pageid
		JOIN units u ON u.id = p.unitid
		JOIN classes c ON c.courseid = u.courseid
		 WHERE udd.userid = :userId AND c.id = :classId
		  LIMIT 1
SQL;
	protected static $queryunsetDueDates = <<<SQL
		DELETE udd FROM user_due_dates udd
		 JOIN pages on udd.pageid = pages.id
		 JOIN units on pages.unitid = units.id
		 JOIN classes on units.courseid = classes.courseid
		 WHERE udd.userid=:userId and classes.id=:classId
SQL;
	private static $querySetDueDates = <<<SQL
		INSERT INTO user_due_dates (userid, pageid, due_date)
		VALUES (:userId, :pageId,:dueDate)
		ON DUPLICATE KEY UPDATE due_date=:dueDate
SQL;
	private static $queryGetEnrollmentDate = <<<SQL
		SELECT if(manual_start_date,manual_start_date,created) as created FROM user_classes WHERE userid = :userId and classid = :classId
SQL;
	private static $queryGetGroupEnrollmentDate = <<<SQL
		SELECT g.start_date FROM user_classes uc
		  JOIN groups g on g.id = uc.groupid
		WHERE userid = :userId and uc.classid = :classId limit 1
SQL;
	private static $queryGetManualExpectedDate = <<<SQL
	SELECT manual_expected_end_date FROM user_classes WHERE userid = :userId and classid = :classId
SQL;
	private static $queryGetExpectedDate = <<<SQL
		SELECT due_date FROM user_due_dates udd
		 JOIN pages on udd.pageid = pages.id
		 JOIN units on pages.unitid = units.id
		 JOIN classes on units.courseid = classes.courseid
		WHERE udd.userid = :userId and classes.id=:classId
		 ORDER BY due_date DESC LIMIT 1;
SQL;
	public static $queryGetScoreOverrideData = <<<SQL
		SELECT * FROM scores_overrides WHERE userId = :userId and classId = :classId and pageId = :pageId
SQL;
	private static $queryInsertScoreOverride = <<<SQL
		INSERT INTO scores_overrides (classId, pageId, userId, score, byUserId, "date") VALUES
		 (:classId,:pageId,:userId,:score,:byUserId,CURRENT_TIMESTAMP)
SQL;
	public static $queryGetFromUnitId = <<<SQL
		SELECT cl.* FROM
		classes cl
		JOIN units u ON u.courseid = cl.courseid
		WHERE u.id = :unitId
SQL;
	protected static $queryDeleteQuizScoreUserData = <<<SQL
	DELETE qs FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN quiz_scores qs ON qs.quiz_id = pages.id
	WHERE c.id = :classId and qs.user_id = :userId
SQL;
	protected static $queryDeleteQuizResponseUserData = <<<SQL
	DELETE qr FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN quiz_responses qr ON qr.quiz_id = pages.id
	WHERE c.id = :classId and qr.user_id = :userId
SQL;
	protected static $queryDeleteQuizFeedbackUserData = <<<SQL
	DELETE qf FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN quiz_responses qr ON qr.quiz_id = pages.id
	JOIN quiz_feedback qf ON qf.quiz_id = pages.id
	WHERE c.id = :classId and qf.user_id = :userId
SQL;
	protected static $queryDeleteScoreOverrideUserData = <<<SQL
	DELETE so FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN scores_overrides so ON so.pageId = pages.id
	WHERE c.id = :classId and so.userId = :userId
SQL;
	protected static $queryDeleteHistoryUserData = <<<SQL
	DELETE ah FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN activity_history ah ON ah.pageid = pages.id
	WHERE c.id = :classId and ah.userid = :userId
SQL;
	protected static $queryDeleteGradebookUserData = <<<SQL
	DELETE g FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN gradebook g ON g.pageid = pages.id
	WHERE c.id = :classId and g.userid = :userId
SQL;
	protected static $queryDeletePostsUserData = <<<SQL
DELETE p FROM
	pages
	JOIN units u ON pages.unitid = u.id
	JOIN classes c ON u.courseid = c.courseid
	JOIN posts p ON p.pageid = pages.id
	WHERE c.id = :classId and p.userid = :userId
SQL;
	 protected static $queryPagesWithPassword = <<<SQL
	SELECT p.id,
		p.password,
		p.last_password_change,
		p.name

	FROM pages p
	JOIN units u ON u.id = p.unitid
	JOIN classes c ON c.courseid = u.courseid
	WHERE c.id = :classId and p.password <> "" and p.password is not null
SQL;

	private $queryHasTimedReview = <<<SQL
	SELECT p.id FROM pages p
	JOIN units u ON p.unitid = u.id
	JOIN classes c ON c.courseid = u.courseid
	WHERE c.id = :id  and p.layout='TIMED_REVIEW' LIMIT 1
SQL;
	private static $queryGetClassMetaData = <<<SQL
		SELECT meta_key,meta_value
		FROM class_meta
		WHERE classid = :classId
SQL;
	private static $queryGetClassMetaKey = <<<SQL
		SELECT meta_value
		FROM class_meta
		WHERE classid = :classId and meta_key= :metaKey
SQL;
    private static $queryGetGradesFromGradePosts = <<<SQL
	SELECT gp.id,gp.grade AS highest_grade  FROM grade_posts AS gp
	LEFT JOIN posts AS p ON (gp.post_id = p.id) 
	WHERE p.classid = :classId
		AND p.userid = :userId 
		AND p.pageid = :pageId
	order by gp.grade desc limit 1
SQL;
    private $queryGetAdviseesClasses = <<<SQL
	SELECT c.id,
	if(g.id,concat(c.name,' - ',g.name),c.name) as fullname,
	c.name,
	g.id as groupId,g.name as groupName FROM classes c
	join user_classes uc on c.id = uc.classid
	left join groups g on uc.groupid = g.id
	where uc.userid in (%s)
	group by c.id,g.id;
SQL;


}
class ClassesFilter {
    /**
     * @var ClassesController
     */
	private $classesCtrl;
	private $where;
	private $filterWhere = ' WHERE 1 ';
	private $whereOrgId;
	private $whereDeptId;
	private $query;
	private $queryParams;
	private $util;
	private $amIAdmin;
	public function __construct(ClassesController $classesCtrl){
		$this->classesCtrl = $classesCtrl;
		$this->util = Utility::getInstance();
	}

    public function getClassesAs($as,$includePosts=null,$includeUsers=null,$params=null,$echo=true){

        $deptId = @$params['deptId'];
        $orgId = @$params['orgId'];
        $this->amIAdmin =  $this->util->checkAdmin($orgId,true,false);
        $this->queryParams = array();

        $this->prepareWhereAs($as);
        $this->query  = $this->selectQuery($as);
        $this->filterSitesIfNecessary($params);
        $this->filterTeacherIfNecessary($params);
        $this->filterStudentIfNecessary($params);
		$this->extraWheresAndQueryParamms($this->query,$params,$orgId,$deptId);
        $groupBy = $as=='edit_teacher'?' GROUP BY uc.classid,uc.groupid':' GROUP BY uc1.classid,uc1.groupid';
        $data = $this->runQuery($this->query,$groupBy,$orgId);
        $postCountData = $this->includePostsIfNecessary($includePosts,$data);
		$classes = $this->prepareClassesResponse($data,$as,$postCountData,$includePosts,$includeUsers);

        if($echo){
            return new JsonResponse(array_values($classes));
        }else{
            return array_values($classes);
        }
    }
    private function prepareWhereAs($as){
        $where = ' ';
        switch($as){
            case 'edit_teacher':
                $where .=  ' and uc.userid=:userId and uc.is_edit_teacher=1';
                break;
            case 'teacher':
                $where .=  ' and uc.userid=:userId and uc.is_teacher=1';
                break;
            case 'student':
                $where .=  ' and uc.userid=:userId and uc.is_student=1';
                break;
            case 'observer':
                $where .=  ' and uc.userid=:userId and uc.is_observer=1';
                break;
            default:
                $where .=  ' and uc.userid=:userId and uc.is_edit_teacher=1';
        }
        $this->where = $where;
        $this->whereOrgId = ' and d.organizationid = :orgId ';
        $this->whereDeptId = ' and d.id = :deptId ';
    }
    private function selectQuery($as){

        $query = $as=='edit_teacher'?self::$queryGetClassesForUser:(
        $this->amIAdmin ?self::$queryGetClassesWithGroupsForAdmin:self::$queryGetClassesWithGroups
		);
        return $query;
    }
    private function extraWheresAndQueryParamms(&$query,$params,$orgId,$deptId){
        if($orgId){
            $query .= $this->whereOrgId;
            $this->queryParams['orgId']=$orgId;
        }
        if($deptId){
            $query .= $this->whereDeptId;
            $this->queryParams['deptId']=$deptId;
        }

        if(boolval($params['includeInactive'])){
            $query = str_replace('user_classes',
                '(SELECT * FROM 
				(SELECT * FROM user_classes union select * from user_classes_history) uc 
				group by userid,classid,groupId)',
                $query);
        }

    }
    private function runQuery($query,$groupBy,$orgId){
        if($this->util->checkAdmin(null,false,false)){


            $query = $query.$this->filterWhere.$groupBy;

            $data = $this->util->fetch($query,$this->queryParams);
        }
        else{
            $me = $this->util->me;
            $myOrg = $orgId?$orgId:$me->user->getOrgId();
            if($me->amIOrgAdmin($myOrg)){

                $queryParams['orgId']=$myOrg;

                $query .= $this->filterWhere.$this->whereOrgId.$groupBy;

                $data = $this->util->fetch($query,$queryParams);
            }
            else{

                $queryParams['userId']=$this->util->me->user->getUserId();
                $query .= $this->filterWhere.$this->where.$groupBy;
                $data = $this->util->fetch($query,$queryParams);
            }
        }
        return $data;
    }
    private function includePostsIfNecessary($includePosts,&$data){
        if(!is_null($includePosts)){
            if($includePosts=='needingGrade'){
                $classIds = array();
                foreach($data as $row){
                    if(array_search($row['id'],$classIds)===false){
                        $classIds[]=$row['id'];
                    }
                }
                $postCountData = PostsController::_countNeedingGradeForClasses($classIds);

            }
        }
        return $postCountData;
    }
    private function prepareClassesResponse($data,$as,$postCountData,$includePosts,$includeUsers){
        $classes = array();
        foreach($data as $row){
            if(!is_null(@$row['groupId'])){
                $row['courseid'] = $row['courseid'].'-'.$row['groupId'];
                $row['name']=$row['name'].' - '.$row['groupName'];
            }
            if(!isset($classes[$row['courseid']])){
                if(isset($postCountData[$row['id']])){
                    if(!isset($postCountData[$row['id']]['groups'])){
                        $row[$includePosts.'Count']=$postCountData[$row['id']]['count'];

                    }
                    else{
                        if (isset($postCountData[$row['id']]['groups'][$row['groupId']])){
                            $group=$postCountData[$row['id']]['groups'][$row['groupId']];
                            $row[$includePosts.'Count']=$group['count'];
                        }
                    }
                }
                $this->includeUsersIfNecessary($row,$as,$includeUsers);
                $classes[$row['courseid']]=$row;

            }
        }
        return $classes;
    }
    private function includeUsersIfNecessary(&$row,$as,$includeUsers){
        if(boolval($includeUsers)){
            $users = $this->classesCtrl->getUsers($row['id']);
            if($as=='student'){
                unset($users['students']);
            }
            $row['users']=$users;
        }
    }
    private function filterSitesIfNecessary($params){
    	if($siteId = @$params['siteId']){
            $this->query.= ' join site_users su on su.user_id = uc1.userid';
            $this->filterWhere.= " and su.site_id = $siteId and uc1.is_student = 1";
		}
	}
    private function filterTeacherIfNecessary($params){
        if($teacherId = @$params['teacherId']){
            $this->query.= ' join user_classes tc on tc.classid = uc1.classid';
            $this->filterWhere.= " and tc.userid = $teacherId and tc.is_teacher = 1";
        }
	}
    private function filterStudentIfNecessary($params){
        if($studentId = @$params['studentId']){
            $this->filterWhere.= " and uc1.userid = $studentId";
        }
	}
    /* QUERY: get list of classes with groups in entire app (WHERE clause can be appended afterwards) */
    private static $queryGetClassesWithGroups = <<<SQL
		SELECT c.*,
		 groups.id as groupId,
		 groups.name as groupName,
		 count(distinct super_units.id) as num_super_units,
		 sum(if(uc1.is_student,1,0)) as studentCount,
		 d.organizationid as orgId
		FROM classes c
		LEFT JOIN groups on groups.classid = c.id
		JOIN courses co on co.id = c.courseid
		JOIN departments d on d.id = co.departmentid
		JOIN user_classes uc ON c.id = uc.classid and (uc.groupid = groups.id or groups.id is null)
		JOIN user_classes uc1 on uc1.classid = uc.classid and (uc1.groupid = groups.id or groups.id is null)
		LEFT JOIN super_units ON super_units.classid = c.id

SQL;
    private static $queryGetClassesWithGroupsForAdmin = <<<SQL
		SELECT c.*,
		 groups.id as groupId,
		 groups.name as groupName,
		 count(distinct super_units.id) as num_super_units,
		 sum(if(uc1.is_student,1,0)) as studentCount,
		 d.organizationid as orgId
		FROM classes c
		LEFT JOIN groups on groups.classid = c.id
		JOIN courses co on co.id = c.courseid
		JOIN departments d on d.id = co.departmentid
		JOIN user_classes uc1 ON c.id = uc1.classid and (uc1.groupid = groups.id or groups.id is null)
		LEFT JOIN super_units ON super_units.classid = c.id

SQL;

    private static $queryGetClassesForUser = <<<SQL
		SELECT c.*,
			count(distinct super_units.id) as num_super_units,
			sum(if(uc.is_student,1,0)) as studentCount,
			d.organizationid as orgId
		FROM classes c
		JOIN courses co on co.id = c.courseid
		JOIN departments d on d.id = co.departmentid
		JOIN user_classes uc ON c.id = uc.classid
		LEFT JOIN super_units ON super_units.classid = c.id
SQL;


}
?>

