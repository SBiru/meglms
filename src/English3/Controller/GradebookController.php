<?php

namespace English3\Controller;

use English3\Controller\Gradebook\GradebookCategories;
use English3\Controller\Gradebook\GradebookCategoriesCalculator;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\ProficiencyTest\Mailer\EmailCompletedTest;
use English3\Controller\ProficiencyTest\Mailer\EmailGradeFinishedTest;
use English3\Controller\Reports\GradebookGradesStyleExporter;
use English3\Controller\Reports\SendReportsToUsers\ProgressReportSender;
use English3\Controller\Reports\StudentProgressReport;
use Silex\Application;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;


class GradebookController {
    private static $util;
    private static $reader;
    private static $classCtrl;
    private static $rootUnitsReady;
    private static $lastUserId;
    private static $instante = null;
    public function __construct() {
        self::$queryGetGradebook = sprintf(self::$queryGetGradebookBase,'user_classes');
        self::$queryGetGradebookForRemovedStudents = sprintf(self::$queryGetGradebookBase,'user_classes_history');
        self::$queryGetProgressReport = sprintf(self::$queryGetProgressReportBase,'user_classes');
        self::$queryGetProgressReportInactive = sprintf(self::$queryGetProgressReportBase,'user_classes_history');
    }
    public static function getInstance(){
        if(!self::$instante){
            self::$instante = new self();
        }
        return self::$instante;
    }
    public static function getUtil(){
        if(!self::$util){
            self::$util = new Utility();
        }
        return self::$util;
    }
    public static function getClassCtrl(){
        if(!self::$classCtrl){
            self::$classCtrl = new ClassesController(self::getUtil()->reader);
        }
        return self::$classCtrl;
    }
    public function getForUser(Request $request,$userId){
        $util = self::getUtil();
        $util->calcLoggedIn();
        if($userId=='me'){
            $userId=$_SESSION['USER']['ID'];
        }
        return new JsonResponse(self::_getGradebookForUser($userId,@$_REQUEST['classId']));
    }
    public function get(Request $request,$classId){
        $util = self::getUtil();
        $originalCId = $classId;
        $groupId=false;
        if(strpos($classId,'-')!==false){
            $groupId=explode('-',$classId)[1];
            $classId=explode('-',$classId)[0];
        }
        $util->checkTeacher($classId);
        $classCtrl = self::getClassCtrl();

        $users = $classCtrl->getUsers($classId,false,null,null,false,false,$groupId);
        foreach($users['students'] as $student){
            $userId = $student['id'];
            $row = $util->fetchRow(self::$queryGetUserClassesData,['classId'=>$classId,'userId'=>$userId]);
            if(boolval($row['recalculate_due_dates'])){
                ClassesController::_calculateDueDates($userId,$classId,true);
            }
            if(boolval($row['recalculate_gradebook']) || !Utility::getInstance()->fetchOne("SELECT g.id from gradebook g join pages p on p.id = g.pageid join units u on u.id = p.unitid join classes c on c.courseid = u.courseid where g.userid = ? and c.id = ? limit 1",[$userId,$classId])){
                self::_recalculate($userId,null,$classId);
            }
        }
        $class=self::_get($classId,$groupId,boolval(@$_REQUEST['onlyRemoved']));
        if(!isset($class['id'])){
            if($request->query->has('forceCalculation') && !@$_REQUEST['term']){
                $this->recalculateClass($request,$classId);
                $class=self::_get($classId,$groupId,boolval($_REQUEST['onlyRemoved']));
            }
        }
        if($request->query->has('calculateAverage')){
            self::_calculateAverage($class);
        }

        $orgId = OrganizationController::_getOrgFromClassId($classId);
        $class['useCategories'] = boolval(OrganizationController::_getField($orgId,'enable_gradebook_categories'));
        $class['isJ1'] = boolval(ClassesController::isJ1($classId));
        $class['enableCreditedAssignments'] = boolval(OrganizationController::_getField($orgId,'enable_credited_assignments'));
        return new JsonResponse($class);


    }
    public function getProgressReportForUser(Request $request,$userId){

        $util = self::getUtil();
        $util->calcLoggedIn();
        if($userId=='me'){
            $userId=$_SESSION['USER']['ID'];
        }
        $studentReport = new StudentProgressReport($userId,$request->query->all());
        $includeInactive = boolval($request->get('includeInactive')) && $request->get('includeInactive')!=='false';
        return new JsonResponse($includeInactive?$studentReport->getProgressForAllClasses():$studentReport->getProgressForActiveClasses());
    }
    public function getProgressReportForUserClass(Request $request,$classId,$userId){
        $util = self::getUtil();
        $util->calcLoggedIn();
        if($userId=='me'){
            $userId=$_SESSION['USER']['ID'];
        }
        $studentReport = new StudentProgressReport($userId);

        return new JsonResponse($studentReport->getProgressForClass($classId));
    }

    public function getProgressReport(Request $request,$classId){
        self::getInstance();
        $util = self::getUtil();
        $util->checkTeacher($classId);
        $classCtrl = self::getClassCtrl();

        Utility::clearPOSTParams($request);
        if($request->query->get('userId')){
            $userId = $request->query->get('userId');
        }
        $includeInactive = boolval($request->get('includeInactive'));
        $class = $classCtrl->wrapClassObject($classCtrl::_getClass($classId),true,false,null,null,false,$includeInactive);
        $students = array();
        foreach($class['users']['students'] as &$student){
            if(!is_null(@$_REQUEST['groupId']) && $student['groupId']!=@$_REQUEST['groupId']){
                continue;
            }
            if(!is_null(@$_REQUEST['siteId']) &&
                SiteController::_getUserSite($student['id'])!=$_REQUEST['siteId']){
                continue;
            }
            if(!is_null(@$_REQUEST['studentId']) &&
               $student['id']!=$_REQUEST['studentId']){
                continue;
            }
            $student = array_merge(
                self::_getProgressReport($classId,$student['id'],@$_REQUEST['groupId'],$student['isActive']),
                $student
            );
            $students[]=$student;
        }

        $class['users']['students']=$students;
        return new JsonResponse($class);


    }
    public function getHistoryProgressReportCsv(Request $request, Application $app,$id,$date){
        GLOBAL $PATHS;
        $classCtrl = self::getClassCtrl();
        $class = $classCtrl->wrapClassObject($classCtrl::_getClass($id,false));
        $result = $this->progressReportHeader($class);
        $report = self::_getClassProgressReportForDate($id,$date);
        foreach($report as &$student){


            $result .= $student['lname'] . '. ' . $student['fname'];
            $result .= ',' . $student['percCompletedScore'];
            $result .= ',' . $student['letterCompletedScore'];
            $result .= ',' . $student['percExpectedOrCompletedScore'];
            $result .= ',' . $student['letterExpectedOrCompletedScore'];
            $result .= ',' . $student['percExpectedTasks'];
            $result .= ',' . $student['completedTasks'];
            $result .= ',' . $student['enrollmentDate'];
            $result .= ',' . $student['expectedEndDate'];
            $result .= ',' . $student['projectedEndDate'];
            $result .= ',' . $student['finalGrade'] . "\r\n";
        }



        return $this->buildFileResponse($result,'progress_report_'.$class['name'].'_'.$date.'.csv');
    }
    private function buildFileResponse($content,$filename){
        $headers = array(
            'Content-Description'=>'File Transfer',
            'Content-Type'=>'application/octet-stream',
#            'Content-Disposition'=> 'attachment, filename=S3S.cfg',
            'Content-Length'=> ''.strlen($content),
            'Cache-Control'=> 'must-revalidate, post-check=0, pre-check=0',
            'Expires'=> '0',
            'Pragma'=> 'public',
        );
        $response = new Response($content,200,$headers);
        $d = $response->headers->makeDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $filename
        );
        $response->headers->set('Content-Disposition', $d);
        return $response;
    }
    private function progressReportHeader($class){
        $result = $class['name'] . "\r\n";
        $result .= 'Student';
        $result .= ',Grade on Completed work (%)';
        $result .= ',Grade on Completed work (letter)';
        $result .= ',Current overall grade (%)';
        $result .= ',Current overall grade (letter)';
        $result .= ',Expected so far (%)';
        $result .= ',Completed so far (%)';
        $result .= ',Course start';
        $result .= ',Course end';
        $result .= ',Projected end date';
        $result .= ',Final Grade'. "\r\n";
        return $result;
    }
    public function getProgressReportCsv(Request $request, Application $app,$id){
        global $PATHS;
        $util = self::getUtil();
        $originalCId = $id;
        $groupId=false;

        if(strpos($id,'-')!==false){
            $groupId=explode('-',$id)[1];
            $id=explode('-',$id)[0];
        }
        $util->checkTeacher($id);
        $me = $util->me;

        $classCtrl = self::getClassCtrl();

        Utility::clearPOSTParams($request);
        if($request->query->get('userId')){
            $userId = $request->query->get('userId');
        }

        $class = $classCtrl->wrapClassObject($classCtrl::_getClass($id,false),true);

        ////////// HEADER ////////////////////////
        $result = $this->progressReportHeader($class);
        /////////////////////////////////////////

        foreach($class['users']['students'] as &$student){
            if(!$groupId&&$student)
            $student = array_merge(
                self::_getProgressReport($id,$student['id']),
                $student
            );

            $result .= $student['lastName'] . '. ' . $student['firstName'];
            $result .= ',' . $student['percCompletedScore'];
            $result .= ',' . $student['letterCompletedScore'];
            $result .= ',' . $student['percExpectedOrCompletedScore'];
            $result .= ',' . $student['letterExpectedOrCompletedScore'];
            $result .= ',' . $student['percExpectedTasks'];
            $result .= ',' . $student['completedTasks'];
            $result .= ',' . $student['enrollmentDate'];
            $result .= ',' . $student['expectedEndDate'];
            $result .= ',' . $student['projectedEndDate'];
            $result .= ',' . $student['finalGrade'] . "\r\n";
        }

        $orgfolder = substr(md5('org_' . $me->user->getOrgId()), -10, -5) . $me->user->getOrgId() . '/';
        $full_path = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $orgfolder;
        $classCtrl->checkcreatefolder($full_path);
        $userfolder = substr(md5('user_' .  $_SESSION['USER']['ID']),-11,-5).$_SESSION['USER']['ID'] . '/';
        $full_path .= $userfolder;
        $classCtrl->checkcreatefolder($full_path);
        $filename = 'grades-' . $class['name'] . '-' . date('d.m.Y') . '.csv';
        $full_path .= $filename;
        $targetFile = fopen($full_path, 'w');
        fwrite($targetFile, $result);
        fclose($targetFile);

        return $app->sendFile($full_path, 200, array('Content-type' => 'text/csv'), 'attachment');

    }
    public function sendReportToUsers(Request $request){
        Utility::clearPOSTParams($request);
        $studentReports = $request->request->get('studentReports');
        $toRoles = $request->request->get('toRoles');
        $orgId  = $request->request->get('orgId');
        $sender = new ProgressReportSender($orgId,$studentReports);
        foreach($toRoles as $role){
            if($role=='students'){
                $sender->emailStudents();
            }else if($role=='parents'){
                $sender->emailParents();
            }
        }
        return new JsonResponse('ok');
    }
    public function downloadAsCsv(Request $request){
        Utility::clearPOSTParams($request);
        if($request->request->get('gradesStyle')){
            return $this->gradebookCsvGradesStyle($request);
        }
        $csv = '';

        foreach($request->request->get('data') as $subTable){
            $includeEmail = $this->includeEmail($subTable,$request->request->get('tables')!='classes');
            if($request->request->get('tables')!='classes'){
                $subTable['name']='"'.$subTable['lastName'].', '.$subTable['firstName'].'"';
                if($includeEmail){
                    $subTable['name'].=sprintf(',"%s"',$subTable['email']);
                }
            }
            $rows = $request->request->get('tables')=='classes'?$subTable['users']['students']:$subTable['classes'];

            $csv.=$this->csvSubTableHeader($subTable['name'],$request->request->get('tables'),$includeEmail);
            foreach($rows as $row){
                if($request->request->get('tables')=='classes'){
                    $row['name']= '"'.$row['lastName'].', '.$row['firstName'].'"';
                }
                $csv.=$this->csvSubTableRow($row,$request->request->get('tables')=='classes',$includeEmail);
            }
            $csv.="\r\n";
        }
        $filename = $request->request->get('filename').'_gradebook_'.date('Ymdhis').'.csv';
        return new JsonResponse(['content'=>$csv,'filename'=>$filename]);
    }
    private function includeEmail($subTable,$isClass){
        if($isClass){
            return 10!=Utility::getInstance()->fetchOne('SELECT d.organizationid FROM classes c join courses co on c.courseid = co.id join departments d on d.id = co.departmentid where c.id = :id',['id'=>$subTable['id']]);
        }else{
            return 10!=Utility::getInstance()->fetchOne('SELECT organizationid FROM users where id = :id',['id'=>$subTable['id']]);
        }
    }
    private function gradebookCsvGradesStyle(Request $request){
        $filename = $request->request->get('className').'_'.$request->request->get('studentName').'_grades_'.date('Ymdhis').'.csv';
        $csvCreator = new GradebookGradesStyleExporter($request);
        $csv = $csvCreator->createCsv();
        return new JsonResponse(['content'=>$csv,'filename'=>$filename]);
    }

    public function recalculateClass(Request $request,$classId){
        $util = self::getUtil();
        $util->checkTeacher($classId);
        $classCtrl = self::getClassCtrl();

        $userId = null;
        Utility::clearPOSTParams($request);
        if($request->request->get('userId')){
            $userId = $request->request->get('userId');
        }

        if(!$userId){
            $users = $classCtrl->getUsers($classId);

            $util->insert(self::$queryClearGradebook,['classId'=>$classId]);
            $util->insert(self::$queryClearProgressReport,['classId'=>$classId]);

            foreach($users['students'] as $student){
                self::_recalculate($student['id'],null,$classId,true);
            }
            return new JsonResponse(self::_get($classId));
        }else{
            return new JsonResponse(self::_recalculate($userId,null,$classId,true));
        }

    }
    public static function _calculateAverage(&$class){
        $pageAverages = array();
        //$summaryAverages = array();
        foreach($class['students'] as $student){
            foreach($student['units'] as $unit){
                foreach($unit['pagegroups'] as $pagegroup){
                    foreach($pagegroup['pages'] as $page){
                        if($page['score']!=null && !$page['isExempt']){
                            if(!isset($pageAverages[$page['id']])){
                                $pageAverages[$page['id']]=array();
                            }
                            $pageAverages[$page['id']][]=$page['score'];
                        }
                    }
                }
            }
        }

        foreach($class['units'] as &$unit){
            foreach($unit['pagegroups'] as &$pagegroup){
                foreach($pagegroup['pages'] as &$page){
                    if(isset($pageAverages[$page['id']])){
                        $page['averagePoints']= round(array_sum($pageAverages[$page['id']])/count($pageAverages[$page['id']]),2);
                        $page['gradedStudents']=count($pageAverages[$page['id']]);
                    }
                }
            }
        }
    }
    public static function _setRecalculateDueDates($classId,$userId){
        $util = self::getUtil();
        $util->reader->update(
            'user_classes',
            ['recalculate_due_dates'=>1],
            [
                'userid'=>$userId,
                'classid'=>$classId
            ]
        );
        self::_setRecalculateGradebook($classId,$userId);
    }
    public static function _setRecalculateGradebook($classId,$userId){
        $util = self::getUtil();
        $util->reader->update(
            'user_classes',
            ['recalculate_gradebook'=>1],
            [
                'userid'=>$userId,
                'classid'=>$classId
            ]
        );
        self::_recalculate($userId,null,$classId,true);
    }

    /**
     * @param $userId
     * @param null $classId
     * @return array
     */
    public function _getGradebookForUser($userId,$classId=null){
        $util = self::getUtil();
        $user = UserController::byId($util->reader,$userId,boolval(@$_REQUEST['includeInactive']),!boolval(@$_REQUEST['onlyRemoved']));
        if($classId){
            $user->classes = array_filter($user->classes,function($c) use($classId){
                return $c['id']==$classId;
            });
        }
        foreach($user->classes as $class){
            $classId = $class['id'];
            $row = $util->fetchRow(self::$queryGetUserClassesData,['classId'=>$classId,'userId'=>$userId]);
            if(boolval($row['recalculate_due_dates'])){
                ClassesController::_calculateDueDates($userId,$classId,true);
            }
            if(boolval($row['recalculate_gradebook'])){
                self::_recalculate($userId,null,$classId);
            }
        }
        $query = static::$queryGetGradebookForUser;
        $student = array(
            'id'=>$userId,
            'fname'=>$user->user->getFirstName(),
            'lname'=>$user->user->getLastName(),
            'email'=>$user->user->getEmail(),
            'classes'=>$user->classes
        );
        foreach($student['classes'] as $i=>&$class){
            if(!$class['isStudent']){
                unset($student['classes'][$i]);
                continue;
            }
            $class['show_grades_as_score'] = intval($class['showGradesAsScore']);
            $class['show_grades_as_percentage'] = intval($class['showGradesAsPercentage']);
            $class['show_grades_as_letter'] = intval($class['showGradesAsLetter']);
            $class['show_grades'] = intval($class['showGrades']);
            $class['show_dates'] = intval($class['showDates']);
            $class['class_id'] = $class['id'];
            $data = $util->fetch($query,['userId'=>$userId,'classId'=>$class['id']]);
            if(count($data)){
                $class['isSuspended']=boolval($data[0]['is_suspended']);
            }
            $class['units']=array();
            $class['superunits']=array();

            foreach($data as $row){
                $this->_makeUnit($class['units'],$row,true,$class['superunits']);
            }
            if(!count($class['units']))
            {
                unset($student['classes'][$i]);
                continue;
            }
            $progressReport = self::_getProgressReport($class['id'],$userId,null,!$class['isWithdrawn']);
            $orgId = ClassesController::_getOrgId($util->reader,$class['id']);
            $orgFlags = OrganizationController::_get($orgId,false);
            $class['orgFlags']=$orgFlags;
            $class = array_merge($class,$progressReport);

            $class['hasCategories'] = GradebookCategories::hasCategories($class['id']);
            $class['enableCreditedAssignments'] = boolval(OrganizationController::_getField($orgId,'enable_credited_assignments'));
        }
        self::addActiveAndInactiveClassesCount($student);


        return $student;
    }
    private function classGradebookPaginator($query,$queryParams,$onlyRemoved=false){
        $result  = new \stdClass();
        if($limit = $_REQUEST['limit']){
            $page = @$_REQUEST['page']?:1;
            $term = @$_REQUEST['term']?:'';
            $queryParams['groupId']=$queryParams['groupId']?:null;
            if($onlyRemoved){
                $queryUsers = self::$queryInactiveStudents." and concat(fname,' ',lname) like '%$term%' order by lname,fname";
            }
            else if(boolval($_REQUEST['includeInactive'])){
                $queryUsers = str_replace('__term__',$term,self::$queryAllStudents);
            }else{
                $queryUsers = self::$queryActiveStudents." and concat(fname,' ',lname) like '%$term%' order by lname,fname";
            }
            $paginator = Utility::paginator($queryUsers ,$queryParams);
            $result = $paginator->getData($limit,$page);
            $userIds = implode(',',Utility::mapIds($result->data));
            $userIds = $userIds?:"0";
            $query = str_replace('JOIN users',"JOIN (select * from users where id in ($userIds)) users",$query);
        }
        $result->data = Utility::getInstance()->fetch($query,$queryParams);


        return $result;

    }
    public function _get($classId,$groupId=false,$onlyRemoved=false){
        $util = self::getUtil();
        $query = $onlyRemoved?self::$queryGetGradebookForRemovedStudents:self::$queryGetGradebook;
        $queryParams =['classId'=>$classId,'groupId'=>$groupId];
        $pagResult = $this->classGradebookPaginator($query,$queryParams,$onlyRemoved);
        $data = $pagResult->data;
        if($_REQUEST['includeInactive']){
            $pagResult = $this->classGradebookPaginator(self::$queryGetGradebookForRemovedStudents,$queryParams,false);
            foreach($pagResult->data as &$row){
                $row['isInactive'] = true;
            }
            $data = array_merge($data,$pagResult->data);
        }
        $class = null;
        self::$rootUnitsReady = false;
        $lastUserId = null;
        foreach($data as $row){
            if(!$class){
                $orgId = ClassesController::_getOrgId($util->reader,$row['classId']);
                $orgFlags = OrganizationController::_get($orgId,false);
                $class = array(
                    'id'=>$row['classId'],
                    'name'=>$row['className'],
                    'isJ1'=>boolval(@$row['isJ1']),
                    'students'=>array(),
                    'units'=>array(),
                    'orgFlags'=>$orgFlags
                );
            }
            if(!isset($class['students'][$row['userid']])){
                $class['students'][$row['userid']]=array(
                    'id'=>$row['userid'],
                    'firstName'=>$row['fname'],
                    'lastName'=>$row['lname'],
                    'email'=>$row['email'],
                    'groupName'=>@$row['groupName'],
                    'isSuspended'=>boolval($row['is_suspended']),
                    'hasCategories'=>GradebookCategories::hasCategories($class['id']),
                    'enableCreditedAssignments'=>boolval(OrganizationController::_getField($orgId,'enable_credited_assignments')),
                    'accountCreatedTime'=>strtotime($row['account_created']),
                    'units'=>array()
                );
                $progressReport = self::_getProgressReport($classId,$row['userid'],null,!$onlyRemoved && !$row['isInactive']);
                $class['students'][$row['userid']] = array_merge($progressReport,$class['students'][$row['userid']]);
            }
            $class['superunits'] = array();
            $isUnitReady = boolval(!is_null($lastUserId) && $lastUserId!=$row['userid']);
            $lastUserId=$row['userid'];
            $this->_makeUnit($class['units'],$row,false,$class['superunits'],$isUnitReady);
            $this->_makeUnit($class['students'][$row['userid']]['units'],$row,true);
        }
        $class['students']=array_values($class['students']);
        $class['id'] = $classId;
        if(@$pagResult->limit){
            $class['limit']=$pagResult->limit;
            $class['page']=$pagResult->page;
            $class['total']=$pagResult->total;
            $class['totalPages']=$pagResult->totalPages;
        }

        self::addActiveAndInactiveStudentCount($class,$groupId);
        return $class;
    }
    private static function addActiveAndInactiveStudentCount(&$class,$groupId){
        $inactiveStudentsCount = intval(Utility::getInstance()->fetchOne(self::$queryCountRemovedStudents,
            ['classId'=>$class['id'],'groupId'=>$groupId]));
        $activeStudentsCount = intval(Utility::getInstance()->fetchOne(self::$queryCountActiveStudents,
            ['classId'=>$class['id'],'groupId'=>$groupId]));
        $totalStudents = $inactiveStudentsCount + $activeStudentsCount;
        $class['activeStudentsCount']=$activeStudentsCount;
        $class['inactiveStudentsCount']=$inactiveStudentsCount;
        $class['totalStudentsCount']=$totalStudents;
    }
    private static function addActiveAndInactiveClassesCount(&$student){
        $inactiveClassesCount = intval(Utility::getInstance()->fetchOne(self::$queryCountRemovedClasses,
            ['userId'=>$student['id']]));
        $activeClassesCount = intval(Utility::getInstance()->fetchOne(self::$queryCountActiveClasses,
            ['userId'=>$student['id']]));
        $totalClasses = $inactiveClassesCount + $activeClassesCount;
        $student['activeClassesCount']=$activeClassesCount;
        $student['inactiveClassesCount']=$inactiveClassesCount;
        $student['totalClassesCount']=$totalClasses;
    }
    public static function _wrapProgressReport($data){
        $progressReport = array();
        foreach($data as $key=>$value){
            $newKey = preg_replace_callback('/_(.)/',function($matches) {
                return strtoupper($matches[1]);
            },$key);
            $progressReport[$newKey]=$value;
        }
        $progressReport['percCompletedScore']=floatval($progressReport['percCompletedScore']);
        $progressReport['percTotalScore']=floatval($progressReport['percTotalScore']);
        $progressReport['percExpectedOrCompletedScore']=floatval($progressReport['percExpectedOrCompletedScore']);
        $progressReport['percExpectedTasks']=floatval($progressReport['percExpectedTasks']);
        $progressReport['percCompletedTasks']=floatval($progressReport['percCompletedTasks']);
        $progressReport['percBehind']=floatval($progressReport['percExpectedTasks'])-floatval($progressReport['percCompletedTasks']);
        $progressReport['completedScore']=@$progressReport['completedScore']?:$progressReport['totalScore'];
        $progressReport['totalScoreIncludingNonDue']=@$progressReport['totalScoreIncludingNonDue']?:$progressReport['totalScore'];
        if($progressReport['organizationid']==10)
            $progressReport['showGradesAsLetter']=1;


        return $progressReport;
    }
    public static function _getClassProgressReportForDate($classId,$date){
        $util = self::getUtil();
        $data = $util->fetch(self::$queryGetProgressReport,[
            'classId'=>$classId,
            'date'=>$date
        ]);
        $report = array();
        foreach ($data as $row) {
            $report[] = self::_wrapProgressReport($row);
        }
        return $report;
    }
    public static function _getProgressReport($classId,$userId,$groupId=null,$active = true){
        GradebookController::getInstance();
        $util = self::getUtil();


        $row = $util->fetchRow(self::$queryGetUserClassesData,['classId'=>$classId,'userId'=>$userId]);
        if(boolval($row['recalculate_due_dates'])){
            ClassesController::_calculateDueDates($userId,$classId,true);
        }
        if(boolval($row['recalculate_gradebook'])){
            self::_recalculate($userId,null,$classId);
        }

        $data = $util->fetchRow($active?self::$queryGetProgressReport:self::$queryGetProgressReportInactive,[
            'classId'=>$classId,
            'userId'=>$userId,
            'groupId'=>$groupId
        ]);

        if(count($data)){
            $progressReport = self::_wrapProgressReport($data);
            $progressReport['hasNotLoggedIn'] = !UserActivityController::_hasAccessedClass($userId,$classId);
        }else{
            $progressReport = array();
        }
        return $progressReport;
    }

    public static function _recalculate($userId,$pageId,$classId=null,$recalcDueDates=false){
        $util = self::getUtil();

        if(!$classId){
            $classId = ClassesController::_getFromPage($util->reader,$pageId);
        }
        if($recalcDueDates){
            ClassesController::_calculateDueDates($userId,$classId,true);
        }
        $classCtrl = self::getClassCtrl();
        $rootUnits = ClassesController::_getUnitsByClassId($classId);
        $class = $classCtrl->wrapClassObject($classCtrl::_getClass($classId));
        $unitsAndGrades = $classCtrl->getStudentUnitsAndGrades($rootUnits,$classId,$userId,true);

        $classSummary = array();
        $units = array();
        foreach($unitsAndGrades as $key =>$value){
            if(is_numeric($key)){
                $units[]=$value;
            }else{
                $classSummary[$key]=$value;
            }
        }
        if(count($units)){
            self::_updateGradebook($units,$userId);

            self::_updateProgressReport($classSummary,$userId,$classId,$class['rubric'],$units);
        }
        $util->reader->update(
            'user_classes',
            ['recalculate_gradebook'=>0],
            [
                'userid'=>$userId,
                'classid'=>$classId
            ]
        );

        $classSummary['units']=$units;
        return $classSummary;

    }
    private static function _updateGradebook($units,$userId){
        $util = self::getUtil();
        $values = array();
        foreach($units as $unit){
            foreach($unit['pagegroups'] as $pageGroup){
                foreach($pageGroup['pages'] as $page){
                    if($page['layout']=='QUIZ'){
                        $page['score'] = isset($page['scoreOverride'])?(@$page['overrideDeleted']?null:$page['scoreOverride']):$page['score'];
                    }

                    $values[]=array(
                        'userid'=>$userId,
                        'pageid'=>$page['id'],
                        'post_feedback_id'=>isset($page['exemptedBy'])?null:$page['post_feedback_id'],
                        'score' => $page['score'],
                        'max_score'=>$page['maxScore'],
                        'is_exempt'=>isset($page['exemptedBy']),
                        'is_credited'=>boolval(@$page['isCredited']),
                        'is_score_override'=>isset($page['scoreOverride']),
                        'has_quiz_feedback'=>$page['has_quiz_feedback'],
                        'due_date'=>boolval(@$page['no_due_date'])&&$page['organizationid']!=10?null:$page['due_date'],
                        'submitted_on'=>$page['submitted']
                    );
                }
            }
        }
        $query = self::queryInsertGradebookAssignment($values);

        if ($query)
        $util->insert($query);
    }
    private function _makeUnit(&$units,$row,$isStudent=false,&$superunits = array(),$isUnitReady=false){
        if(count($units)){
            end($units);
            $lastUnit = &$units[key($units)];
        }else{
            $lastUnit=null;
        }
        if((($lastUnit && intval($lastUnit['position'])>intval($row['unitPosition']))) || $isUnitReady ){
            self::$rootUnitsReady=true;
        }
        if(self::$rootUnitsReady && !$isStudent){
            return;
        }
        if($isStudent){
            $page = array(
                'id'=>$row['pageid'],
                'name'=>$row['pageName'],
                'score'=>$row['score'],
                'maxScore'=>$row['max_score'],
                'rubricId'=>$row['rubricid'],
                'isScoreOverride'=>boolval($row['is_score_override']),
                'postFeedbackId'=>$row['post_feedback_id'],
                'hasQuizFeedback'=>boolval($row['has_quiz_feedback']),
                'hasUngradedPost'=>boolval(@$row['hasUngradedPost']),
                'needingGrade'=>(boolval(@$row['hasUngradedPost']) && $row['score']===null) || boolval(@$row['quiz_needing_grade']),
                'isExempt'=>boolval($row['is_exempt']),
                'isCredited'=>boolval($row['is_credited']),
                'defaultExemptPoints'=>@$row['defaultExemptPoints']?:95,
                'due_date'=>boolval(@$row['no_due_date'])&&$row['organizationid']!=10?null:$row['due_date'],
                'calculated_due_date'=>@$row['calculated_due_date'],
                'manual_due_date'=>@$row['manual_due_date'],
                'modifiedOn'=>$row['modified_on'],
                'submittedOn'=>$row['submitted_on'],
                'minimum_score_for_completion'=>$row['minimum_score_for_completion'],
                'layout'=>$row['layout'],
                'lesson_duration'=>floatval(@$row['page_duration'])?:floatval(@$row['lesson_duration']),
                'requireSubmission'=>$row['layout']!='CONTENT'||$row['allow_text_post']||$row['allow_video_post']||$row['allow_upload_post']||$row['allow_upload_only_post']||$row['allow_template_post']
            );
        } else{
            $page = array(
                'id'=>$row['pageid'],
                'name'=>$row['pageName'],
                'lesson_duration'=>floatval($row['lesson_duration']),
                'layout'=>strtolower($row['layout']),
                'requireSubmission'=>$row['layout']!='CONTENT'||$row['allow_text_post']||$row['allow_video_post']||$row['allow_upload_post']||$row['allow_upload_only_post']||$row['allow_template_post'],
                'rubricId'=>$row['rubricid'],
                'maxScore'=>$row['max_score'],
                'historical_avg_score'=>$row['historical_avg_score']?round(floatval($row['historical_avg_score']),2):null,
                'historical_avg_studentCount'=>$row['historical_avg_studentCount']?intval($row['historical_avg_studentCount']):0,
                'category_id'=>@$row['category_id']

            );
        }



        if(!$lastUnit || !isset($lastUnit['id']) || $lastUnit['id']!=$row['unitId']){
            $units[] = array(
                'id'=>$row['unitId'],
                'description'=>$row['unitName'],
                'position'=>$row['unitPosition'],
                'pagegroups'=>array()
            );
            end($units);
            $lastUnit = &$units[key($units)];
            if(@$row['superUnitPosition']){
                Utility::addToObjectIfNotExists($row['superUnitPosition'],[
                    'position'=>$row['superUnitPosition'],
                    'name' => $row['superUnitName'],
                    'units'=>array()
                ],$superunits);
                $superunits[$row['superUnitPosition']]['units'][]=count($units)-1; //units are indexed by unit index in the units array
            }
        }
        if($row['pGroupId']){
            $pageGroups = &$lastUnit['pagegroups'];
            if(count($pageGroups)){
                end($pageGroups);
                $lastPG = &$pageGroups[key($pageGroups)];
            }else{
                $lastPG=null;
            }

            if(is_null($lastPG) || !isset($lastPG['id'])||$lastPG['id']!=$row['pGroupId']){
                $pageGroups[]=array(
                    'id'=>$row['pGroupId'],
                    'name'=>$row['pGroupName'],
                    'pages'=>array()
                );
            }
            end($pageGroups);
            $lastPG = &$pageGroups[key($pageGroups)];
            $lastPG['pages'][]= $page;

        }else{
            $lastUnit['pagegroups'][]=array(
                'id'=>null,
                'name'=>null,
                'pages'=>array($page)
            );
        }

    }
    private static function _updateProgressReport($classSummary,$userId,$classId,$rubric=null,$units){
        $util = self::getUtil();
        $orgId = OrganizationController::_getOrgFromClassId($classId);
        if(OrganizationController::isGradebookCategoriesEnabled($orgId)){
            $categoriesCalculator = new GradebookCategoriesCalculator($units,$classId,$userId);
            $categoriesCalculator->calculate();
            $categoriesCalculator->updateClassSummary($classSummary);
            $categoriesCalculator->save();
        }
        if($rubric){
            $classSummary['letter_completed_score'] = self::_getLetterGrade(intval(@$classSummary['percentPartial']),$rubric);
            $classSummary['letter_total_score'] = self::_getLetterGrade(intval(@$classSummary['percentComplete']),$rubric);
            $classSummary['letter_expected_or_completed_score'] = self::_getLetterGrade(intval(@$classSummary['percentCompletedOrDueScore']),$rubric);
        }

        $util->insert(self::$queryInsertProgressReport,[
            'userid'=>$userId,
             'classid'=>$classId,
             'total_tasks'=>@$classSummary['totalTasks'],
             'completed_tasks'=>@$classSummary['completedTasks'],
             'expected_tasks'=>@$classSummary['expectedTasks'],
             'perc_completed_tasks'=>@$classSummary['percentWorkedTasks'],
             'perc_expected_tasks'=>@$classSummary['percentExpectedTasks'],
             'total_score'=>@$classSummary['totalScore'],
             'total_max_score'=>@$classSummary['totalMaxScore'],
             'total_worked_score'=>@$classSummary['totalWorkedScore'],
             'letter_completed_score'=>@$classSummary['letter_completed_score'],
             'perc_completed_score'=>@$classSummary['percentPartial'],
             'letter_total_score'=>@$classSummary['letter_total_score'],
             'perc_total_score'=>@$classSummary['percentComplete'],
             'expected_end_date'=>@$classSummary['expectedEndDate'],
             'projected_end_date'=>@$classSummary['projectedEndDate'],
             'enrollment_date'=>@$classSummary['enrollmentDate'],
             'final_grade'=>@$classSummary['finalGrade'],
            'final_grade_letter'=>@$classSummary['final_grade_letter'],
            'letter_expected_or_completed_score'=>@$classSummary['letter_expected_or_completed_score'],
            'perc_expected_or_completed_score'=>@$classSummary['percentCompletedOrDueScore'],
            'total_expected_or_completed_score'=>@$classSummary['totalCompletedOrDueScore'],
            'total_score_including_non_due'=>@$classSummary['totalScoreIncludingNonDue']?:@$classSummary['totalScore'],
            'completed_score'=>@$classSummary['completedScore']?:@$classSummary['totalScore'],

        ]);
        if(@$classSummary['percentWorkedTasks']==100){
            self::sendProficiencyTestGradedEmailIfNeeded($userId,$classId);
        }
//        if(@$classSummary['percentSubmittedTasks']==100 && ClassesController::isJ1($classId)){
//            EmailCompletedTest::_studentCompletedTest($userId,$classId);
//        }
    }
    private static function sendProficiencyTestGradedEmailIfNeeded($userId,$classId){
        $isProficiencyTest = ClassesController::isProficiencyTest($classId);
        if($isProficiencyTest){
            EmailGradeFinishedTest::testGradeCompleted($userId,$classId);
        }
    }
    public static function _getLetterGrade($totalScore,$rubric){
        $letterGrade = 'F';
        if($totalScore > 0){
            // in this case, totalScore is a scalar representing a percentage
            $found = false;
            foreach($rubric as $letter){
                if($found) {
                    break;
                }
                if($letter['use'] && $totalScore >= $letter['min']) {
                    $letterGrade = $letter['gradeLetter'];
                    $found = true;
                }
            };
        }
        return $letterGrade;
    }
    private function csvSubTableHeader($name,$type='classes',$includeEmail){
        $result = $name . "\r\n";
        $result .= $type=='classes'?'Student':'Class';
        $result .= $type=='classes'&&$includeEmail?',Email':'';
        $result .= ',Grade on Completed work (%)';
        $result .= ',Grade on Completed work (letter)';
        $result .= ',Current overall grade (%)';
        $result .= ',Current overall grade (letter)';
        $result .= ',Expected so far (%)';
        $result .= ',Completed so far (%)';
        $result .= ',Course start';
        $result .= ',Course end';
        $result .= ',Projected end date';
        $result .= ',Final Grade'. "\r\n";
        return $result;
    }
    private function csvSubTableRow($entry,$isClass,$includeEmail){
        $result = $entry['name'];
        $result .= $isClass && $includeEmail?',' . $entry['email']:'';
        $result .= ',' . (@$entry['hasNotLoggedIn']?"Hasn't logged in":$entry['percCompletedScore']);
        $result .= ',' . (@$entry['hasNotLoggedIn']?"Hasn't logged in":$entry['letterCompletedScore']);
        $result .= ',' . $entry['percExpectedOrCompletedScore'];
        $result .= ',' . $entry['letterExpectedOrCompletedScore'];
        $result .= ',' . $entry['percExpectedTasks'];
        $result .= ',' . $entry['percCompletedTasks'];
        $result .= ',' . $entry['enrollmentDate'];
        $result .= ',' . $entry['expectedEndDate'];
        $result .= ',' . $entry['projectedEndDate'];
        $result .= ',' . $entry['finalGrade'] . "\r\n";
        return $result;
    }
    private static function queryInsertGradebookAssignment($values){
        if(!count($values))
            return;
        $header = implode(',',array_keys($values[0]));
        $queryValues = array();
        foreach($values as $rowValue){
            $row = array();
            foreach(array_values($rowValue) as $value){
                $row[]=!is_null($value)?"'{$value}'":'null';
            }
            $row = implode(",",array_values($row));
            $queryValues[]="({$row})";
        }
        $queryValues = implode(',',array_values($queryValues));

        return "
        INSERT INTO gradebook ({$header})
         VALUES {$queryValues}
        ON DUPLICATE KEY UPDATE
            post_feedback_id=VALUES(post_feedback_id),
            score=VALUES(score),
            max_score=VALUES(max_score),
            due_date=VALUES(due_date),
            is_exempt=VALUES(is_exempt),
            is_credited=VALUES(is_credited),
            is_score_override=VALUES(is_score_override),
            has_quiz_feedback=VALUES(has_quiz_feedback),
            modified_on=CURRENT_TIMESTAMP(),
            submitted_on=values(submitted_on)
        ";
    }


    private static $queryInsertProgressReport=<<<SQL
    INSERT INTO progress_report (userid, classid, total_tasks, completed_tasks, expected_tasks,
        perc_completed_tasks, perc_expected_tasks, total_score, total_max_score, total_worked_score,
        letter_completed_score, perc_completed_score, letter_total_score, perc_total_score,
        expected_end_date, projected_end_date,enrollment_date, final_grade, final_grade_letter,
        modified_on,letter_expected_or_completed_score,perc_expected_or_completed_score,total_expected_or_completed_score,total_score_including_non_due,
        completed_score)
    VALUES
    (:userid, :classid, :total_tasks, :completed_tasks, :expected_tasks, :perc_completed_tasks,
    :perc_expected_tasks, :total_score, :total_max_score, :total_worked_score, :letter_completed_score,
     :perc_completed_score, :letter_total_score, :perc_total_score, :expected_end_date,
     :projected_end_date,:enrollment_date, :final_grade, :final_grade_letter, CURRENT_TIMESTAMP(),
     :letter_expected_or_completed_score,:perc_expected_or_completed_score,:total_expected_or_completed_score,
     :total_score_including_non_due,:completed_score
     )
    ON DUPLICATE KEY UPDATE
    total_tasks=:total_tasks, completed_tasks=:completed_tasks, expected_tasks=:expected_tasks,
    perc_completed_tasks=:perc_completed_tasks, perc_expected_tasks=:perc_expected_tasks,
    total_score=:total_score, total_max_score=:total_max_score, total_worked_score=:total_worked_score,
    letter_completed_score=:letter_completed_score, perc_completed_score=:perc_completed_score,
    letter_total_score=:letter_total_score, perc_total_score=:perc_total_score,
    expected_end_date=:expected_end_date, projected_end_date=:projected_end_date, enrollment_date=:enrollment_date,
    final_grade=:final_grade, final_grade_letter=:final_grade_letter, modified_on=CURRENT_TIMESTAMP(),
    letter_expected_or_completed_score=:letter_expected_or_completed_score,perc_expected_or_completed_score=:perc_expected_or_completed_score,total_expected_or_completed_score=:total_expected_or_completed_score,
    total_score_including_non_due=:total_score_including_non_due,completed_score=:completed_score
SQL;
    public static $queryGetHistoryProgressReport=<<<SQL
    SELECT total_tasks,
            completed_tasks,
            expected_tasks,
            perc_completed_tasks,
            perc_expected_tasks,
            total_score,
            total_max_score,
            total_worked_score,
            letter_completed_score,
            perc_completed_score,
            letter_total_score,
            perc_total_score,
            expected_end_date,
            projected_end_date,
            enrollment_date,
            letter_expected_or_completed_score,
            perc_expected_or_completed_score,
            total_expected_or_completed_score,
            total_score_including_non_due,
            completed_score,
            c.show_grades_as_letter,
            u.organizationid,
            u.fname,
            u.lname,
            u.email,
            c.name
        FROM history_student_class h
         join classes c on c.id =h.class_id
         join users u on u.id = h.user_id
         WHERE h.class_id = :classId and h.date=:date
SQL;
    public static $queryGetProgressReport;
    public static $queryGetProgressReportInactive;
    private static $queryGetProgressReportBase=<<<SQL
    SELECT total_tasks,
            completed_tasks,
            expected_tasks,
            perc_completed_tasks,
            perc_expected_tasks,
            total_score,
            total_max_score,
            total_worked_score,
            letter_completed_score,
            perc_completed_score,
            letter_total_score,
            perc_total_score,
            expected_end_date,
            projected_end_date,
            enrollment_date,
            final_grade,
            final_grade_letter,
            modified_on,
            letter_expected_or_completed_score,
            perc_expected_or_completed_score,
            total_expected_or_completed_score,
            total_score_including_non_due,
            completed_score,
            c.show_grades_as_letter,
            u.organizationid
        FROM progress_report
         join classes c on c.id =progress_report.classid
         join users u on u.id = progress_report.userId
         join %s uc on uc.classid = c.id and uc.userid = u.id 
         WHERE progress_report.classid = :classId and u.id = :userId and (if(:groupId is null,1,uc.groupid=:groupId))
SQL;
    private static $queryGetGradebook;
    private static $queryGetGradebookForRemovedStudents;

    private static $queryCountRemovedStudents = <<<SQL
    select count(distinct g.userid)
    from gradebook g
    join pages p on p.id = g.pageid
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join user_classes_history uh on uh.classid = c.id and g.userid = uh.userid and uh.is_student = 1
    left join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
    where uc.id is null and c.id = :classId and  if(:groupId>0,uh.groupid=:groupId,1)
SQL;
    private static $queryCountRemovedClasses = <<<SQL
    select count(distinct c.id)
    from gradebook g
    join pages p on p.id = g.pageid
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join user_classes_history uh on uh.classid = c.id and g.userid = uh.userid and uh.is_student = 1
    left join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
    where uc.id is null and g.userid = :userId
SQL;
    private static $queryActiveStudents = <<<SQL
    select distinct g.userid as id
    from gradebook g
    join pages p on p.id = g.pageid
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
    join users on users.id = g.userid
    where c.id = :classId and  if(:groupId>0,uc.groupid=:groupId,1)
SQL;

    private static $queryCountActiveStudents = <<<SQL
    select  count(distinct g.userid)
    from gradebook g
    join pages p on p.id = g.pageid
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
    join users on users.id = g.userid
    where c.id = :classId and  if(:groupId>0,uc.groupid=:groupId,1)
SQL;

    private static $queryCountActiveClasses = <<<SQL
    select  count(distinct c.id)
    from gradebook g
    join pages p on p.id = g.pageid
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
    join users on users.id = g.userid
    where g.userid = :userId
SQL;
    private static $queryInactiveStudents = <<<SQL
    select distinct g.userid as id
    from gradebook g
    join pages p on p.id = g.pageid
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    join user_classes_history uh on uh.classid = c.id and g.userid = uh.userid and uh.is_student = 1
    left join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
    join users on users.id = g.userid
    where uc.id is null and c.id = :classId and  if(:groupId>0,uh.groupid=:groupId,1)
SQL;
    private static $queryAllStudents = <<<SQL
    select id from (select distinct g.userid as id,fname,lname
from gradebook g
  join pages p on p.id = g.pageid
  join units u on u.id = p.unitid
  join classes c on c.courseid = u.courseid
  join user_classes_history uh on uh.classid = c.id and g.userid = uh.userid and uh.is_student = 1
  left join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
  join users on users.id = g.userid
where
  uc.id is null and c.id = :classId and  if(:groupId>0,uh.groupid=:groupId,1) and concat(fname,' ',lname) like
                                                                                      '%__term__%'
union
select distinct g.userid  as id,fname,lname
from gradebook g
join pages p on p.id = g.pageid
join units u on u.id = p.unitid
join classes c on c.courseid = u.courseid
join user_classes uc on uc.classid = c.id and g.userid = uc.userid and uc.is_student = 1
join users on users.id = g.userid
where c.id = :classId and  if(:groupId>0,uc.groupid=:groupId,1) and concat(fname,' ',lname) like '%__term__%'  ) a
order by lname,
fname
SQL;


    protected static $queryGetGradebookBase=<<<SQL
    SELECT gradebook.*,
          u.id as unitId,
          u.name as unitPosition,
          u.description as unitName,
          u.created as account_created,
          p.name as pageName,
          p.position as pagePosition,
          p.lesson_duration,
          p.rubricid,
          p.layout,
          p.minimum_score_for_completion,
          p.allow_template_post,
          p.allow_text_post,
          p.allow_upload_post,
          p.allow_upload_only_post,
          p.allow_video_post,
          ca.no_due_date,
          cl.name as className,
          cl.id as classId,
          cl.default_exempt_points as defaultExemptPoints,
          cl.is_j1_class as isJ1,
          groups.name as groupName,
          pg.id as pGroupId,
          pg.name as pGroupName,
          users.fname,
          users.lname,
          users.email,
          users.organizationid,
          historical_avg.score as historical_avg_score,
          historical_avg.studentCount as historical_avg_studentCount,
          udd.due_date as calculated_due_date,
          udd.manual_due_date,
          udd.page_duration,
          uc.is_suspended,
          gcp.category_id,
          if(qr.quiz_response_id and (p.can_return <> 1 or qs.is_finished = 1),1,0) as quiz_needing_grade,
          CASE WHEN posts.id IS NULL
            THEN false ELSE true
            END AS hasUngradedPost
     FROM
     gradebook
     JOIN users ON users.id = gradebook.userid
     JOIN pages p ON gradebook.pageid = p.id
     LEFT JOIN
        (SELECT id, userid, pageid
         FROM posts
         WHERE id = postrootparentid and is_deleted = 0
            AND id NOT IN (
                SELECT post_reply_id FROM posts
                WHERE NOT id = postrootparentid 
            )
         order by posts.id DESC
        ) posts ON posts.pageid = gradebook.pageid AND posts.userid = gradebook.userid
     LEFT JOIN pages pg ON p.pagegroupid = pg.id
     LEFT JOIN quiz_scores qs on qs.user_id = gradebook.userid and qs.quiz_id = p.id
     LEFT JOIN quizzes q on q.id = p.quiz_id

    LEFT JOIN (select * from class_assignments group by page_id) ca ON p.id = ca.page_id
     JOIN units u ON u.id = p.unitid
     LEFT JOIN super_units su ON su.id = u.superunitid
     LEFT JOIN user_due_dates udd ON udd.pageid = p.id and udd.userid = users.id
     LEFT JOIN gradebook_category_pages gcp on gcp.page_id = p.id
     JOIN classes cl on cl.courseid = u.courseid
     JOIN %s uc ON gradebook.userid = uc.userid and uc.classid=cl.id
     left join groups ON uc.groupid = groups.id
     LEFT JOIN quiz_responses qr on qr.attempt_id = qs.attempt_id and qr.user_id = uc.userid and qr.quiz_id=p.id and qr.is_correct = -1
     JOIN (select avg(if(is_exempt,null,score)) as score,pageid,count(if(is_exempt,null,score)) as studentCount  FROM gradebook g join pages p on p.id = g.pageid join units u on u.id = p.unitid join classes c on c.courseid = u.courseid where c.id = :classId GROUP BY g.pageid)
          historical_avg ON historical_avg.pageid = p.id
     WHERE cl.id = :classId and uc.is_student=1 and if(:groupId,groupid=:groupId,1)
     GROUP BY gradebook.userid,gradebook.pageid
     ORDER BY userid,su.position,unitPosition,pagePosition
SQL;
    protected static $queryGetGradebookForUser=<<<SQL
    SELECT gradebook.*,
          u.id as unitId,
          u.name as unitPosition,
          u.description as unitName,
          p.name as pageName,
          p.position as pagePosition,
          p.lesson_duration,
          p.rubricid,
          p.layout,
          cl.name as className,
          cl.id as classId,
          cl.default_exempt_points as defaultExemptPoints,
          pg.id as pGroupId,
          pg.name as pGroupName,
          p.minimum_score_for_completion,
          p.allow_template_post,
          p.allow_text_post,
          p.allow_upload_post,
          p.allow_upload_only_post,
          p.allow_video_post,
          ca.no_due_date,
          su.name as superUnitName,
          su.position as superUnitPosition,
          if(qr.quiz_response_id and (p.can_return <> 1 or qs.is_finished  = 1),1,0) as quiz_needing_grade,
          users.organizationid,
          uc.is_suspended,
          CASE WHEN posts.id IS NULL
            THEN false ELSE true
            END AS hasUngradedPost
     FROM
     gradebook
     JOIN pages p ON gradebook.pageid = p.id
     LEFT JOIN pages pg ON p.pagegroupid = pg.id
     LEFT JOIN
        (SELECT id, userid, pageid
         FROM posts
         WHERE id = postrootparentid and is_deleted = 0
            AND id NOT IN (
                SELECT post_reply_id FROM posts
                WHERE NOT id = postrootparentid 
            )
         order by posts.id DESC
        ) posts ON posts.pageid = gradebook.pageid AND posts.userid = gradebook.userid
     LEFT JOIN (select * from class_assignments group by page_id) ca ON p.id = ca.page_id
     JOIN units u ON u.id = p.unitid
     JOIN users ON gradebook.userid = users.id
     JOIN classes cl on cl.courseid = u.courseid
     LEFT JOIN user_classes uc on uc.userid = gradebook.userid and uc.classid = cl.id
     LEFT JOIN super_units su ON su.id = u.superunitid
     LEFT JOIN quiz_scores qs on qs.user_id = gradebook.userid and qs.quiz_id = p.id
     LEFT JOIN quizzes q on q.id = p.quiz_id
     LEFT JOIN quiz_responses qr on qr.attempt_id = qs.attempt_id and qr.user_id = gradebook.userid and qr.quiz_id=p.id and qr.is_correct = -1
     WHERE gradebook.userid = :userId and cl.id = :classId
     GROUP BY userid,p.id
     ORDER BY userid,su.position,unitPosition,pagePosition
SQL;
    private static $queryClearGradebook=<<<SQL
    DELETE gradebook FROM gradebook
    JOIN pages p ON p.id = gradebook.pageid
    JOIN units u ON u.id = p.unitid
    JOIN classes c on c.courseid = u.courseid
    JOIN user_classes uc on c.id = uc.classid and gradebook.userid = uc.userid
    WHERE c.id = :classId
SQL;
    private static $queryClearProgressReport=<<<SQL
    DELETE progress_report FROM progress_report
     JOIN user_classes uc on progress_report.classid = uc.classid and progress_report.userid = uc.userid
     where progress_report.classid = :classId
SQL;
    private static $queryGetUserClassesData = <<<SQL
    select * from user_classes where userid=:userId and classid=:classId
SQL;


}


?>

