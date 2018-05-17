<?php

namespace English3\Controller;

use English3\Controller\Classes\UserClassHistory;
use English3\Controller\ImportData\PowerSchool\AttendanceOnlyClass;
use English3\Controller\ImportData\PowerSchool\AttendanceOnlyEnrollment;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\Response;
use ZipArchive;

use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class PowerSchoolController extends ImportInterface{
	private $CACHED_COURSE_LENGTH = array();
    //not needed but in case there is anything else we need to do when instantiating the class
	public function __construct(Connection $reader) {
        parent::__construct($reader); //required in all classes to register the job
	}

    //define the temptables
    public static function importTemplate(){
        return [
        // step => [methodName => [recordLockMethod, removeProcessedRecords]]
            0 => ['pruneTables'=> ['','']],
            1 => ['importUsers'=> ['lockStudents','deleteStudents']],
            2 => ['importClasses'=> ['lockClasses','deleteClasses']],
            3 => ['assignStudentsToClasses'=> ['lockTempEnrollments','deleteTempEnrollments']]
		];

    }

    //define the required files
    protected function setRequiredFiles(){
        $this->requiredFiles = array(
			'cc.export.txt',
			'course.export.txt',
			'section.export.txt',
			'student.export.txt',
			'teacher.export.txt'
		);
    }
    public function testSync(Request $request,$orgId){
        global $PATHS;
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkRequiredFields(['mockTeachers','mockEnrollments','mockGrades'],$request->request->all(),true);
        $gradesData =  json_encode($request->request->get('mockGrades'));
        $enrollmentsData = json_encode($request->request->get('mockEnrollments'));
        $teachersData = json_encode($request->request->get('mockTeachers'));
        $isTestMode = true;
        $delayScript= true;
        chdir ( $PATHS->app_path.'/powerschool' );
        require('sync.php');
        main($isTestMode,$gradesData,$enrollmentsData,$teachersData);
        return new Response();
    }
	public function importFromJson(Request $request,$orgId){
		$util = new Utility();
		$util->checkAdmin($orgId);
		$this->orgId = $orgId;
		Utility::clearPOSTParams($request);
		$importData = $request->request->all();
		return new JsonResponse($this->_importFromJson($importData));
	}

	public function import(Request $request) {
		// is logged in?
		if(!$this->me) {
			return Utility::buildHTTPError('You must be logged in', 403);
		}
		//
		// check other permissions here
		//

		// get file (param name MUST be 'file' for POST request)
		$isWindows = false;
		$zipFile = $request->files->get('file');
		if(!$zipFile) {


				if (file_exists('e:/psexport.zip')){
					$orgId = 10;
					$targetFilePath  = 'e:/psexport.zip';
					$originalFileName = '\psexport.zip';
					$serverFolderName = '\powerschool' . time();
					$removeOriginal = false;
					$isWindows = true;
				}

				else{
			return Utility::buildHTTPError('No file received. Param name MUST be "file"', 400);
		}
		}
		Utility::clearPOSTParams($request);
		if($isWindows == false){
		$orgId = $request->request->get('orgId');
	}
		if(!$orgId) {
			return Utility::buildHTTPError('No orgId received', 400);
		}
		$this->orgId = $orgId; // this is required <-----------

		// original full name of file (ZIP)
			if($isWindows == false){
		$originalFileName = $zipFile->getClientOriginalName();
		}
		// initial location (in server) of zip file
			if($isWindows == false){
		$targetFilePath = $this->imports_path . DIRECTORY_SEPARATOR . $originalFileName;
	
		// move zip file to server folder (temporary storage)
		try {
			$zipFile->move($this->imports_path, $originalFileName);
		} catch(FileException $e) {
			return Utility::buildHTTPError('Could not write file to target folder. Error message: ' . $e->getMessage(), 500);
		}
		$removeOriginal = true;
		
		}

		// file is in temp folder. Now extract it and remove original
		// * Utility::extract automatically removes original file after it is extracted (3rd param = true by default)
		if($isWindows == false){
		$serverFolderName = 'powerschool' . time();
	}
		$serverFolderPath = $this->imports_path . DIRECTORY_SEPARATOR . $serverFolderName;

		if (!file_exists($this->imports_path)){
		if (!mkdir($this->imports_path , 0777, true)) {
    		return Utility::buildHTTPError('Error Failed to create folders...',500);
		}
	}

		if(!Utility::extract($targetFilePath, $serverFolderPath,$removeOriginal)) {
			return Utility::buildHTTPError('Error ocurred while extracting file. Make sure the filetype is correct and that the system has permissions to write in target folder', 400);
		}

		if ($isWindows == true){
		$serverFolderPath .= '\\';
	}
		// file is extracted, check that all required files are present
		foreach ($this->requiredFiles as $key => $requiredFile) {
				if ($isWindows == true){
				$this->requiredFiles[$key] = $requiredFile;
			}
			if(!file_exists($serverFolderPath . DIRECTORY_SEPARATOR . $requiredFile)) {
				return Utility::buildHTTPError('Missing file: ' . $requiredFile, 400);
			}
		}
	
		// files are there. Now we're ready to map them. Create maps
		$this->mapOriginalFiles($serverFolderPath);
		// at this point, all the temporary tables have already been created and filled with the data from the uploaded files.
		// This could have taken 0-30 mins or more, depending on number of entries on each file.
       // var_dump($request->request->get('async'));exit;


        if($request->request->get('async')!='yes'){
            // Now, proceed to import(create/update) users
            $inserted = array();
            $inserted['students'] = $this->importUsers();
            $inserted['classes'] = $this->importClasses();
            $this->assignStudentsToClasses();
            $inserted['errors'] = $this->errors;
            $this->cleanUp();
            return new JsonResponse($inserted);
        }else{
            $this->registerNewJob();
            global $PATHS;
            require_once($PATHS->app_path .'/src/English3/Bin/processImportJobs.php');
            //http_response_code(500);
            //exit;
            return new JsonResponse(['students'=>0,'classes'=>0,'errors'=> $this->errors]);
        }
	}

	protected function mapOriginalFiles($folderPath) {
		
		$path = $folderPath . DIRECTORY_SEPARATOR;
		$this->mapCSV($path . 'cc.export.txt', $this->queryTempCCTableCreate());
		$this->mapCSV($path . 'course.export.txt', $this->queryTempCourseTableCreate());
		$this->mapCSV($path . 'student.export.txt', $this->queryTempStudentTableCreate());
		$this->mapCSV($path . 'section.export.txt', $this->queryTempSectionTableCreate());
		$this->mapCSV($path . 'teacher.export.txt', $this->queryTempTeacherableCreate());
		Utility::rmdirRecursive($folderPath);
	}

    public function cleanUp(){
		//delete unecessary users
		$this->util->execute(
			$this->queryDeleteUnncessaryStudents(),
			[]
		);

		// remove temp tables
		$this->util->execute(
			$this->queryDropTables(),
			[]
		);


	}

    public function pruneTables(){
		// remove temp tables
        //echo "pruning table with: \r\n";
        //echo $this->queryPruneTables()."\r\n";
		$this->util->execute(
			$this->queryPruneTables(),
			[]
		);
	}


	protected function mapCSV($filePath, $queryCreate) {

		// $this->util->execute(
		// 	$queryCreate,
		// 	array(
		// 		'filePath' => $filePath
		// 	)
		// );
		global $DB;
		$queryCreate['import'] = str_replace(':filePath', $filePath, $queryCreate['import']);
		$con = mysqli_init();
		mysqli_options($con, MYSQLI_OPT_LOCAL_INFILE, true);
		mysqli_real_connect($con,$DB->host,$DB->user,$DB->password,$DB->database);
		$result = mysqli_query($con, $queryCreate['drop']);
		$result = mysqli_query($con, $queryCreate['create']);
		$result = mysqli_query($con, $queryCreate['import']);
	}

	public function importUsers($limit=0) {

      //  echo "Importing users: \r\n";
        //echo $this->queryGetStudentsToInsert($limit)."\r\n";
		global $SECURITY;

        //$this->lockStudents($limit);
		$students = $this->util->fetch(
			$this->queryGetStudentsToInsert($limit,
			array('orgId' => $this->orgId))
		);
		$insertedIds = array();
		
	
		foreach ($students as $student) {
			$studentExists = $this->util->fetchRow(self::$queryGetUserFromExternalId, array('orgId' => $this->orgId, 'externalId' => $student['ID']));

//            if(!$student['GuardianEmail']) {
//                $this->errors[] = ('Student has no guardian: ' . $student['Last_Name'] . ', ' . $student['First_Name'] . '. No user created for this student');
//                continue;
//				// guardian's email provided
//            }


			
			if($student['GuardianEmail']) {

				$guardianExists = $this->util->fetchRow(self::$queryGetUserByEmail, array('email'=>$student['GuardianEmail']));
				$advisor = $this->util->fetchRow(self::$queryGetUserFromExternalId, array('orgId' => $this->orgId, 'externalId' => 'advisor-' . $student['Locker_Combination']));
				// no guardian's email

					if(!$guardianExists) {
						// insert guardian
						$md5_password = md5($SECURITY->salt . 'password' . 'password');
						$guardianPhone = ($student['fatherdayphone'])? $student['fatherdayphone'] : (($student['motherdayphone'])? $student['motherdayphone'] : '');
						$guardianId = $this->util->insert(
							self::$queryInsertUser,
							array(
								'organizationid' => $this->orgId,
								'fname' => 'Guardian of ' . $student['First_Name'] . ' ' . $student['Last_Name'],
								'lname' => '',
								'email' => $student['GuardianEmail'],
								'phone' => $guardianPhone,
								'password' => $md5_password,
								'salt_for_password' => 'password',
								'external_id' => $student['GuardianEmail'],
								'createdBY'=>$_SESSION['USER']['ID']
							)
						);
					} else {
						$guardianId = $guardianExists['id'];
					}
					$this->util->insert(
						self::$queryCreateDefaultUserPreferences,
						['userId' => $guardianId]
					);

			}
			$salt = Utility::generatePassword(44);
			$md5_password = md5($SECURITY->salt . $salt . $student['Student_Password']);
			$newId = $this->util->insert(
				self::$queryInsertUser,
				array(
					'organizationid' => $this->orgId,
					'fname' => $student['First_Name'],
					'lname' => $student['Last_Name'],
					'email' => $student['Student_email'],
					'phone' => $student['Home_Phone'],
					'external_id' => $student['ID'],
					'password' => $md5_password,
					'salt_for_password' => $salt,
					'guardianId' => $guardianId,
					'createdBY'=>$_SESSION['USER']['ID']
				)
			);
			if(!$newId && $studentExists) {
				$newId = $studentExists['id'];
			}
			if($newId) {
				// assign guardian
				$this->util->insert(
					self::$queryAssignChildToGuardian,
					array(
						'guardianId' => $guardianId,
						'studentId' => $newId,
						'can_enter_attendance'=>false
					)
				);
				// assign to advisor
				if($advisor) {
					$this->util->insert(
						self::$queryAssignStudentToAdvisor,
						array(
							'advisorId' => $advisor['id'],
							'studentId' => $newId
						)
							);
				}
				$studentId = $newId;

/*
			echo '$studentId = '.$studentId."\n\n";
			echo $queryGetUserFromExternalId;
			print_r($student);			
			print_r($studentExists);
			print_r($guardianExists);
			print_r($advisor);
			print_r($this->errors);
			exit;		
*/

				// user preferences (default)
				$this->util->insert(
					self::$queryCreateDefaultUserPreferences,
					['userId' => $studentId]
				);
				$insertedIds[] = $newId;
			}



		}
		return $insertedIds;
	}

	public function importClasses($limit = 0) {
       // echo "Importing classes: \r\n";
       // echo $this->queryGetClassesToInsert($limit)."\r\n";
		global $SECURITY;


		$classes = $this->util->fetch(
			$this->queryGetClassesToInsert($limit),
			array('orgId' => $this->orgId)
		);


		// this is a temporary solution for the lack of a department id in powerschool files
		$tempDept = $this->util->fetchRow(
			$this->queryGetTemporaryDepartment(),
			array('orgId' => $this->orgId)
		);
		if(!$tempDept) {
			$tempDept = array();
			$tempDept['id'] = $this->util->insert(
				$this->queryInsertTemporaryDepartment(),
				array('orgId' => $this->orgId)
			);
		}

		$classesToInsert = array();
		foreach ($classes as $class) {
			if(!array_key_exists('LMS_Code', $classesToInsert)) {
				$classesToInsert[$class['LMS_Code']] = $class;
				$classesToInsert[$class['LMS_Code']]['sites'] = array($class['ID']);
			} else {
				$classesToInsert[$class['LMS_Code']]['sites'][] = $class['ID'];
			}
		}

		$insertedIds = array();



		foreach ($classesToInsert as $LMS_Code => $class) {
			$newCourseId = $this->util->insert(
				self::$queryInsertCourse,
				array(
					'departmentid' => $tempDept['id'],
					'name' => $class['name'],
					'is_active'=> true
				)
			);
			// there is a unique key (oddly called 'organizationid') which checks for departmentid+name
			// so, if newCourseId = 0 (from previous), then it already exists and couldn't be inserted
			if(!$newCourseId) {
				$newCourseId = $this->util->fetchOne(
					self::$queryGetCourseIdFromDeptAndName,
					array(
						'departmentid' => $tempDept['id'],
						'name' => $class['name']
					)
				);

			}else{
				$newClassId = $this->util->insert(
					self::$queryInsertClass,
					array(
						'courseid' => $newCourseId,
						'name' => $class['name'],
						'LMS_id' => $LMS_Code,
						'external_course_id' => $class['CourseID']
					)
				);
			}
			// if newClassId contains a value, a new record was inserted
			if($newClassId) {
				$insertedIds[] = $newClassId;
				// record section id's (in Sections_LMS_id)
				foreach ($class['sites'] as $sectionID) {
					$this->util->insert(
						self::$queryInsertSectionID,
						array(
							'LMS_id' => $LMS_Code,
							'sectionID' => $sectionID
						)
					);
				}

				// assign teacher to class
				//
				// first, try to find teacher by external_id and organization_id in db
				$teacher = $this->util->fetchRow(
					self::$queryGetTeacherByExternalId,
					array(
						'orgId' => $this->orgId,
						'externalId' => $class['Teacher']
					)
				);
/*
	print_r($teacher);
	print_r($classesToInsert);
		//$this->cleanUp();
		exit();
*/
				// if not found by external id, try by email
				if(!$teacher){
					$teacher = $this->util->fetchRow(
						$this->queryGetTeacherByExternalEmail(),
						array(
							'externalId' => $class['Teacher']
						)
					);
					if($teacher){
						$teacherId = $teacher['id'];
					} else {
						// if still not found, doesn't exist. Create.
						// get teacher info from temp table
						$teacher = $this->util->fetchRow(
							$this->queryGetTeacherFromTemp(),
							array(
								'id' => $class['Teacher']
							)
						);
						$md5_password = md5($SECURITY->salt . 'password' . 'password');
						$teacherId = $this->util->insert(
							self::$queryInsertUser,
							array(
								'organizationid' => $this->orgId,
								'fname' => $teacher['First_Name'],
								'lname' => $teacher['Last_Name'],
								'email' => $teacher['Email_Addr'],
								'phone' => '',
								'password' => $md5_password,
								'salt_for_password' => 'password',
								'external_id' => $teacher['ID'],
								'createdBY'=>$_SESSION['USER']['ID']
							)
						);
					}
				} else {
					$teacherId = $teacher['id'];
				}
				// add user preferences
				$this->util->insert(
					self::$queryCreateDefaultUserPreferences,
					['userId' => $teacherId]
				);
				// at this point, the $teacherId has to be ready. Now assign teacher to class
				$this->util->insert(
					self::$queryAssignTeacherToClass,
					array(
						'teacherId' => $teacherId,
						'classId' => $newClassId
					)
				);
			}
		}
		return $insertedIds;
	}

	public function assignStudentsToClasses($limit=0) {
		$enrollments = $this->util->fetch($this->queryGetTempEnrollments($limit), []);

		foreach ($enrollments as $enrollment) {
			$userId = $this->util->fetchOne(
				self::$queryGetUserFromExternalId,
				array(
					'orgId' => $this->orgId,
					'externalId' => $enrollment['StudentID']
				)
			);
			if(!$userId) {
				continue;
			}
			$enrollmentExists=$this->util->fetchOne(self::$queryGetUserClassesData,
				array(
					'userId'=>$userId,
					'classId'=>$enrollment['classId']
				),
				'id');
			if($enrollmentExists){
				$this->util->insert(
					self::$queryUpdateEnrollment,
					array(
						'enrollmentDate'=>date('Y-m-d', strtotime(str_replace('-', '/', $enrollment['DateEnrolled']))),
						'id'=>$enrollmentExists
					)
				);
			}
			else{
				$this->util->insert(
					self::$queryAssignStudentToClass,
					array(
						'userId' => $userId,
						'classId' => $enrollment['classId'],
						'enrolled' => date('Y-m-d', strtotime(str_replace('-', '/', $enrollment['DateEnrolled']))),
						'date_left'=>null
					)
				);
			}

		}
	}

	private function _importFromJson($json){
		$response = array(
			'classes'=>0,
			'students'=>0,
			'errors'=>array()
		);
		$errors = array();
		$this->warnings = array();
		// this is a temporary solution for the lack of a department id in powerschool files
		$tempDept = $this->util->fetchRow(
			$this->queryGetTemporaryDepartment(),
			array('orgId' => $this->orgId)
		);
		if(!$tempDept) {
			$tempDept = array();
			$tempDept['id'] = $this->util->insert(
				$this->queryInsertTemporaryDepartment(),
				array('orgId' => $this->orgId)
			);
		}
		$this->tempDept = $tempDept['id'];

		if(isset($json['sections'])){
			$classesResponse = $this->importClassesV2($json['sections'],$tempDept['id'],$this->orgId);
			$errors = array_merge($errors,$classesResponse['errors']);
			$response['classes']=$classesResponse['classes'];
		}
		if(isset($json['students'])){
			$this->withdrawStudents($json['withdrawals'],$errors);
			$studentsResponse=$this->importStudents($json['students'],$this->orgId);
			$errors = array_merge($errors,$studentsResponse['errors']);
			$response['students']=$studentsResponse['students'];
		}
		$this->moveAdvisorsAndGuardiansTable();
		$response['errors']= $errors;
		$response['warnings'] = $this->warnings;
		return $response;

	}
    private function moveAdvisorsAndGuardiansTable(){
        $this->clearAdvisorsAndGuardiansTable();
        Utility::getInstance()->insert(self::$queryMoveUserAdvisors);
        Utility::getInstance()->insert(self::$queryMoveUserGuardians);
        $this->clearAdvisorsAndGuardiansTempTable();
    }
	private function clearAdvisorsAndGuardiansTable(){
		Utility::getInstance()->insert($this->clearAdvisorsTable,['orgId'=>$this->orgId]);
		Utility::getInstance()->insert($this->clearGuardiansTable,['orgId'=>$this->orgId]);
	}

    private function clearAdvisorsAndGuardiansTempTable(){
        Utility::getInstance()->insert("DELETE FROM temp_user_guardians");
        Utility::getInstance()->insert("DELETE FROM temp_user_advisors");

    }
	private function importStudents($students,$orgId){
		
		$errors = array();
		$studentCount = 0;
		foreach($students as $id=>$student){
			if(!isset($student['cc'])){
				$errors[]="Could not process user ". $id . " " . $student['firstname']. " " . $student['lastname'].". Please check if 'cc' property is set in the json file";
				continue;
			}
			$studentRow = $this->util->fetchRow(self::$queryGetUserFromExternalId,[
				'externalId'=>$id,
				'orgId'=>$this->orgId
			]);

			if(!$studentRow){
				$newUserParams=[
					'fname'=>$student['firstname'],
					'lname'=>$student['lastname'],
					'external_id'=>$id,
					'password'=>$student['password'],
					'email'=>$student['email'],
					'organizationid'=>$orgId,
					'preferred_language'=>'en'
				];
				$studentId = UserController::_createUser($newUserParams);
				if(!$studentId){
					$errors[]="Could not create user ". $id . " " . $student['firstname']. " " . $student['lastname'];
					continue;
				}
			}
			else{
				$studentId = $studentRow['id'];
				try {
					global $SECURITY;
					$md5_password =md5($SECURITY->salt . $studentRow['salt_for_password'] . $student['password']);
					$this->util->insert(
						self::$queryUpdateUser,
						[
							'fname'=>$student['firstname'],
							'lname'=>$student['lastname'],
							'email'=>$student['email'],
							'password'=>$md5_password,
							'organizationid' => $orgId,
							'track_attendance'=>$student['track_attendance'],
							'id'=>$studentId
						]
					);

				}catch(\Exception $e){
					$errors[]='Error when updating student '.$student['firstname']. ' '. $student['lastname'] . '. Possibly a duplicated user';
				}
			}


			$errors = array_merge($errors,$this->addStudentToSite($student,$studentId));
			$errors = array_merge($errors,$this->importAdvisorAndGuardians($student,$studentId));
			$errors = array_merge($errors,$this->assignStudentToClasses($student,$studentId));
			$studentCount++;
		}

		return ['errors'=>$errors,'students'=>$studentCount];
	}
	private function addStudentToSite($studentData,$studentId){
		$errors=array();
		if(!isset($studentData['site']) ||$studentData['site']==""){
			$this->warnings[]="Warning: Could not find site for student ". $studentData['firstname']. " " . $studentData['lastname'];
		}
		else{
			$siteId = $this->util->fetchOne(SiteController::$queryGetSiteByName,['name'=>$studentData['site']]);
			if(!$siteId){
				$this->warnings[]="Warning: Could not find site ". $studentData['site'] ." for student ". $studentData['firstname']. " " . $studentData['lastname'];
			}
			else{
				$this->util->insert(
					SiteController::$queryAssignUser,
					array(
						'siteId' => $siteId,
						'userId' => $studentId
					)
				);
			}


		}

		return $errors;
	}
	private function assignStudentToClasses($studentData,$studentId){
		$errors = array();
		$ccData = $studentData['cc'];
		foreach($ccData as $cc){
			if(is_null($cc['LMS_code']) && $cc['attendance_only']){
				try{
					$this->checkAndEnrollToAttendanceOnlyClass($cc,$studentId);
				}catch (\Exception $e){
					$errors[]=sprintf('Error when enrolling student %s %s to attendance only class %s',$studentData['firstname'],$studentData['lastname'],$cc['coursename']);
				}
				continue;
			}else{
				$classId = $this->util->fetchOne(self::$queryGetClassByLmsId,['lmsId'=>$cc['LMS_code']]);
			}
			if(!$classId){
				$errors[]='Error when enrolling student '.$studentData['firstname']. ' '. $studentData['lastname'] . '. Could not find a class with LMS_code = '.$cc['LMS_code']. ' ('. $cc['coursename'] .')';
				continue;

			}
			$enrollmentExists = $this->util->fetchRow(self::$queryGetUserClassesData,['classId'=>$classId,'userId'=>$studentId]);
			$cc['date_left']= $this->getEndDate($cc,$classId,$studentId);
			if($enrollmentExists){
                try {
                    $affectedRows = $this->util->reader->update('user_classes', [
                        'created' => date('Y-m-d', strtotime(str_replace('-', '/', $cc['start_date']))),
                        'date_left' => $cc['date_left']
                    ], ['classId' => $classId,
                        'userId' => $studentId]);
                    if ($affectedRows > 0) {
                        GradebookController::_setRecalculateDueDates($classId, $studentId);
                    }
                }catch(\Exception $e){
                    $errors[]='Error when enrolling student '.$studentData['firstname']. ' '. $studentData['lastname'] . '. Duplicate entry';
                }

			}
			else{
				$this->util->insert(
					self::$queryAssignStudentToClass,
					array(
						'userId' => $studentId,
						'classId' => $classId,
						'enrolled' => date('Y-m-d', strtotime(str_replace('-', '/', $cc['start_date']))),
						'date_left' => $cc['date_left'],
						'manual_start_date'=>date('Y-m-d', strtotime(str_replace('-', '/', $cc['start_date'])))
					)
				);
				GradebookController::_setRecalculateDueDates($classId,$studentId);
			}
		}
		return $errors;
	}
	private function getEndDate($cc,$classId,$userId){
		if(@$cc['date_left']){
			return date('Y-m-d', strtotime(str_replace('-', '/', $cc['date_left'])));
		}
		return $this->calculateEndDate($classId,$userId);
	}
	private function calculateEndDate($classId,$userId){
		$duration = $this->loadCourseLengthFromDB($classId);
		$calendar = ClassesController::_getSchoolCalendar($userId,$classId);
		return ClassesController::_getNextDueDate(new \DateTime(),$duration,$calendar);
	}
	private function loadCourseLengthFromDB($classId){
		if(!array_key_exists($classId,$this->CACHED_COURSE_LENGTH)){
			$cLength = Utility::getInstance()->fetchOne("SELECT course_length FROM classes WHERE id=:id",['id'=>$classId]);
			$this->CACHED_COURSE_LENGTH[$classId] = $cLength?:90;

		}
		return $this->CACHED_COURSE_LENGTH[$classId];

	}
	private function checkAndEnrollToAttendanceOnlyClass($cc,$studentId){
		$classId = $this->getAttendanceOnlyClass($cc);
		$enrollment = new AttendanceOnlyEnrollment($classId,$studentId);
		$enrollment->updateEnrollment(
			date('Y-m-d', strtotime(str_replace('-', '/', $cc['start_date']))),
			date('Y-m-d', strtotime(str_replace('-', '/', $cc['date_left'])))
		);
	}
	private function getAttendanceOnlyClass($cc){
		$class = AttendanceOnlyClass::initWithExternalId($cc['sectionid']);
		if(!$class->classExists()){
			//$this->warnings[]="Warning: Creating attendance only class ".$cc['coursename'].". This class won't be displayed in the student's dashboard";
		}
		return $class->createOrUpdateClass($cc['sectionid'],$this->tempDept,$cc['coursename']);
	}
	private function importAdvisorAndGuardians($studentData,$studentId){
		$errors = array();
		if(isset($studentData['guardians'])){
			foreach($studentData['guardians'] as $guardian){
				if(!@$guardian['email']){
					continue;
				}
				$guardianEmails = preg_split("/[,\/;]+/",$guardian['email']);
				$guardianExists = false;
				foreach($guardianEmails as $email){
					$email  = trim($email);
					$emailRegex = "({$email})[[:space:]]*(,|$|\/|;)";
					$guardianExists = $this->util->fetchRow(self::$queryGetAdvisorByEmail, array('email' => $emailRegex));
					if($guardianExists){
						break;
					}
				}

				// no guardian's email

				if (!$guardianExists) {
					// insert guardian
					$newUserParams = [
						'organizationid' => $this->orgId,
						'fname' => 'Guardian of ' . $studentData['firstname'] . ' ' . $studentData['lastname'],
						'lname' => '',
						'phone' => $guardian['phone'],
						'email' => $guardian['email'],
						'password' => 'password',
						'external_id' => $guardian['email'],
						'preferred_language' => 'en'
					];
					$guardianId = UserController::_createUser($newUserParams);
				} else {
					$guardianId = $guardianExists['id'];
					if(!intval($guardianExists['other_role'])){
						$this->util->reader->update(
							'users',
							['fname'=>'Guardian of ' . $studentData['firstname'] . ' ' . $studentData['lastname']],
							['id'=>$guardianId]
						);
					}


				}

				// assign guardian
				$this->util->insert(
					self::$queryAssignChildToGuardian,
					array(
						'guardianId' => $guardianId,
						'studentId' => $studentId,
						'can_enter_attendance' => $guardian['can_enter_attendance']
					)
				);
			}

		}
		//adivisors
		if(isset($studentData['advisors'])){
			foreach($studentData['advisors'] as $advisor){
				if(is_null($advisor['id'])){
					continue;
				}
				$advisorId = $this->util->fetchOne(self::$queryGetUserByEmail,[
					'email'=>$advisor['email']
				]);

				if(!$advisorId){
					$newUserParams=[
						'fname'=>$advisor['firstname'],
						'lname'=>$advisor['lastname'],
						'external_id'=>$advisor['id'],
						'password'=>'password',
						'email'=>$advisor['email'],
						'organizationid'=>$this->orgId,
						'preferred_language'=>'en'
					];
					$advisorId = UserController::_createUser($newUserParams);
					if(!$advisorId){
						$errors[]="Could not create advisor (possibly a dup user) ". $advisor['id'] . " " . $advisor['firstname']. " " . $advisor['lastname'];
					}
				}
				else{
					$this->reader->update(
						'users',
						[
							'fname'=>$advisor['firstname'],
							'lname'=>$advisor['lastname'],
							'email'=>$advisor['email'],
							'organizationid'=>$this->orgId
						],
						['id'=>$advisorId]
					);
				}

				$this->util->insert(
					self::$queryAssignStudentToAdvisor,
					array(
						'advisorId' => $advisorId,
						'studentId' => $studentId
					)
				);
			}

		}

		return $errors;
	}
	private function importClassesV2($sections,$tempDept,$orgId){

		$errors = array();
		$classCount = 0;
		foreach($sections as $section){
			$classId=null;

			$class = $this->util->fetchRow(self::$queryGetClassByLmsId,['lmsId'=>$section['lms_code']]);

			if($class){
				try{
					$this->reader->update(
						'courses',
						['name'=>$section['sectionname']],
						['id'=>$class['courseid']]
					);
				}catch(\Exception $e){
					$errors[]='Course '.$section['sectionname'].' could not be updated. Please, check if this course already exist';
					continue;
				}
				$this->util->insert(self::$queryUpdateClassByLmsId,
					array(
						'name'=>$section['sectionname'],
						'lmsId'=>$section['lms_code']
					));
				$classId = $class['id'];
			}else{
				$classId = $this->createClass($section);
				if($classId){
					$classCount++;
				}
				else{
					continue;
				}
			}

			if(!$classId){
				$errors[]='Course '.$section['sectionname'].' could not be created. Please, check if this course already exist';
				continue;
			}

			if(!isset($section['teacher'])){
				$errors[]='Course '.$section['sectionname'].' could not be created. Please, check if the teacher was set in the json file';
			}

			$teacherId = $this->util->fetchOne(self::$queryGetUserByEmail,[
				'email'=>$section['teacher']['email'],
			]);
			if(!$teacherId){
				$teacher = $section['teacher'];
				global $SECURITY;
				$salt = Utility::generateSalt(44);
				$md5_password = md5($SECURITY->salt . $salt . 'password');
				$expirationDate = UserController::updatePasswordExpiration(null,'',$orgId,false);
				if($expirationDate){
					$password_expires_on=$expirationDate;
				}
				$newUserParams=[
					'fname'=>$teacher['firstname'],
					'lname'=>$teacher['lastname'],
					'external_id'=>$teacher['id'],
					'password'=>$md5_password,
					'email'=>$teacher['email'],
					'organizationid'=>$orgId,
					'preferred_language'=>'en'
				];
				$teacherId = UserController::_createUser($newUserParams);

				$this->util->insert(
					self::$queryCreateDefaultUserPreferences,
					['userId' => $teacherId]
				);
			}

			$enrollmentExists=$this->util->fetchOne(self::$queryGetUserClassesData,
				array(
					'userId'=>$teacherId,
					'classId'=>$classId
				),
				'id');
			if(!$enrollmentExists){
				$this->util->insert(
					self::$queryAssignTeacherToClass,
					array(
						'teacherId' => $teacherId,
						'classId' => $classId
					)
				);
			}
		}
		return ['errors'=>$errors,'classes'=>$classCount];
	}
	private function createClass($section,$isHiddenClass=false){

		$courseId = $this->util->insert(self::$queryInsertCourse,[
			'departmentid'=>$this->tempDept,
			'name'=>$section['sectionname'],
			'is_active'=>!$isHiddenClass
		]);

		if($courseId){
			$classId = $this->util->insert(self::$queryInsertClass,[
				'courseid'=>$courseId,
				'name'=>$section['sectionname'],
				'LMS_id'=>$section['lms_code'],
				'external_course_id'=>$section['sectionid'],

			]);
			return $classId;
		}
		return null;
	}
	private function withdrawStudents($withdrawals,&$errors){
		if(!$withdrawals){
			return;
		}
		foreach($withdrawals as $withdrawalInfo){
		    if($withdrawalInfo['student_ps_id']==44598 || $withdrawalInfo['student_ps_id']==44609){ //HARD SKIPPING FOR ATTENDANCE FIX - REMOVE IT
		        continue;
            }
			if(intval($withdrawalInfo['LMS_Code'])){
				$studentId = $this->getStudentFromPSId($withdrawalInfo['student_ps_id']);
				if(!$studentId){
					$errors[]='Withdraw error! Could not find user with student_ps_id = '. $withdrawalInfo['student_ps_id'];
				}
				$classId = $this->getClassFromLMSCode($withdrawalInfo['LMS_Code']);
				if(!$classId){
					$errors[]='Withdraw error! Could not find class with LMS_code = '. $withdrawalInfo['LMS_Code'];
				}
				UserClassHistory::moveUserToClassHistory($studentId,$classId);
			}else if(intval($withdrawalInfo['sectionid']) && boolval($withdrawalInfo['attendance_only'])){
				$studentId = $this->getStudentFromPSId($withdrawalInfo['student_ps_id']);
				if(!$studentId){
					$errors[]='Withdraw error! Could not find user with student_ps_id = '. $withdrawalInfo['student_ps_id'];
				}
				$classId = $this->getAttendanceOnlyClassFromSectionIdAndName($withdrawalInfo['sectionid'],$withdrawalInfo['coursename']);
				if(!$classId){
					$errors[]='Withdraw error! Could not find attendance only class with sectionid = '. $withdrawalInfo['sectionid']. ', coursename = '. $withdrawalInfo['coursename'];
				}
				UserClassHistory::moveUserToAttendanceClassHistory($studentId,$classId);
			}
		}
	}
	private function getStudentFromPSId($psId){
		return Utility::getInstance()->fetchOne('SELECT id FROM users WHERE external_id = :psId',['psId'=>$psId]);
	}
	private function getClassFromLMSCode($LMS_code){
		return Utility::getInstance()->fetchOne('SELECT id FROM classes WHERE LMS_id = :LMS_code',['LMS_code'=>$LMS_code]);
	}
	private function getAttendanceOnlyClassFromSectionIdAndName($sectionid,$classname){
		return Utility::getInstance()->fetchOne('SELECT id FROM attendance_only_classes ac WHERE ac.external_id = :sectionid and name = :className',['sectionid'=>$sectionid,'className'=>$classname]);
	}
	protected function queryTempCCTableCreate(){
        $tableName = 'temp_powerschool_cc_'.$this->uniqueIdentifier;
		$drop = "DROP TABLE IF EXISTS $tableName";
		$create = "CREATE TABLE $tableName ("
			. " ID VARCHAR(30) NOT NULL,"
			. " StudentID INT(11),"
			. " Course_Number VARCHAR(30),"
			. " DateEnrolled DATE,"
			. " DateLeft DATE,"
			. " TermID INT(11),"
			. " SectionID INT(11),"
			. " LastGradeUpdate DATE,"
			. " SchoolID INT(11),"
            . " processID INT(7) DEFAULT NULL,"
			. " PRIMARY KEY(ID),"
            . " INDEX `processID` (`processID`),"
            . " INDEX `SchoolID` (`SchoolID`)"
		. " )";
		$import = "LOAD DATA LOCAL INFILE ':filePath' INTO TABLE $tableName"
			. " FIELDS TERMINATED BY '~' OPTIONALLY ENCLOSED BY '\"'"
			. " LINES TERMINATED BY '\n'"
			. " IGNORE 1 LINES"
			. " (StudentID,Course_Number,@var1,@var2,TermID,SectionID,LastGradeUpdate,ID,SchoolID)"
			. " SET DateEnrolled = STR_TO_DATE(@var1, '%m/%d/%Y'), DateLeft = STR_TO_DATE(@var2, '%m/%d/%Y')";
		return array(
			'drop' => $drop,
			'create' => $create,
			'import' => $import
		);
	}

	protected function queryTempCourseTableCreate () {
        $tableName = 'temp_powerschool_course_'.$this->uniqueIdentifier;
		$drop = "DROP TABLE IF EXISTS {$tableName}";
		$create = " CREATE TABLE {$tableName} ("
			. " ID VARCHAR(30),"
			. " Course_Name VARCHAR(255),"
			. " Status VARCHAR(1),"
			. " Credit_Hours VARCHAR(30),"
			. " Course_Number VARCHAR(30),"
			. " PRIMARY KEY(ID)"
		. " )";
		$import = " LOAD DATA LOCAL INFILE ':filePath' INTO TABLE {$tableName}"
		. " FIELDS TERMINATED BY '~' OPTIONALLY ENCLOSED BY '\"'"
		. " LINES TERMINATED BY '\n'"
		. " IGNORE 1 LINES"
		. " (Course_Name,Course_Number,Status,ID,Credit_Hours)";
		return array(
			'drop' => $drop,
			'create' => $create,
			'import' => $import
		);
	}

	protected function queryTempStudentTableCreate(){
        $tableName = 'temp_powerschool_student_'.$this->uniqueIdentifier;
		$drop = "DROP TABLE IF EXISTS {$tableName}";
		$create = " CREATE TABLE {$tableName} ("
			. " ID VARCHAR(30),"
			. " Last_Name VARCHAR(60),"
			. " First_Name VARCHAR(60),"
			. " Home_Room VARCHAR(60),"
			. " Locker_Combination VARCHAR(60),"
			. " Student_Username VARCHAR(60),"
			. " Student_Password VARCHAR(100),"
			. " Student_email VARCHAR(60),"
			. " motherdayphone VARCHAR(60),"
			. " fatherdayphone VARCHAR(60),"
			. " Home_Phone VARCHAR(60),"
			. " GuardianEmail VARCHAR(60),"
			. " Parent_email VARCHAR(60),"
			. " Student_Number VARCHAR(2),"
			. " State_StudentNumber VARCHAR(2),"
			. " Tuitionpayer VARCHAR(2),"
			. " Lastfirst VARCHAR(2),"
			. " Grade_Level VARCHAR(2),"
			. " FTEID VARCHAR(2),"
			. " EntryDate VARCHAR(2),"
			. " ExitDate VARCHAR(2),"
			. " Mother_home_phone VARCHAR(2),"
			. " Father_home_phone VARCHAR(2),"
			. " guardiandayphone VARCHAR(2),"
			. " SchoolID VARCHAR(30),"
            . " processID INT(7) DEFAULT NULL,"
			. " PRIMARY KEY(ID),"
            . " INDEX `processID` (`processID`),"
            . " INDEX `SchoolID` (`SchoolID`)"
		. " )";
		$import = " LOAD DATA LOCAL INFILE ':filePath' INTO TABLE {$tableName}"
		. " FIELDS TERMINATED BY '~' OPTIONALLY ENCLOSED BY '\"'"
		. " LINES TERMINATED BY '\n'"
		. " IGNORE 1 LINES"
		. " (Student_Number,ID,State_StudentNumber,Tuitionpayer,Lastfirst,Last_Name,First_Name,Grade_Level,FTEID,EntryDate,ExitDate,Home_Room,Locker_Combination,Student_Username,Student_Password,Student_email,Mother_home_phone,motherdayphone,Father_home_phone,fatherdayphone,Home_Phone,guardiandayphone,GuardianEmail,Parent_email,SchoolID)";
		return array(
			'drop' => $drop,
			'create' => $create,
			'import' => $import
		);
	}

	protected function queryTempSectionTableCreate() {
        $tableName = 'temp_powerschool_section_'.$this->uniqueIdentifier;
		$drop = "DROP TABLE IF EXISTS {$tableName}";
		$create =" CREATE TABLE {$tableName} ("
				. " ID VARCHAR(30),"
				. " Teacher VARCHAR(30),"
				. " Section_Number VARCHAR(40),"
				. " Course_Number VARCHAR(40),"
				. " TermID VARCHAR(2),"
				. " Room VARCHAR(2),"
				. " SchoolID VARCHAR(30),"
				. " MoodleID VARCHAR(255),"
				. " LMS_Code VARCHAR(255),"
                . " processID INT(7) DEFAULT NULL,"
				. " PRIMARY KEY(ID),"
                . " INDEX `processID` (`processID`),"
                . " INDEX `SchoolID` (`SchoolID`)"
			. " )";
		$import = "LOAD DATA LOCAL INFILE ':filePath' INTO TABLE {$tableName}"
			. " FIELDS TERMINATED BY '~' OPTIONALLY ENCLOSED BY '\"'"
			. " LINES TERMINATED BY '\n'"
			. " IGNORE 1 LINES"
			. " (Section_Number,Teacher,Course_Number,ID,TermID,Room,SchoolID,MoodleID,LMS_Code)";
		return array(
			'drop' => $drop,
			'create' => $create,
			'import' => $import
		);
	}

	protected function queryTempTeacherableCreate() {
        $tableName = 'temp_powerschool_teacher_'.$this->uniqueIdentifier;
		$drop = "DROP TABLE IF EXISTS {$tableName}";
		$create = " CREATE TABLE {$tableName} ("
				. " ID VARCHAR(30),"
				. " First_Name VARCHAR(60),"
				. " Last_Name VARCHAR(60),"
				. " Email_Addr VARCHAR(60),"
				. " LoginID VARCHAR(60),"
				. " SchoolID VARCHAR(30),"
				. " TeacherLoginID VARCHAR(60),"
				. " Password VARCHAR(100),"
				. " Status VARCHAR(2),"
				. " StaffStatus VARCHAR(2),"
				. " HomeSchoolId VARCHAR(2),"
				. " PRIMARY KEY(ID),"
                . " INDEX `SchoolID` (`SchoolID`)"
			. " )";
		$import = "LOAD DATA LOCAL INFILE ':filePath' INTO TABLE {$tableName}"
			. " FIELDS TERMINATED BY '~' OPTIONALLY ENCLOSED BY '\"'"
			. " LINES TERMINATED BY '\n'"
			. " IGNORE 1 LINES"
			. " (First_Name,ID,Last_Name,Email_Addr,LoginID,Password,Status,StaffStatus,TeacherLoginID,HomeSchoolId,SchoolID)";
		return array(
			'drop' => $drop,
			'create' => $create,
			'import' => $import
		);
	}

	protected function queryDropTables(){
        return <<<SQL
		DROP TABLE IF EXISTS temp_powerschool_cc_{$this->uniqueIdentifier};
		DROP TABLE IF EXISTS temp_powerschool_course_{$this->uniqueIdentifier};
		DROP TABLE IF EXISTS temp_powerschool_section_{$this->uniqueIdentifier};
		DROP TABLE IF EXISTS temp_powerschool_student_{$this->uniqueIdentifier};
		DROP TABLE IF EXISTS temp_powerschool_teacher_{$this->uniqueIdentifier};
SQL;
    }
	protected  function queryDeleteUnncessaryStudents(){
		return <<<SQL
		DELETE users from temp_powerschool_student_{$this->uniqueIdentifier} tmp_users
		JOIN users on users.external_id = tmp_users.ID
		LEFT JOIN user_classes uc on users.id = uc.userid
		WHERE uc.id is null;
SQL;
	}

    protected function queryPruneTables(){
        return <<<SQL
		DELETE FROM temp_powerschool_cc_{$this->uniqueIdentifier} WHERE SchoolID != 120;
        DELETE FROM temp_powerschool_section_{$this->uniqueIdentifier} WHERE SchoolID != 120;
        DELETE FROM temp_powerschool_student_{$this->uniqueIdentifier} WHERE SchoolID != 120;
        DELETE FROM temp_powerschool_teacher_{$this->uniqueIdentifier} WHERE SchoolID != 120;
SQL;
    }

	protected function queryGetTemporaryDepartment(){
        return <<<SQL
		SELECT *
		FROM departments
		WHERE name LIKE 'Temporary' AND organizationid = :orgId;
SQL;
    }
	protected function queryInsertTemporaryDepartment(){
        return <<<SQL
		INSERT INTO departments (organizationid, name, subdomain, is_active)
		VALUES (:orgId, 'Temporary', 'Temporary', 1);
SQL;
    }
	protected function queryGetStudentsToInsert($limit){
        $limit = empty($limit) ? '' : 'LIMIT '.intval($limit);
        return <<<SQL
		SELECT student.*
		FROM (SELECT * FROM temp_powerschool_student_{$this->uniqueIdentifier} WHERE ExitDate < CURDATE() {$limit}) student
		INNER JOIN (SELECT * FROM temp_powerschool_cc_{$this->uniqueIdentifier}
			WHERE DateLeft > CURDATE()
				and DateEnrolled<=CURDATE()
				and SchoolID=120)  cc ON student.id = cc.StudentID
		GROUP BY student.ID
SQL;
/*
return <<<SQL
		SELECT student.*
		FROM (SELECT * FROM temp_powerschool_student_{$this->uniqueIdentifier} WHERE SchoolID = 120 and processID = {$this->processID} {$limit}) student
		INNER JOIN (SELECT * FROM temp_powerschool_cc_{$this->uniqueIdentifier} WHERE SchoolID = 120 AND DateLeft > CURDATE()) cc ON student.id = cc.StudentID
		GROUP BY student.ID
SQL;*/
		// 120 = Sequoia Choice
    }

    public function lockStudents($limit){
        $limit = empty($limit) ? '' : 'LIMIT '.intval($limit);
        // $limit = intval($limit)
      //  $limit = empty($limit) ? '' : "`MAX+1` BETWEEN `MAX+1` AND `MAX+$limit`";

        $query = "UPDATE temp_powerschool_student_{$this->uniqueIdentifier} SET processID = {$this->processID} WHERE SchoolID = 120 {$limit}";
       // echo $query."\r\n";
        return $this->util->executeUpdate(
			$query
		);
    }

    public function deleteStudents(){

        $query = "DELETE FROM temp_powerschool_student_{$this->uniqueIdentifier} WHERE processID = {$this->processID}";

        return $this->util->executeUpdate(
			$query
		);
    }

	protected static $queryGetUserByEmail = <<<SQL
		SELECT *
		FROM users
		WHERE email = :email limit 1;
SQL;
	protected static $queryGetAdvisorByEmail = <<<SQL
		SELECT u.*,
		if(uo.userid or us.user_id or uc.userid,1,0) as other_role
		FROM users u
		LEFT JOIN user_admin_organizations uo ON uo.userid = u.id
		LEFT JOIN user_admin_super us ON us.user_id = u.id
		LEFT JOIN user_classes uc ON uc.userid = u.id
		WHERE email REGEXP :email
		GROUP BY u.id limit 1;
SQL;
	protected static $queryGetClassByLmsId = <<<SQL
		SELECT *
		FROM classes
		WHERE LMS_id = :lmsId limit 1;
SQL;
	protected static $queryGetClassByExternalId = <<<SQL
		SELECT *
		FROM classes
		WHERE external_course_id = :external_id limit 1;
SQL;
	protected static $queryUpdateClassByLmsId = <<<SQL
		UPDATE classes
		SET name = :name
		WHERE LMS_id = :lmsId;
SQL;
	protected static $queryUpdateUser = <<<SQL
		UPDATE users
		SET fname = :fname, lname=:lname, email=:email,organizationid=:organizationid,password=:password,track_attendance=:track_attendance
		WHERE id = :id;
SQL;



	protected static $queryGetUserFromExternalId = <<<SQL
		SELECT *
		FROM users
		WHERE organizationid = :orgId AND external_id = :externalId limit 1;
SQL;

	protected static $queryAssignChildToGuardian = <<<SQL
		INSERT INTO temp_user_guardians (userid, userchildid,can_enter_attendance)
		VALUES (:guardianId, :studentId,:can_enter_attendance)
		ON DUPLICATE KEY UPDATE userid = values(userid), can_enter_attendance = values(can_enter_attendance);
SQL;
	protected static $queryUpdateEnrollment = <<<SQL
		UPDATE IGNORE user_classes SET created=:enrollmentDate WHERE id = :id;
SQL;

	protected static $queryAssignStudentToAdvisor = <<<SQL
		INSERT INTO temp_user_advisors (userid, studentid)
		VALUES (:advisorId, :studentId)
		ON DUPLICATE KEY UPDATE userid = userid;
SQL;

	protected static $queryInsertUser = <<<SQL
		INSERT INTO users (organizationid, fname, lname, email, phone, password, salt_for_password, external_id,created_by)
		VALUES (:organizationid, :fname, :lname, :email, :phone, :password, :salt_for_password,:external_id,:createdBy)
		ON DUPLICATE KEY UPDATE
			organizationid = :organizationid,
			fname = :fname,
			lname = :lname,
			email = :email,
			phone = :phone,
			external_id = :external_id,
			created_by=:createdBy
SQL;

	protected function queryGetClassesToInsert($limit){
        $limit = empty($limit) ? '' : 'LIMIT '.intval($limit);
        return <<<SQL
		SELECT section.*, section.MoodleID AS name, course.ID AS CourseID, course.Course_Name
		FROM (SELECT * FROM temp_powerschool_section_{$this->uniqueIdentifier} WHERE SchoolID = 120 AND NOT LMS_Code = '' {$limit}) section
		INNER JOIN temp_powerschool_course_{$this->uniqueIdentifier} course ON course.Course_Number = section.Course_Number
		WHERE section.LMS_Code NOT IN (
			SELECT cl.LMS_id
			FROM classes cl
			INNER JOIN courses c ON c.id = cl.courseid
			INNER JOIN departments d ON d.id = c.departmentid
			WHERE d.organizationid = :orgId AND NOT cl.LMS_id IS NULL);
SQL;
/*return <<<SQL
		SELECT section.*, section.MoodleID AS name, course.ID AS CourseID, course.Course_Name
		FROM (SELECT * FROM temp_powerschool_section_{$this->uniqueIdentifier} WHERE SchoolID = 120 AND NOT LMS_Code = '' AND NOT MoodleID = '' AND processID = {$this->processID} {$limit}) section
		INNER JOIN temp_powerschool_course_{$this->uniqueIdentifier} course ON course.Course_Number = section.Course_Number
		WHERE section.LMS_Code NOT IN (
			SELECT cl.LMS_id
			FROM classes cl
			INNER JOIN courses c ON c.id = cl.courseid
			INNER JOIN departments d ON d.id = c.departmentid
			WHERE d.organizationid = :orgId AND NOT cl.LMS_id IS NULL);
SQL;*/
    }
		// 120 = Sequoia Choice
    public function lockClasses($limit){
        $limit = empty($limit) ? '' : 'LIMIT '.intval($limit);

        $query = "UPDATE temp_powerschool_section_{$this->uniqueIdentifier} SET processID = {$this->processID} {$limit}";
       // echo $query."\r\n";
        return $this->util->executeUpdate(
			$query
		);
    }

    public function deleteClasses(){

        $query = "DELETE FROM temp_powerschool_section_{$this->uniqueIdentifier} WHERE SchoolID = 120 AND processID = {$this->processID}";

        return $this->util->executeUpdate(
			$query
		);
    }



	protected static $queryInsertCourse = <<<SQL
		INSERT INTO courses (departmentid, name, description,is_active)
		VALUES (:departmentid, :name, '',:is_active)
		ON DUPLICATE KEY UPDATE departmentid = departmentid;
SQL;

	protected static $queryGetCourseIdFromDeptAndName = <<<SQL
		SELECT id
		FROM courses
		WHERE departmentid = :departmentid AND name = :name;
SQL;

	protected static $queryInsertClass = <<<SQL
		INSERT INTO classes (courseid, name, LMS_id, external_course_id,show_final_grade)
		VALUES (:courseid, :name, :LMS_id, :external_course_id,'1')
		ON DUPLICATE KEY UPDATE courseid = courseid;
SQL;

	protected static $queryInsertSectionID = <<<SQL
		INSERT INTO sections_LMS_id (LMS_id, section_id)
		VALUES (:LMS_id, :sectionID)
		ON DUPLICATE KEY UPDATE LMS_id = LMS_id;
SQL;

	protected static $queryGetTeacherByExternalId = <<<SQL
		SELECT *
		FROM users
		WHERE external_id = :externalId AND organizationid = :orgId;
SQL;

	protected function queryGetTeacherByExternalEmail(){
        return <<<SQL
		SELECT *
		FROM users
		WHERE email IN (SELECT Email_Addr FROM temp_powerschool_teacher_{$this->uniqueIdentifier} WHERE ID = :externalId);
SQL;
    }

	protected function queryGetTeacherFromTemp(){
       return <<<SQL
		SELECT *
		FROM temp_powerschool_teacher_{$this->uniqueIdentifier}
		WHERE ID = :id;
SQL;
    }

	protected static $queryAssignTeacherToClass = <<<SQL
		INSERT INTO user_classes (userid, classid, is_teacher, is_edit_teacher)
		VALUES (:teacherId, :classId, 1, 1)
		ON DUPLICATE KEY UPDATE userid = userid;
SQL;
	public static $queryGetUserClassesData = <<<SQL
	SELECT * FROM user_classes WHERE userid=:userId and classid=:classId
SQL;
	public static $queryGetUserAttendanceClassesData = <<<SQL
	SELECT * FROM user_attendance_only_classes WHERE userid=:userId and classid=:classId
SQL;
	protected static $queryUpdateUserClassesData = <<<SQL
	UPDATE IGNORE user_classes SET created = :created,date_left = :date_left WHERE userid=:userId and classid=:classId
SQL;
	protected static $queryAssignStudentToClass = 
<<<SQL
INSERT INTO user_classes (userid, classid, created, is_student,date_left,manual_start_date)
values (:userId,:classId,:enrolled,1,:date_left,:manual_start_date)
ON DUPLICATE KEY UPDATE created = values(created),date_left = values(date_left)
;
SQL;

/*
	<<<SQL
		INSERT INTO user_classes (userid, classid, created, is_student)
		VALUES (:userId, :classId, :enrolled, 1)
		ON DUPLICATE KEY UPDATE created = :enrolled;
SQL;
*/
	protected static $queryCreateDefaultUserPreferences = <<<SQL
		INSERT INTO user_preferences (user_id, preference, value)
		VALUES (:userId, 'language', 'en')
		ON DUPLICATE KEY UPDATE value = value;
SQL;
	private  $clearAdvisorsTable = <<<SQL
	DELETE user_advisors FROM user_advisors
		JOIN users on users.id = user_advisors.studentid
		WHERE users.organizationid = :orgId
SQL;

	private  $clearGuardiansTable = <<<SQL
	DELETE user_guardians FROM user_guardians
		JOIN users on users.id = user_guardians.userchildid
		WHERE users.organizationid = :orgId
SQL;
    protected static $queryMoveUserGuardians = <<<SQL
		INSERT INTO user_guardians (userid, userchildid,can_enter_attendance)
		select userid, userchildid,can_enter_attendance from temp_user_guardians
		ON DUPLICATE KEY UPDATE userid = values(userid), can_enter_attendance = values(can_enter_attendance);
SQL;
    protected static $queryMoveUserAdvisors = <<<SQL
		INSERT INTO user_advisors (userid, studentid)
		select userid, studentid from temp_user_advisors
		ON DUPLICATE KEY UPDATE userid = values(userid);
SQL;


	protected function queryGetTempEnrollments($limit){
        $limit = empty($limit) ? '' : 'LIMIT '.intval($limit);
        return <<<SQL
		SELECT cc.*, c.id AS classId
		FROM temp_powerschool_cc_{$this->uniqueIdentifier} cc
		INNER JOIN sections_LMS_id s ON s.section_id = cc.SectionID
		INNER JOIN classes c ON c.LMS_id = s.LMS_id
        ;
SQL;

/*return <<<SQL
		SELECT cc.*, c.id AS classId
		FROM temp_powerschool_cc_{$this->uniqueIdentifier} cc
		INNER JOIN sections_LMS_id s ON s.section_id = cc.SectionID
		INNER JOIN classes c ON c.LMS_id = s.LMS_id
        WHERE cc.processID = {$this->processID};
SQL;
*/

    }

    public function lockTempEnrollments($limit){
        $limit = empty($limit) ? '' : 'LIMIT '.intval($limit);

        $query = "UPDATE temp_powerschool_cc_{$this->uniqueIdentifier}  SET processID = {$this->processID} {$limit}";
      //  echo $query."\r\n";
        return $this->util->executeUpdate(
			$query
		);
    }

    public function deleteTempEnrollments(){

        $query = "DELETE FROM temp_powerschool_cc_{$this->uniqueIdentifier} WHERE processID = {$this->processID}";

        return $this->util->executeUpdate(
			$query
		);
    }

}
