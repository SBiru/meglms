<?php

namespace English3\Controller;

use CachedQuery;
use XMLReader;
use SimpleXML;
use ZipArchive;
use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\ImportCourseController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UploadMoodleController{

	private $reader;
	private $util;
	private $me;
	private $config;
	private $classId;
	private $orgId;
	private $lowestScore;

	//category tree (including children actvities). contains the normalized score
	private $aggregationCategories;

	//array (key => id, value => category)
	private $indexedCategories;

	//array (key => id, value => normalized activity)
	private $indexedActivities;

	public function __construct(Connection $reader) {
		global $PATHS;
		$this->reader = $reader;
		$this->util = new Utility($reader);
		$this->config = array(
			'path' => $PATHS->app_path . '/imported',
			'map_file_main' => 'moodle_backup.xml',
			'map_file_ext' => '.mbz'
		);
		$this->lowestScore = null;

	}

	public function read(Request $request) {
		// STEPS:
		// 		1. get file (from upload or url)
		// 		2. unzip / untar
		// 		3. read moodle_backup.xml (main structure file)
		// 		4. generate content tree
		// 		5. generate map tree for files
		// 		6. insert record to DB and return map
		$this->me = UserController::me($this->reader);
		// Check permissions here
		//
		//
		$originalFile = $request->files->get('file');
		Utility::clearPOSTParams($request);
		$isStudentDataUpload = boolval($request->request->get('isStudentData'));
		$classId = $request->request->get('classId');
		$this->classId = $classId;
		$this->orgId = ClassesController::_getOrgId($this->reader,$this->classId);
		if(!$originalFile) {
			throw new HttpException(400, 'No file received. Param name MUST be "file"');
		}
		$originalFileName = $originalFile->getClientOriginalName();
		$targetFilePath = $this->config['path'] . DIRECTORY_SEPARATOR . $originalFileName;
		// to save final map into json file
		$targetFolderName = 'moodle' . time();
		$targetFolderPath = $this->config['path'] . DIRECTORY_SEPARATOR . $targetFolderName;
		if($originalFile) {
			try {
				// move compressed (backup file) to server folder
				$originalFile->move($this->config['path'], $originalFileName);
			} catch(FileException $e) {
				throw new HttpException(500, 'Could not write file to target folder. Error message: ' . $e->getMessage());
			}
			if(!$this->extract($targetFilePath, $targetFolderPath)) {
				throw new HttpException(400, 'Error ocurred while extracting file');
			}

			$map_structure = $this->mapStructure($targetFolderName, $targetFolderPath);

			/*We need the class structure before import student data
			*   We will import the student scores, normalize them, normalize 
			*   the max points for the assignments and quizzes.
			*/
			if($isStudentDataUpload) {
				return $this->importStudentAndNormalizeData($classId, $targetFolderPath,$map_structure);
			}

			$this->mapQuestions($targetFolderPath);
			$this->mapFileStructure($targetFolderPath);

			return new JsonResponse($map_structure);
		} else {
			throw new HttpException(400, 'File upload failed or no file was uploaded');
		}
	}

	private function importStudentAndNormalizeData($classId, $folderPath,$mapStructure) {
		global $PATHS;
		if(!$classId) {
			Utility::rmdirRecursive($folderPath);
			return Utility::buildHTTPError('No classId', 400);
		}

		//get normalized activities
		$result = $this->getNormalizedActivities($folderPath,$mapStructure);
		/*
		if($result){
			return $result;
		}
		*/


		//update existing actvities, setting the new normalized max score
		if($this->aggregationCategories){
			$rootCategory = $this->aggregationCategories[0];
			$this->updateActivityScores($rootCategory);
		}


		//mapping users
		$moodleUsers = $this->mapUsers($folderPath);

		// get default teacher (first found. Moodle has no reference to teacher - needed for feedback posts)
		if(count($moodleUsers['teachers'])==0){
			//if we can't find a teacher in moodle files, we will look for one in our system
			$teacherId = $this->util->fetchOne(
				$this->queryGetDefaultTeacher,
				['classId' => $classId]
			);
		}else{
			$teacher = $moodleUsers['teachers'][0];
			$userInDB = $this->util->fetchRow(
				$this->queryGetUserByEmail,
				[ 'email' => (string)$teacher['email'] ]
			);

			if($userInDB) {
				$teacherId = $userInDB['id'];
				$userClassInfo = $this->util->fetchRow(
					$this->queryGetUserClassInfo,
					['userId' => $userInDB['id'], 'classId' => $classId]
				);
				if(!$userClassInfo) {
					$this->util->insert(
						$this->queryAssignTeacherToClass,
						['userId' => $userInDB['id'], 'classId' => $classId]
					);
				}
			}
			else{
				$teacherId = $this->createUser($teacher);
				$this->util->insert(
					$this->queryAssignTeacherToClass,
					['userId' => $teacherId, 'classId' => $classId]
				);
			}

		}



		if(!$teacherId) {
			Utility::rmdirRecursive($folderPath);
			return Utility::buildHTTPError('This class has no teacher assigned. Cannot continue. Files have been removed', 400);
		}
		$usersInImport = array();
		try {
			// ------ USERS
			// get users in moodle's backup file (into $usersInImport).
			// Will be indexed by original moodle id, and value will have id in our db

			foreach($moodleUsers['students'] as $student) {
				$userId = $student['id'];
				$userInDB = $this->util->fetchRow(
					$this->queryGetUserByEmail,
					[ 'email' => $student['email'] ]
				);
				if(!$userInDB)
				{
					$id = $this->createUser($student);
					$userInDB = $this->util->fetchRow(
						$this->queryGetUserById,
						[ 'id' => $id ]
					);
				}
				if($userInDB) {
					$userClassInfo = $this->util->fetchRow(
						$this->queryGetUserClassInfo,
						['userId' => $userInDB['id'], 'classId' => $classId]
					);
					if(!$userClassInfo) {
						$this->util->insert(
							$this->queryAssignStudentToClass,
							['userId' => $userInDB['id'], 'classId' => $classId]
						);
					}
					$usersInImport[$userId] = [
						'id' => $userInDB['id'],
						'isStudent' => $userClassInfo['is_student'],
						'isTeacher' => $userClassInfo['is_teacher'],
						'isEditTeacher' => $userClassInfo['is_edit_teacher']
					];
				}
			}
			// ------ FILES
			// map files to use indexes later (mapped by itemid, aka section)
			$this->mapFileStructure($folderPath);
			$filesBySection = $folderPath . DIRECTORY_SEPARATOR . 'filesBySection.json';
			$filesBySection = json_decode(file_get_contents($filesBySection), true);
			// ------ ASSIGNMENTS
			// get class' assignments (Each folder in 'activities' whose name begins with 'assign_')
			$dirs = glob($folderPath . '/activities/*' , GLOB_ONLYDIR);
			$ImportCourseController = new ImportCourseController($this->reader);
			$postsByUsers = array();
			foreach ($dirs as $dir) {
				if(strpos($dir,'assign_') !== false) {
					// in assignment folder, now get submissions, feedback, grades, etc
					$XMLReaderAssign = new XMLReader();
					$XMLReaderAssign->open($dir . DIRECTORY_SEPARATOR . 'assign.xml');
					$XMLReaderGrades = new XMLReader();
					// grades xml
					$XMLReaderGrades->open($dir . DIRECTORY_SEPARATOR . 'grades.xml');
					while ($XMLReaderGrades->read() && $XMLReaderGrades->name !== 'grade_grades');
					// assignments xml
					while ($XMLReaderAssign->read() && $XMLReaderAssign->name !== 'activity');
					$externalId = $XMLReaderAssign->getAttribute('moduleid');
					while ($XMLReaderAssign->read() && $XMLReaderAssign->name !== 'submissions');
					// -- SUBMISSIONS
					foreach(simplexml_load_string($XMLReaderAssign->readOuterXML())->children() as $submissionNode) {
						// check if the user has been assigned to this class in our db. Skip if not.
						// also check if file does exist (filesBySection). Skip if not.
						if(array_key_exists((string)$submissionNode->userid, $usersInImport) && array_key_exists((string)$submissionNode->attributes()['id'], $filesBySection)) {
							$userId = $usersInImport[(string)$submissionNode->userid]['id'];


							// if no page exists for the assignment trying to be inserted, skip
							$pageId = $this->util->fetchOne(
								$this->queryGetPageIdFromExternalIdAndClassId,
								['classId' => $classId, 'externalId' => $externalId]
							);
							// also skip if no page in this class has this externalId
							if(!$pageId) {
								continue;
							}

							// check if this record has already been inserted
							$nodeExists = $this->util->fetchOne(
								$this->queryGetPostIdFromExternalId,
								array(
									'userId' => $userId,
									'classId' => $classId,
									'externalId' => (string)$submissionNode->attributes()['id']
								),
								'id'
							);
							if($nodeExists) {
								$postsByUsers[(string)$submissionNode->userid] = array(
									'pageId' => $pageId,
									'postId' => $nodeExists
								);
								continue;
							}


							$file = $filesBySection[(string)$submissionNode->attributes()['id']][0];
							$finalFileName = $file['originalFileName'];
							$smHash = substr(md5(time() . $userId), 10, 5);
							$finalFileName = '/public/useruploads/' . substr_replace($finalFileName, $smHash, strrpos($finalFileName, '.'), 0);
							$post = array(
								'pageId' => $pageId,
								'userId' => $userId,
								'classId' => $classId,
								'upload_url' => $finalFileName,
								'upload_file_name' => $file['originalFileName'],
								'externalId' => (string)$submissionNode->attributes()['id']
							);
							// try to move file to final public folder
							$originalFile = $folderPath . '/files/' . $file['folder'] . DIRECTORY_SEPARATOR . $file['fileName'];
							$targetFile = $PATHS->app_path . $finalFileName;
							// if file could not be moved, skip record (error)

							if(!copy($originalFile, $targetFile)) {
								continue;
							}

							// everything ready, insert post record now
							$postsByUsers[(string)$submissionNode->userid] = array(
								'pageId' => $pageId,
								'postId' => $this->util->insert(
									$this->queryInsertPost,
									$post
								)
							);
						}
					}
					// ------ GRADES
					// assignments hold their grades in grades.xml inside of the same assign_### folder
					foreach(simplexml_load_string($XMLReaderGrades->readOuterXML())->children() as $gradeNode) {
						// check if the assignment was added successfully (has a new post_id)
						if(array_key_exists((string)$gradeNode->userid, $postsByUsers)) {
							if((string)$gradeNode->rawgrade=='$@NULL@$'){
								continue;
							}
							$post = $postsByUsers[(string)$gradeNode->userid];
							$studentId = $usersInImport[(string)$gradeNode->userid]['id'];
							$feedback = $ImportCourseController->parseContentMoodle((string)$gradeNode->feedback, true);
							$postExternalId = (string)$gradeNode->attributes()['id'];
							// if feedback exists, it must be inserted as a teacher post
							$responseId = 0;
							if(!empty($feedback)) {
								$nodeExists = $this->util->fetchOne(
									$this->queryGetPostIdFromExternalId,
									array(
										'userId' => $teacherId,
										'classId' => $classId,
										'externalId' => $postExternalId
									),
									'id'
								);
								if($nodeExists){
									$responseId=$nodeExists;
								}
								else{
									$responseId = $this->util->insert(
										$this->queryInsertTeacherResponse,
										array(
											'pageId' => $post['pageId'],
											'userId' => $teacherId,
											'classId' => $classId,
											'message' => $feedback,
											'replyToId' => $post['postId'],
											'externalId'=> $postExternalId
										)
									);
								}

							}

							// now add grade
							if($this->aggregationCategories){
								$grade = $this->normalizedStudentGrade(floatval((string)$gradeNode->rawgrade),$externalId,floatval((string)$gradeNode->rawgrademax));
							}
							else{
								$grade = floatval((string)$gradeNode->rawgrade);
							}

							$nodeExists = $this->util->fetchOne(
								$this->queryGetGradePostIdFromPostExternalId,
								array(
									'userId' => $teacherId,
									'classId' => $classId,
									'externalId' => $postExternalId
								),
								'id'
							);
							if($nodeExists){
								$this->reader->update(
									'grade_posts',
									['grade'=>$grade],
									['id'=>$nodeExists]
								);
							}else{
								$this->util->insert(
									$this->queryInsertAssignmentGrade,
									array(
										'postId' => $post['postId'],
										'teacherPostId' => $responseId,
										'userId' => $teacherId,
										'grade' => $grade
									)
								);
							}


						}
					}
				}
				else if (strpos($dir,'quiz_') !== false) {
					// in assignment folder, now get submissions, feedback, grades, etc
					$XMLReaderAssign = new XMLReader();
					$XMLReaderAssign->open($dir . DIRECTORY_SEPARATOR . 'quiz.xml');
					while ($XMLReaderAssign->read() && $XMLReaderAssign->name !== 'activity');
					$externalId = $XMLReaderAssign->getAttribute('moduleid');
					$pageId = $this->util->fetchOne(
						$this->queryGetPageIdFromExternalIdAndClassId,
						['externalId' => $externalId, 'classId' => $classId]
					);
					// quiz, for this class, does exist in our database
					if($pageId) {
						// grades xml
						$XMLReaderGrades = new XMLReader();
						$XMLReaderGrades->open($dir . DIRECTORY_SEPARATOR . 'grades.xml');
						while ($XMLReaderGrades->read() && $XMLReaderGrades->name !== 'grade_grades');
						// ------ GRADES FOR QUIZZES
						foreach(simplexml_load_string($XMLReaderGrades->readOuterXML())->children() as $gradeNode) {
							$nodeId = (string)$gradeNode->attributes()['id'];
							// check if the assignment was added successfully (has a new post_id)
							if(array_key_exists((string)$gradeNode->userid, $usersInImport)) {
								$user = $usersInImport[(string)$gradeNode->userid];

								if((string)$gradeNode->rawgrade=='$@NULL@$'){
									continue;
								}

								// user exists ($user). Add grade

								if($this->aggregationCategories){
									$activity = $this->indexedActivities[$externalId];
									$grade = $this->normalizedStudentGrade(floatval((string)$gradeNode->rawgrade),$externalId,floatval((string)$gradeNode->rawgrademax));
									$maxPoints = $activity['calculated_grade'];
								}
								else{
									$grade = floatval((string)$gradeNode->rawgrade);
									$maxPoints = floatval((string)$gradeNode->grademax);
								}


								// check if this record has already been inserted
								$nodeExists = $this->util->fetchOne(
									$this->queryGetQuizScoreFromExternalId,
									array(
										'userId' => $user['id'],
										'quizId' => $pageId,
										'classId' => $classId,
										'externalId' => $nodeId
									)
								);
								$pageInfo = PageController::_get($this->util->reader,$pageId);
								$unitId = $pageInfo['unit']['id'];
								CachedQuery::updateAssingmentAndQuizzes($classId,$unitId,$user['id']);
								if($nodeExists) {
									$this->reader->update(
										'quiz_scores',
										array('score' => $grade,
											'max_points'=>$maxPoints,
											'is_finished'=>1,
										),
										array(
											'user_id' => $user['id'],
											'quiz_id' => $pageId,
											'class_id' => $classId,
											'external_id' => $nodeId
										)
									);
								}
								else{
									$this->util->insert(
										$this->queryInsertQuizScore,
										array(
											'userId' => $user['id'],
											'quizId' => $pageId,
											'score' => $grade,
											'max_points'=>$maxPoints,
											'is_finished'=>1,
											'classId' => $classId,
											'externalId' => $nodeId
										)
									);
								}

							}
						}
					}
				}
			}
		} catch(Exception $e) {
			Utility::rmdirRecursive($folderPath);
			return Utility::buildHTTPError('Error ocurred while reading xml files', 400);
		}
		Utility::rmdirRecursive($folderPath);
		return new JsonResponse('done');
	}

	/* Extracts contents of file in $filePath into $folderPath
	 *
	 */
	private function extract($filePath, $folderPath, $removeOriginal = true) {
		$zip = new ZipArchive;
		if ($zip->open($filePath) === TRUE) {
			// create directory to extract files
			if(!mkdir($folderPath, 0755)) {
				throw new HttpException(400, 'Could not create directory to extract backup files. Make sure target folder does not exist');
			}
			$zip->extractTo($folderPath);
			$zip->close();
			if($removeOriginal) {
				unlink($filePath);
			}
			return true;
		} else {
			return false;
		}
	}

	/* Gets initial structure of sections and activites from map file in root folder
	 * in decompressed backup file. Also throws error if structure is incorrect or
	 * file is not found.
	 * Function assumes backup file has been decompresed into passed $folderPath
	 * STEPS:
	 * 	1. get general info
	 * 	2. get activities as array
	 * 	3. get sections as array
	 * 	4. get lessons per section
	 */
	private function mapStructure($folderName, $folderPath) {
		$result = array();
		$result['mapFileName'] = $folderName . '.json';
		$result['folderName'] = $folderName;
		$result['originalType'] = 'moodle';
		$map_file = $folderPath . DIRECTORY_SEPARATOR . $this->config['map_file_main'];
		// folder does not contain map_file (backup structure)
		if(!file_exists($map_file)) {
			throw new HttpException(400, 'Could not find map file (' . $this->config['map_file_main'] . ') in backup file');
		}
		// Error at any point means problem with file structure
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($map_file);
			$XMLReader->read();

			// getting course id and name
			while ($XMLReader->read() && $XMLReader->name !== 'original_course_id');
			$result['originalId'] = intval($XMLReader->readString());
			while ($XMLReader->read() && $XMLReader->name !== 'original_course_fullname');
			$result['courseName'] = $XMLReader->readString();

			// moodle's backup files contain two main sections we will be using: details | contents
			// DETAILS
			while ($XMLReader->read() && $XMLReader->name !== 'details');
			$details = simplexml_load_string($XMLReader->readInnerXML());
			$result['type'] = (string)$details->type;
			// type MUST be course (we will import only courses and allow users to later select individual pages)
			if($result['type'] != 'course') {
				throw new HttpException(400, 'Wrong backup file type. Expected: course. Current: ' . $result['type']);
			}

			// CONTENTS
			//	Children to be used: activities | sections
			//		ACTIVITIES
			while ($XMLReader->read() && $XMLReader->name !== 'activities');
			$activities = $this->getActivitiesXMLAsArray($XMLReader->readOuterXML());

			//		SECTIONS
			while ($XMLReader->read() && $XMLReader->name !== 'sections');
			$result['units'] = $this->mapSections($XMLReader->readOuterXML(), $activities, $folderPath);
		} catch(Exception $e) {
			throw new HttpException(400, 'Wrong file structure');
		}
		// insert record in database
		$success = $this->util->insert(
			$this->queryInsertImportsRecord,
			array(
				':type' => 'moodle',
				':userId' => $this->me->user->getUserId(),
				':mapFileName' => $result['mapFileName'],
				':folderName' => $folderName,
				':courseName' => $result['courseName']
			)
		);
		// save json map file

		$result = $this->cleanUpStructure($result);
		$targetFile = fopen($this->config['path'] . DIRECTORY_SEPARATOR . $result['mapFileName'], 'w');
		fwrite($targetFile, json_encode($result));
		fclose($targetFile);
		return $result;
	}

	/* Generates a map tree for grades
	 * We need to change the original points for each assignment in order to apply
	 *   moodle's weighting system.
	 * We are looking for categories and gradeable activities
	 * Categories are groups of activities or another categories that use a particular
	 *  aggregation method
	 */
	private function getNormalizedActivities($folderPath,$data){
		//build categories
		$result = $this->mapAggregationCategories($folderPath);

//		if($result){
//			return $result;
//		}

		if(!$this->aggregationCategories){
			return null;
		}

		$this->mapAllGradeInfo($data);


		/* This function create a calculated_grade for all assignments
		 * The calculated_grade is represented until now as a percentage of the course mas score
		 */
		$this->normalize_values($this->aggregationCategories[0]);

		/*
		 * Now we have to "beautify" the scores.
		 * He will get the lowest score ($this->lowestScore) and get the pow we need to use to make it bigger than 10
		 * In other words, $this->lowsetScore*10^$pow>10
		 * we will apply $pow to all assignments and the floor the score
		 */
		if(count($this->indexedCategories)>1){
			$pow=$this->get_ten($this->lowestScore,10);
			$scale = pow(10,$pow);
		}
		else{
			$scale = $this->aggregationCategories[0]['totalPoints'];
		}


		foreach($this->indexedActivities as &$activity){
			$activity['calculated_grade']=floor($activity['calculated_grade']*$scale);
		}
	}
	private function get_ten($num,$target,$pow=0){
		if(floor($num)>=$target){
			return $pow;
		}
		$pow++;
		return $this->get_ten($num*10,$target,$pow);
	}

	private function normalizeQuizScore($quizId,$grade_item){
		$questions = $this->util->fetch(QuizController::$queryGetQuizQuestions,['quizId'=>$quizId]);
		$sum = 0;
		foreach($questions as $question){
			if(!is_null($question['specificPoints']) && floatval($question['specificPoints'])>0){
				$points = floatval($question['specificPoints']);
			}else if(!is_null($question['max_points'])){
				$points = floatval($question['max_points']);
			}else{
				$points = 1;
			}

			if($question['random']){
				$sum += floatval($points) * intval($question['random']);
			}else{
				$sum += floatval($points);
			}
		}

		foreach($questions as $question){
			if(!is_null($question['specificPoints']) && floatval($question['specificPoints'])>0){
				$points = floatval($question['specificPoints']);
			}else if(!is_null($question['max_points'])){
				$points = floatval($question['max_points']);
			}else{
				$points = 1;
			}
			if($question['random']){
				$newPoints = (floatval($points)/$sum) * floatval($grade_item['calculated_grade']);
			}
			else{
				$newPoints = (floatval($points)/$sum) * floatval($grade_item['calculated_grade']);

			}
			$this->reader->update(
				'quiz_questions',
				['points'=>$newPoints],
				['id'=>$question['quizQuestionId']]
			);
		}
	}


	private function updateActivityScores($category){
		foreach($category['grade_items'] as $grade_item){
			if($grade_item['type']=='category'){
				$this->updateActivityScores($grade_item);
			}else{
				$externalId = $grade_item['id'];
				$pageId = $this->util->fetchOne(
					$this->queryGetPageIdFromExternalIdAndClassId,
					['externalId' => $externalId, 'classId' => $this->classId]
				);
				// activity, for this class, does exist in our database and we
				// have calculated the normalized score
				if($pageId && isset($grade_item['calculated_grade'])) {
					if($grade_item['type']=='quiz'){
						$quizId = QuizController::_getQuizFromPageId($pageId);
						if($quizId){
							$this->normalizeQuizScore($quizId,$grade_item);
						}
					}
					else{
						$this->reader->update(
							'class_assignments',
							['points'=>$grade_item['calculated_grade']],
							['page_id'=>$pageId,'class_id'=>$this->classId]);
					}
				}

			}
		}
	}

	/*
	 * Mapping categories tree
	 *  - aggregation (integer) tells the method of agregation
	 *  - aggregationcoef and grademax will also be used well normalizing scores
	 */
	private function mapAggregationCategories($folderPath) {
		$categories = array();
		$indexedCategories = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($folderPath . DIRECTORY_SEPARATOR . 'gradebook.xml');
			while ($XMLReader->read() && $XMLReader->name !== 'grade_categories');
			$categoriesXML = simplexml_load_string($XMLReader->readOuterXML());
			if(!$categoriesXML){
				return;
			}
			foreach($categoriesXML->children() as $categoryNode) {
				$attributes = $categoryNode->attributes();
				$categoryId = (string)$attributes['id'];
				$parentId =  (string)$categoryNode->parent=="$@NULL@$"?null:(string)$categoryNode->parent;
				$category = array(
					'id'=>$categoryId,
					'name' => (string)$categoryNode->fullname,
					'parentId' => $parentId,
					'aggregation'=>(integer)$categoryNode->aggregation,
					'type'=>'category',
					'grade_items' => array()
				);
				$indexedCategories[$categoryId]=$category;

				if(!$parentId){
					$categories[]=&$indexedCategories[$categoryId];

				}else{
					$parentCategory = &$indexedCategories[$parentId];
					$parentCategory['grade_items'][]=&$indexedCategories[$categoryId];
				}
			}
			while ($XMLReader->read() && $XMLReader->name !== 'grade_items');
			$gradeItemsXML = simplexml_load_string($XMLReader->readOuterXML());
			foreach($gradeItemsXML->children() as $gradeItemNode) {
				$categoryId=null;
				$itemType = (string)$gradeItemNode->itemtype;
				if($itemType=="course" || $itemType=="category"){
					$categoryId =	(string)$gradeItemNode->iteminstance;
				}
				else{
					continue;
				}

				$category = &$indexedCategories[$categoryId];
				$category['grademax']=(double)$gradeItemNode->grademax;
				$category['aggregationcoef']=(double)$gradeItemNode->aggregationcoef;
			}
		} catch(Exception $e) {
			throw new HttpException(400, 'Error ocurred while reading gradebook.xml');
		}
		$this->aggregationCategories = $categories;
		$this->aggregationCategories[0]['grademax']= 1000;
		$this->indexedCategories = $indexedCategories;
	}

	/*
	 * Going through all activities getting
	 * 	-categoryid
	 *  -aggregationcoef
	 *  -grademax
	 */
	private function mapAllGradeInfo($data){
		foreach ($data['units'] as $unit) {
			foreach ($unit['pageGroups'] as $pageGroup) {
				switch ($pageGroup['type']) {

					case 'assign':
					case 'journal':
					case 'page':
					case 'quiz':
						$activityFolder = $this->config['path']
							. DIRECTORY_SEPARATOR
							. $data['folderName']
							. DIRECTORY_SEPARATOR
							. 'activities'
							. DIRECTORY_SEPARATOR
							. $pageGroup['type'] . '_' . $pageGroup['id'];

						//getting grade info for later aggregation
						$this->getGradeInfo($activityFolder,$pageGroup['id']);
						break;
					default:
						continue 2;
				}
			}
		}
	}
	/*
	 * Normalizing values according to the category aggregation type
	 * This function is used recursively since the categories may be nested
	 */
	private function normalize_values(&$grade_item){
		$grade_items = &$grade_item['grade_items'];
		$parentCoef = isset($grade_item['calculated_grade'])?$grade_item['calculated_grade']:1;
		switch ($grade_item['aggregation']) {
			case 10: // Weighted average of all existing final grades, weight specified in coef
				$weightsum = 0;
				foreach ($grade_items as $item) {
					if ($item['aggregationcoef'] <= 0) {
						continue;
					}
					$weightsum += $item['aggregationcoef'];
				}
				if ($weightsum == 0) {
					return;
				} else {

					foreach ($grade_items as &$item) {
						$item['calculated_grade']=($item['aggregationcoef']/$weightsum)*$parentCoef;
						$this->lowestScore= ($this->lowestScore==null || $item['calculated_grade'] < $this->lowestScore)?$item['calculated_grade']:$this->lowestScore;
						if(isset($item['aggregation'])){
							$this->normalize_values($item);
						}
					}
				}
				break;
			case 11:
				// Weighted average of all existing final grades with optional extra credit flag,
				// weight is the range of grade (usually grademax)
				$weightsum = 0;
				$sum       = null;
				foreach ($grade_items as $item) {
					$weight = $item['grademax'];
					if ($weight <= 0) {
						continue;
					}
					if ($item['aggregationcoef'] == 0) {
						$weightsum += $weight;
					}
					$sum += $weight;
				}


				foreach ($grade_items as &$item) {

					if ($item['aggregationcoef'] == 0) {
						$coef = $item['grademax'] / $sum;

					}
					else{
						$coef = $item['grademax'] / $weightsum;
					}
					$item['calculated_grade'] = $parentCoef * $coef;
					$this->lowestScore= ($this->lowestScore==null || $item['calculated_grade'] < $this->lowestScore)?$item['calculated_grade']:$this->lowestScore;
					if(isset($item['aggregation'])){
						$this->normalize_values($item);
					}
				}
				break;
			case 12: // special average
			case 0:    // Arithmetic average of all grade items (if ungraded aggregated, NULL counted as minimum)
			default:
				$sum  = null;
				foreach ($grade_items as $item) {
					$weight = $item['grademax'];
					$sum += $weight;
				}


				foreach ($grade_items as &$item) {
					$coef = $item['grademax'] / $sum;
					$item['calculated_grade']= $parentCoef * $coef;
					$this->lowestScore= ($this->lowestScore==null || $item['calculated_grade'] < $this->lowestScore)?$item['calculated_grade']:$this->lowestScore;
					if(isset($item['aggregation'])){
						$this->normalize_values($item);
					}
				}
				break;
		}
	}
	/*
	 * Get grademax, parent category and aggregationcoef for all activities
	 */
	private function getGradeInfo($activityFolder,$id){
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($activityFolder . DIRECTORY_SEPARATOR . 'grades.xml');
			while ($XMLReader->read() && $XMLReader->name !== 'grade_items');
			$gradeItemsXML = simplexml_load_string($XMLReader->readOuterXML());
			foreach($gradeItemsXML->children() as $gradeItemNode) {
				$categoryId = (string)$gradeItemNode->categoryid;
				$gradeItem = array(
					'id'=>$id,
					'name'=>(string)$gradeItemNode->itemname,
					'type'=>(string)$gradeItemNode->itemmodule,
					'grademax'=>(double)$gradeItemNode->grademax,
					'aggregationcoef'=>(double)$gradeItemNode->aggregationcoef,
				);
				$category = &$this->indexedCategories[$categoryId];
				$category['totalPoints']=floatval($category['totalPoints'])+(double)$gradeItemNode->grademax;
				$this->indexedActivities[$id]=$gradeItem;
				$category['grade_items'][]=&$this->indexedActivities[$id];
			}
		} catch(Exception $e) {
			throw new HttpException(400, 'Error ocurred while reading grades.xml. Activity id:'. $id);
		}
	}
	private function normalizedStudentGrade($rawgrade,$activityId,$grademax=null){

		$activity = &$this->indexedActivities[$activityId];
		if(!$grademax){
			$grademax = floatval($activity['grademax']);
		}
		$coef = floatval($activity['calculated_grade'])/$grademax;
		return floatval($rawgrade)*$coef;
	}

	/* Any additional changes to final response
	 */
	private function cleanUpStructure($structure) {
		// Remove all 'empty' units (empty defined as having no pagegroups)
		$units = array();
		foreach ($structure['units'] as $unit) {
			if(count($unit['pageGroups']) > 0) {
				$units[] = $unit;
			}
		}
		$structure['units'] = $units;
		return $structure;
	}

	/* Generates a map tree for files to be included in content pages. Original moodle's tree
	 * is inefficient when importing entire course.
	 *
	 * - files.json: structure as original (file by file in array, no id)
	 * - filesBySection.json: keeps files indexed by sectionid
	 * - filesByContext.json: keeps files indexed by contextid
	 */
	private function mapFileStructure($folderPath, $return) {
		$files = array();
		$filesBySection = array();
		$filesByContext = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($folderPath . DIRECTORY_SEPARATOR . 'files.xml');
			while ($XMLReader->read() && $XMLReader->name !== 'files');
			$filesXML = simplexml_load_string($XMLReader->readOuterXML());
			foreach($filesXML->children() as $fileNode) {
				// some files have '.' as the original name. I simply had to skip them since they
				// don't seem to have a reason to be transferred
				if((string)$fileNode->filename == ".") {
					continue;
				}
				// build array for individual file
				$originalFilePath = substr((string)$fileNode->filepath, 0, -1);
				$file = array(
					'folder' => substr((string)$fileNode->contenthash, 0, 2),
					'fileName' => (string)$fileNode->contenthash,
					'originalFileName' => (string)$fileNode->filename,
					'originalFilePath' => (empty($originalFilePath)? null : $originalFilePath),
					'mimeType' => (string)$fileNode->mimetype
				);
				if($file['mimeType'] == "$@NULL@$") {
					$file['mimeType'] = null;
				}
				// add to non-mapped array (original list)
				$files[] = $file;

				// add to array, mapped by moduleId (as string)
				$moduleId = (string)$fileNode->itemid;
				if(!array_key_exists($moduleId, $filesBySection)) {
					$filesBySection[$moduleId] = array();
				}
				$filesBySection[$moduleId][] = $file;

				// add to array, mapped by contextid (as string)
				$contextId = (string)$fileNode->contextid;
				if(!array_key_exists($contextId, $filesByContext)) {
					$filesByContext[$contextId] = array();
				}
				$filesByContext[$contextId][] = $file;
			}
			// save json map files
			$targetFile = fopen($folderPath . DIRECTORY_SEPARATOR . 'files.json', 'w');
			$targetFileBySection = fopen($folderPath . DIRECTORY_SEPARATOR . 'filesBySection.json', 'w');
			$targetFileByContext = fopen($folderPath . DIRECTORY_SEPARATOR . 'filesByContext.json', 'w');
			fwrite($targetFile, json_encode($files));
			fwrite($targetFileBySection, json_encode($filesBySection));
			fwrite($targetFileByContext, json_encode($filesByContext));
			fclose($targetFile);
			fclose($targetFileBySection);
			fclose($targetFileByContext);
		} catch(Exception $e) {
			throw new HttpException(400, 'Error ocurred while reading files.xml');
		}
	}

	/* Generates a map tree for questions
	 *
	 */
	private function mapQuestions($folderPath) {
		$questions = array();
		$this->partQuestions = array();
		$this->partQuestionsIds = array();
		$randomQuestions = array(); // array of categoryIds
		$categories = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($folderPath . DIRECTORY_SEPARATOR . 'questions.xml');
			while ($XMLReader->read() && $XMLReader->name !== 'question_categories');
			$categoriesXML = simplexml_load_string($XMLReader->readOuterXML());
			// loop through each category
			foreach($categoriesXML->children() as $categoryNode) {
				// 'random' questions are weird on moodle. They are inside of the same category that
				// contains the list of questions from which a random one is selected. So, we have to keep
				// track of which questions are inside of each category, but excluding 'random' qtypes
				// to avoid infinitely looping between random question and its category
				$attributes = $categoryNode->attributes();
				$categoryId = (string)$attributes['id'];
				$category = array(
					'name' => (string)$categoryNode->name,
					'parentId' => (string)$categoryNode->parent,
					'questions' => array()
				);
				// build array for each question in category
				foreach($categoryNode->questions->children() as $question) {
					$attributes = $question->attributes();
					$id = (string)$attributes['id'];
					if(in_array($id, $this->partQuestionsIds)) {
						$this->partQuestions[$id] = (string)$question->questiontext;
						continue;
					}
					$question = $this->parseMoodleQuestionSXML($question, $categoryId);
					if(!$question) {
						continue;
					}
					// $question is now an array
					$questions[$question['moodleId']] = $question;
					if($question['type'] != 'random') {
						$category['questions'][] = $question['moodleId'];
					} else {
						// add to list of random questions
						$randomQuestions[$question['moodleId']] = $question;
					}
				}
				// add category
				$categories[$categoryId] = $category;
			}
			// now that all questions are ready, replace id's in 'multianswer' sequence with actual questions.
			// These are 'cloze' questions, so the format is very specific
			$questions = $this->replaceClozeQuestionsSequence($questions);
			// save json map files
			$targetFile = fopen($folderPath . DIRECTORY_SEPARATOR . 'questions.json', 'w');
			fwrite($targetFile, json_encode($questions));
			fclose($targetFile);
			$targetFile = fopen($folderPath . DIRECTORY_SEPARATOR . 'questionsByCategory.json', 'w');
			fwrite($targetFile, json_encode($categories));
			fclose($targetFile);
			$targetFile = fopen($folderPath . DIRECTORY_SEPARATOR . 'randomQuestions.json', 'w');
			fwrite($targetFile, json_encode($randomQuestions));
			fclose($targetFile);
		} catch(Exception $e) {
			throw new HttpException(400, 'Error ocurred while reading questions.xml');
		}
	}

	/* Parses a question from SimpleXMLElement to array form according to its type
	 *
	 */
	private function parseMoodleQuestionSXML($questionSXML, $categoryId) {
		$attributes = $questionSXML->attributes();
		$prompt = (string)$questionSXML->questiontext;
		$prompt = substr($prompt, 0, strlen($prompt));
		$question = array(
			'moodleId' => (string)$attributes['id'], // original id. Used in moodle's page
			'type' => (string)$questionSXML->qtype, // will be modified later (switch)
			'categoryId' => $categoryId, // needed to find question again
			'prompt' => $prompt // content is not parsed here
		);
		switch ((string)$questionSXML->qtype) {
			case 'multichoice':
				// adds 'single' (boolean) and 'answers' (array)
				$this->completeMoodleMultichoiceQuestion($question, $questionSXML);
				break;
			case 'truefalse':
				$this->completeMoodleTruefalseQuestion($question, $questionSXML);
				break;
			case 'essay':
				$this->completeMoodleEssayQuestion($question, $questionSXML);
				break;
			case 'match':
				$this->completeMoodleMatchQuestion($question, $questionSXML);
				break;
			case 'shortanswer':
				$this->completeMoodleShortanswerQuestion($question, $questionSXML);
				break;
			case 'shortanswer':
				$this->completeMoodleShortanswerQuestion($question, $questionSXML);
				break;
			case 'multianswer':
				$this->completeMoodleMultianswerQuestion($question, $questionSXML);
				break;
			case 'random':
				unset($question['prompt']);
				unset($question['content']);
				break;
			case 'description':
				break;
			default:
				return false;
				break;
		}
		return $question;
	}

	private function replaceClozeQuestionsSequence($questions) {
		$result = array();
		foreach ($questions as $id => $question) {
			if($question['type'] === 'multipart') {
				// get the id's
				$sequence = $question['sequence'];
				// obtain references
				$references = array();
				preg_match_all('/(\\{\\#\\d+\\})+/', $question['prompt'], $references);
				$replacement = array(
					'from' => array("\n"),
					'to' => array("")
				);
				// prepare from and to arrays to replace references
				foreach ($references[0] as $value) {
					$replacement['from'][] = $value;
					$index = intval(substr($value, 2, -1)) - 1; // e.g. from {#1} to 0, etc
					// if the subquestion is missing, skip this entire cloze question as well
					if(!array_key_exists(trim($sequence[$index]), $this->partQuestions)) {
						continue 2;
					}
					$replacement['to'][] = str_replace("\n", "", '__' . $this->partQuestions[trim($sequence[$index])] . '__');
				}
				// replace them
				$question['prompt'] = str_replace($replacement['from'], $replacement['to'], $question['prompt']);
			}
			$result[$id] = $question;
		}
		return $result;
	}

	private function completeMoodleMultichoiceQuestion(&$questionArray, $questionSXML) {
		// mutiple right answers VS only one
		$questionArray['type'] =
			((string)$questionSXML->plugin_qtype_multichoice_question->multichoice->single)?
				'single'
				:
				'multiple';
		// get answers (choices)
		$answers = array();
		foreach($questionSXML->plugin_qtype_multichoice_question->answers->children() as $answer) {
			$answers[] = array(
				'text' => (string)$answer->answertext,
				'isCorrect' => ((float)$answer->fraction > 0)? true : false
			);
		}
		$questionArray['answers'] = $answers;
	}

	private function completeMoodleTruefalseQuestion(&$questionArray, $questionSXML) {
		foreach($questionSXML->plugin_qtype_truefalse_question->answers->children() as $answer) {
			if((float)$answer->fraction > 0.0) {
				$questionArray['correct'] = filter_var((string)$answer->answertext, FILTER_VALIDATE_BOOLEAN);
			}
		}
	}

	private function completeMoodleEssayQuestion(&$questionArray, $questionSXML) {
		$questionArray['responseformat'] =
			(string)$questionSXML->plugin_qtype_essay_question->essay->responseformat;
		$questionArray['responsefieldlines'] =
			intval((string)$questionSXML->plugin_qtype_essay_question->essay->responsefieldlines);
	}

	private function completeMoodleMatchQuestion(&$questionArray, $questionSXML) {
		$questionArray['type'] = 'wordmatching';
		$questionArray['matches'] = array();
		foreach($questionSXML->plugin_qtype_match_question->matches->children() as $match) {
			if(!empty((string)$match->questiontext) && !empty((string)$match->answertext)) {
				$questionArray['matches'][] = array(
					'question' => (string)$match->questiontext,
					'correct' => (string)$match->answertext,
					'wrong' => null
				);
			}
		}
	}

	private function completeMoodleShortanswerQuestion(&$questionArray, $questionSXML) {
		$questionArray['type'] = 'oneword';
		// can be 1 or more right (not strictly defined, user typed instead)
		$questionArray['answers'] = array();
		foreach($questionSXML->plugin_qtype_shortanswer_question->answers->children() as $answer) {
			if((float)$answer->fraction > 0) {
				$questionArray['answers'][] = (string)$answer->answertext;
			}
		}
	}

	private function completeMoodleMultianswerQuestion(&$questionArray, $questionSXML) {
		// we might stick to this name, or it might be temporary (either way, import happens later)
		$questionArray['type'] = 'multipart';
		// sequence is a comma-separated series of id's (number) in a string
		// We will have to wait until all questions are ready to replace the id's with the actual questions
		$questionArray['sequence'] = array();
		$sequence = explode(',', (string)$questionSXML->plugin_qtype_multianswer_question->multianswer->sequence);
		foreach ($sequence as $value) {
			$this->partQuestionsIds[] = trim($value);
			$questionArray['sequence'][] = trim($value);
		}
	}

	/* Takes XML block between and including <activities></activities>
	 * Returns array of activities id'd with moduleId (see XML for reference)
	 *
	 * @var string
	 */
	private function getActivitiesXMLAsArray($XML) {
		$activitiesXML = simplexml_load_string($XML);
		$activities = array();
		foreach($activitiesXML->children() as $activity) {
			$activities[trim((string)($activity->moduleid))] = array(
				'moduleName' => (string)$activity->modulename,
				'sectionId' => (int)$activity->sectionid,
				'title' => (string)$activity->title,
				'directory' => (string)$activity->directory
			);
		}
		return $activities;
	}

	/* Takes XML block between and including <sections></sections>
	 * Returns mapped sections as array
	 *
	 * @var $XML string
	 * @var $activities array: all activities in array format (id'd with moduleId)
	 * @var $folderPath string: path to extracted folder
	 */
	private function mapSections($XML, $activities, $folderPath) {
		$sectionsXML = simplexml_load_string($XML);
		$sections = array();
		foreach($sectionsXML->children() as $section) {
			$id = (int)$section->sectionid;
			$directory = (string)$section->directory;
			$finalSection = array();
			// content and lessons for section are located in a separate file
			// inside folder at $directory
			try {
				$XMLReader = new XMLReader();
				$XMLReader->open($folderPath . DIRECTORY_SEPARATOR . $directory . DIRECTORY_SEPARATOR . 'section.xml');
				$XMLReader->read();
				$finalSection['id'] = $id;
				// getting section number
				while ($XMLReader->read() && $XMLReader->name !== 'number');
				$finalSection['number'] = intval($XMLReader->readString());
				// getting section name
				while ($XMLReader->read() && $XMLReader->name !== 'name');
				$name = $XMLReader->readString();
				// $@NULL@$ is used in moodle for empty nodes (as string)
				$finalSection['name'] = ($name != "$@NULL@$" && !empty(trim($name)))? $name : null;
				// getting inner content of section
				while ($XMLReader->read() && $XMLReader->name !== 'sequence');
				$sequence = $XMLReader->readString();
				$finalSection['pageGroups'] = (empty($sequence))?
					array()
					:
					$this->mapSectionSequence(
						explode(',', $sequence),
						$activities,
						$folderPath
					);
			} catch(Exception $e) {
				throw new HttpException(400, 'Structure error found while reading sections');
			}
			$sections[] = $finalSection;
		}
		return $sections;
	}

	/* Takes sequence of id's representing inner content of section
	 * (see 'sequence' node in section.xml)
	 * Returns mapped items in sequence array as array
	 *
	 * $activities array's id is moduleId ($sequence is a list of moduleId's as strings)
	 *
	 * @var $sequence array
	 * @var $activities array
	 * @var $folderPath string: path to extracted folder
	 */
	private function mapSectionSequence($sequence, $activities, $folderPath) {
		$pageGroups = array();
		foreach($sequence as $activityId) {
			$activityId = trim((string)$activityId);
			if (!array_key_exists($activityId, $activities)) {
				continue;
			}
			$activity = $activities[$activityId];
			$pageGroup = array(
				'id' => (int)$activityId,
				'type' => $activity['moduleName'], // our alias for moduleName
				'sectionId' => $activity['sectionId'],
				'title' => $activity['title'],
				'directory' => $activity['directory'],
			);
			$contentFile = $folderPath
				. DIRECTORY_SEPARATOR
				. $pageGroup['directory']
				. DIRECTORY_SEPARATOR
				. $pageGroup['type']
				. '.xml';
			// We will not be using all the possible types of 'modules' retrieved from moodle.
			// Unused modules can simply be skipped
			// Each individual mapping function has been isolated to avoid messy code:
			$skipEntry = true;
			switch($pageGroup['type']) {
				case "assign":
				case "page":
				case "url":
				case "journal":
					$skipEntry = false;
					break;
				case "lesson":
					$pageGroup['pages'] = $this->mapLessonModule($contentFile);
					$skipEntry = false;
					break;
				case "book":
					$chapters = $this->mapBookModule($contentFile);
					if(count($chapters) > 0) {
						$pageGroup['chapters'] = $chapters;
						$skipEntry = false;
					}
					break;
				case "resource":
					$resource = $this->mapResourceModule($contentFile);
					$pageGroup['contextId'] = $resource['contextId'];
					$pageGroup['displayOptions'] = $resource['displayOptions'];
					$skipEntry = false;
					break;
				case "folder":
					$folder = $this->mapFolderModule($contentFile);
					$pageGroup['contextId'] = $folder['contextId'];;
					$skipEntry = false;
					break;
				case "quiz":
					$pageGroup['questions'] = $this->mapQuizModule($contentFile);
					$skipEntry = false;
					break;
				case "forum":
					break;
				case "game":
					break;
				case "glossary":
					break;
			}
			if(!$skipEntry) {
				$pageGroups[] = $pageGroup;
			}
		}
		return $pageGroups;
	}

	private function mapLessonModule($file) {
		$pages = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($file);
			while ($XMLReader->read() && $XMLReader->name !== 'pages');
			$pagesXML = simplexml_load_string($XMLReader->readOuterXML());
			// loop through pages
			foreach($pagesXML->children() as $page) {
				$attr = $page->attributes();
				$pages[] = array(
					'id' => (int)$attr['id'],
					'title' => (string)$page->title,
					'prev' => (!(int)$page->prevpageid) ? null : (int)$page->prevpageid,
					'next' => (!(int)$page->nextpageid) ? null : (int)$page->nextpageid
				);
			}
		} catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping module of type Lesson');
		}
		return $pages;
	}

	private function mapBookModule($file) {
		$chapters = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($file);
			while ($XMLReader->read() && $XMLReader->name !== 'chapters');
			$chaptersXML = simplexml_load_string($XMLReader->readOuterXML());
			foreach($chaptersXML->children() as $chapter) {
				$attr = $chapter->attributes();
				$chapters[] = array(
					'id' => (int)$attr['id'],
					'title' => (string)$chapter->title,
					'pageNumber' => (int)$chapter->pagenum
				);
			}
		} catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping module of type Book');
		}
		return $chapters;
	}
	private function createUser($user){

		$params=array(
			'fname'=>$user['firstname'],
			'lname'=>$user['lastname'],
			'email'=>$user['email'],
			'password'=>$user['idnumber'].'00',
			'external_id'=>$user['idnumber'],
			'preferred_language'=>'en',
			'organizationid'=>$this->orgId
		);
		return UserController::_createUser($params);
	}
	private function mapUsers($folderPath){
		$usersFile = $folderPath  . DIRECTORY_SEPARATOR . 'users.xml';
		$rolesFile = $folderPath  . DIRECTORY_SEPARATOR .  'course/roles.xml';
		$allUsers = array();

		//getting all user information
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($usersFile);
			while ($XMLReader->read() && $XMLReader->name !== 'users');
			$usersXML = simplexml_load_string($XMLReader->readOuterXML());
			foreach($usersXML->children() as $user) {
				$attr = $user->attributes();
				$allUsers[(int)$attr['id']]=array(
					'email'=>(string)$user->email,
					'firstname'=>(string)$user->firstname,
					'lastname'=>(string)$user->lastname,
					'idnumber'=>(string)$user->idnumber,
					'id'=>(int)$attr['id'],
				);
			}

		}catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping users.xml');
		}
		$classUsers=array(
			'teachers'=>array(),
			'students'=>array(),
		);
		//getting users roles

		try{
			/*
			 * ROLES
			 * "16","coach"
				"2","coursecreator"
				"19","courseviewer"
				"3","editingteacher"
				"8","frontpage"
				"6","guest"
				"15","guestcopy"
				"1","manager"
				"10","masterteacher"
				"9","mentor"
				"17","mnetuser"
				"5","student"
				"11","student_no_portfolio"
				"4","teacher"
				"7","user"
			 */
			$XMLReader = new XMLReader();
			$XMLReader->open($rolesFile);
			while ($XMLReader->read() && $XMLReader->name !== 'role_assignments');
			$usersXML = simplexml_load_string($XMLReader->readOuterXML());
			foreach($usersXML->children() as $assign) {
				$userId = (string)$assign->userid;
				$user = $allUsers[$userId];
				if((string)$assign->roleid==5){
					$classUsers['students'][]=$user;
				}else if((string)$assign->roleid==10 || (string)$assign->roleid==4){
					$classUsers['teachers'][]=$user;
				}
			}
		}catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping roles.xml');
		}
		return $classUsers;
	}

	private function mapResourceModule($file) {
		$resource = array();
		// 0:Same window / 1:Embed / 2:Frame / 3:New window / 4:Force download
		$displayOptions = array(
			0 => 'Opens in same window',
			1 => 'Embedded',
			2 => 'Displays in frame',
			3 => 'Opens in new window',
			4 => 'Forces download of file',
			5 => 'unknown',
			6 => 'Opens in new window (small)'
		);
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($file);
			// get contextid
			while ($XMLReader->read() && $XMLReader->name !== 'activity');
			$resource['contextId'] = intval($XMLReader->getAttribute('contextid'));
			// get display options
			while ($XMLReader->read() && $XMLReader->name !== 'display');
			$type = intval($XMLReader->readString());
			// to avoid out-of-bounds error
			if($type >= count($displayOptions)) {
				$type = 0;
			}
			$resource['displayOptions'] = array(
				'type' => intval($XMLReader->readString()),
				'description' => $displayOptions[intval($XMLReader->readString())]
			);
		} catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping module of type Resource');
		}
		return $resource;
	}

	private function mapFolderModule($file) {
		$folder = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($file);
			// get contextid
			while ($XMLReader->read() && $XMLReader->name !== 'activity');
			$folder['contextId'] = intval($XMLReader->getAttribute('contextid'));
		} catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping module of type Folder');
		}
		return $folder;
	}

	private function mapQuizModule($file) {
		$questions = array();
		try {
			$XMLReader = new XMLReader();
			$XMLReader->open($file);
			while ($XMLReader->read() && $XMLReader->name !== 'questions');
			$questionsSequence = $XMLReader->readInnerXML();
			$questionsSequence = explode(',', $questionsSequence);
			// loop through id's and removes negatives and zero's (point to end of sequence in moodle)
			foreach($questionsSequence as $questionId) {
				if((int)$questionId > 0) {
					$questions[] = (int)$questionId;
				}
			}
		} catch(Exception $e) {
			throw new HttpException(400, 'Structure error found while mapping module of type Quiz');
		}
		return $questions;
	}

	/* QUERY: user's guardians */
	private $queryInsertImportsRecord = <<<SQL
		INSERT INTO imports (type, userId, mapFileName, folderName, courseName)
		VALUES (:type, :userId, :mapFileName, :folderName, :courseName)
SQL;

	/* QUERY: get default teacher for class (id only) */
	private $queryGetDefaultTeacher = <<<SQL
		SELECT userid
		FROM user_classes
		WHERE classid = :classId
			AND is_teacher = 1
			OR is_edit_teacher = 1
		LIMIT 1;
SQL;

	/* QUERY */
	private $queryGetPostIdFromExternalId = <<<SQL
		SELECT *
		FROM posts
		WHERE userid = :userId AND classid = :classId AND external_id = :externalId;
SQL;
	private $queryGetGradePostIdFromPostExternalId = <<<SQL
		SELECT grade_posts.*
		FROM grade_posts
		JOIN posts on grade_posts.teacher_post_id = posts.id
		WHERE posts.userid = :userId AND posts.classid = :classId AND posts.external_id = :externalId;
SQL;

	/* QUERY */
	private $queryGetQuizScoreFromExternalId = <<<SQL
		SELECT *
		FROM quiz_scores
		WHERE user_id = :userId AND quiz_id = :quizId AND class_id = :classId AND external_id = :externalId;
SQL;

	/* QUERY: get users by email */
	private $queryGetUserByEmail = <<<SQL
		SELECT *
		FROM users
		WHERE email = :email;
SQL;

	private $queryGetUserById = <<<SQL
		SELECT *
		FROM users
		WHERE id = :id;
SQL;
	/* QUERY: get user's details in class assignment */
	private $queryGetUserClassInfo = <<<SQL
		SELECT *
		FROM user_classes
		WHERE userid = :userId AND classid = :classId;
SQL;

	/* QUERY */
	private $queryAssignStudentToClass = <<<SQL
		INSERT INTO user_classes (userid, classid, is_student)
		VALUES (:userId, :classId, 1);
SQL;
	/* QUERY */
	private $queryAssignTeacherToClass = <<<SQL
		INSERT INTO user_classes (userid, classid, is_edit_teacher,is_teacher)
		VALUES (:userId, :classId, 1,1);
SQL;

	/* QUERY: get page id */
	private $queryGetPageIdFromExternalIdAndClassId = <<<SQL
		SELECT p.id
		FROM pages p
		INNER JOIN units u ON u.id = p.unitid
		INNER JOIN (SELECT * FROM classes WHERE id = :classId) c ON c.courseid = u.courseid
		WHERE p.external_id = :externalId;
SQL;

	/* QUERY */
	private $queryInsertPost = <<<SQL
		INSERT INTO posts (pageid, userid, classid, message, upload_url, upload_file_name, external_id,is_private)
		VALUES (:pageId, :userId, :classId, '', :upload_url, :upload_file_name, :externalId,1)
SQL;

	/* QUERY: insert response to student's post (aka teacher feedback) */
	private $queryInsertTeacherResponse = <<<SQL
		INSERT INTO posts (pageid, userid, classid, message, postrootparentid, post_reply_id, is_teacher, is_private, teacher_feedback,external_id)
		VALUES (:pageId, :userId, :classId, :message, :replyToId, :replyToId, 1, 1, 0,:externalId)
SQL;

	/* QUERY: insert grade (for post/assignment) */
	private $queryInsertAssignmentGrade = <<<SQL
		INSERT INTO grade_posts (post_id, teacher_post_id, user_id, grade, teacher_notes)
		VALUES (:postId, :teacherPostId, :userId, :grade, '')
SQL;

	/* QUERY: insert grade (for post/assignment) */
	private $queryInsertQuizScore = <<<SQL
		INSERT INTO quiz_scores (user_id, quiz_id, score,max_points,is_finished, class_id, external_id)
		VALUES (:userId, :quizId, :score,:max_points,:is_finished, :classId, :externalId)
SQL;

	private $queryUpdateQuizMaxScore = <<<SQL
		INSERT INTO class_assignments (page_id,class_id,points)
		VALUES (:pageId,:classId,:points)
		ON DUPLICATE KEY UPDATE points=:points
SQL;



}