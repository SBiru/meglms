<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.5.7
 * Time: 08:30
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\Exports\E3PTReport\E3PTReport;
use English3\Controller\Exports\J1Certificate\J1Certificate;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\ProficiencyTest\Exporter\CsvExporter;
use English3\Controller\ProficiencyTest\Exporter\JsonExporter;
use English3\Controller\ProficiencyTest\Exporter\PdfExporter;
use English3\Controller\ProficiencyTest\Mailer\TemplateStudentReport;
use English3\Controller\Utility;
use English3\Model\User;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TestApi {
    public function get(Request $request,$studentId){
        $test = new StudentTest($_REQUEST['classId'],$studentId);
        return new JsonResponse($test->load());
    }
    public function all(Request $request,$studentId){
        if($studentId == 'me') $studentId=$_SESSION['USER']['ID'];
        $myTests = array();
        $attempts = TestAttempts::usersForUserId($studentId);
        foreach($attempts as $attempt){
            $studentId = $attempt['id'];
            $status = new TestStatus($studentId);
            $classes = $status->getClasses();
            foreach($classes as $class){
                $test = new StudentTest($class['id'],$studentId);
                $data = $test->load();
                $data['studentId'] = $studentId;
                $isPracticeTest = boolval(Utility::getInstance()->fetchOne('SELECT id FROM products WHERE practice_group_id = :id',['id'=>$data['groupId']]));
                if($data['testName'] && !$isPracticeTest){
                    $myTests[]=$data;
                }

            }
        }

        return new JsonResponse($myTests);
    }
    public function getSubmission(Request $request,$studentId){
        $type = $_REQUEST['type'];
        $page_layout = $_REQUEST['pageType'];
        $submissionId = $_REQUEST['submissionId'];
        $studentSubmission = new StudentSubmission($studentId,$type,$page_layout,$submissionId);
        return new JsonResponse($studentSubmission->load());
    }
    public function checkTestStatus(Request $request){
        $test = new TestStatus();
        return new JsonResponse($test->check());
    }
    public function getClasses(Request $request){
        $test = new TestStatus($_SESSION['USER']['ID']);
        $classes = $test->getClasses(true);
        return new JsonResponse($classes);
    }
    public function addTestAdmin(Request $request,$groupId,$userId){
        $testAdmin = new TestAdmin($groupId);
        $testAdmin->addAdmin($userId);
        return new JsonResponse(['ok']);
    }
    public function removeTestAdmin(Request $request,$groupId,$userId){
        $testAdmin = new TestAdmin($groupId);
        $testAdmin->removeAdmin($userId);
        return new JsonResponse(['ok']);
    }
    public static function isOnlyTestAdmin($userId){
        $checkAdmin = Utility::getInstance()->fetchRow(self::$queryCheckOnlyAdminRole,['userId'=>$userId]);
        return intval($checkAdmin['other_role'])==0 && intval($checkAdmin['admin'])>0;
    }
    public function export(Request $request){
        Utility::clearPOSTParams($request);
        $exporter = new PdfExporter();
        $imageData = json_decode($request->request->get('jsonData'),true);
        return $exporter->fromImageData($imageData);

    }
    public function exportClass(Request $r,$classId){
        Utility::clearPOSTParams($r);
        $exporter = new CsvExporter();
        $fileContent = $exporter->exportClass($classId,$r->request->get('data'));
        return new JsonResponse(['content'=>$fileContent,'filename'=>$exporter->exporter->fileName]);
    }

    public function exportE3PT(Request $r){
        $exporter = new JsonExporter($r->query->all());
        $data = $exporter->getE3PT();
        return Utility::buildFileResponse(json_encode($data,JSON_PRETTY_PRINT),'e3pt_export.json');
    }

    public function send(Request $request){
        Utility::clearPOSTParams($request);
        $test = new StudentTest($request->get('classId'),$request->get('userId'));

        $mailer = new TemplateShareResults($test->load(),
            $request->get('body'),
            $request->get('subject'),
            boolval($request->get('includeID')),
            boolval($request->get('includeVideo')),
            boolval($request->get('includeComments')),
            boolval($request->get('includeCertificate')),
            boolval($request->get('includeReport'))
        );
        $success = $mailer->send([['email'=>$request->get('to')]]);

        return new JsonResponse(['success'=>$success]);
    }

    private static  $queryCheckOnlyAdminRole = <<<SQL
    SELECT
  sum(if(pc.id is not null and (uc.is_student =1 or uc.is_edit_teacher = 1 or uc.is_teacher = 1 or uc.is_observer = 1),1,0)) as other_role,
  sum(if(pc.id is not null and (uc.is_test_admin = 1),1,0)) as admin
FROM user_classes uc
    JOIN classes c on c.id = uc.classid
  LEFT JOIN proficiency_classes pc ON pc.classid = uc.classid
WHERE uc.userid = :userId
group by uc.userid
SQL;


}

class TestStatus{
    private $status;
    private $userId;
    public function __construct($userId = null){
        $this->status = array();
        if(!$userId){
            $userId = $_SESSION['USER']['ID'];
        }
        $this->userId = $userId;

    }

    public function check(){
        $this->checkStatus();
        return $this->status;
    }
    private function checkStatus(){
        $this->status['available'] =boolval(count($this->getClasses()));
        if(!$this->status['available']) return;
        $this->status['roles'] = $this->myRoles();
        $this->status['used'] = boolval($this->status['roles']);
        $this->status['j1-available'] = $this->hasJ1Dashboard($this->status['roles']);
        $this->status['e3pt-available'] = $this->hasE3PTDashboard($this->status['roles']);
    }
    public function hasJ1Dashboard($roles){
        foreach($this->status['roles'] as $role){
            if($role === 'admin'){
                return true;
            }
        }
        if(Utility::getInstance()->fetchOne($this->queryIsJ1Teacher,['userId'=>$this->userId])){
            return true;
        }
        if(Utility::getInstance()->fetchOne($this->queryIsJ1Student,['userId'=>$this->userId])){
            return true;
        }
        return false;
    }
    public function hasE3PTDashboard($roles){
        if(array_search('admin',$this->status['roles']) !== false ){
            return true;
        }
        if(Utility::getInstance()->fetchOne($this->queryIsE3PTTeacher,['userId'=>$this->userId])){
            return true;
        }
        if(Utility::getInstance()->fetchOne($this->queryIsE3PTStudent,['userId'=>$this->userId])){
            return true;
        }
        return false;
    }
    public function getClasses($forTeacher=false){
        if(@$_REQUEST['asStudent']){
            $forTeacher = false;
        }
        $ctrl = new TestClasses($this->userId);
        return $ctrl->getAll($forTeacher);
    }
    private function myRoles(){
        if(Utility::getInstance()->checkAdmin(null,false,false)){
            return ['admin'];
        }
        $classRoles = Utility::getInstance()->fetch($this->queryGetProficiencyTestRole,['userId'=>$this->userId]);
        $myRoles = array();
        foreach($classRoles as $roles){
            if(boolval($roles['is_student'])) Utility::addToArrayIfNotExists('student',$myRoles);
            if(boolval($roles['is_teacher'])) Utility::addToArrayIfNotExists('teacher',$myRoles);
            if(boolval($roles['is_observer'])) Utility::addToArrayIfNotExists('observer',$myRoles);
            if(boolval($roles['is_test_admin'])) Utility::addToArrayIfNotExists('test_admin',$myRoles);
        }
        if(boolval(TestSchoolsAdmins::schoolAdmin($this->userId))){
            $myRoles['is_school_admin'] = true;
        }
        return $myRoles;
    }


    private $queryGetProficiencyTestRole = <<<SQL
    SELECT is_student,is_teacher,is_observer,is_test_admin FROM user_classes uc
    JOIN proficiency_classes pc ON pc.classid = uc.classid
    WHERE uc.userid = :userId
SQL;
    private $queryIsJ1Teacher = <<<SQL
    SELECT classid from user_classes uc
    join classes c on c.id = uc.classid
    where c.is_j1_class = 1 and (is_teacher = 1 or is_test_admin = 1) and userid = :userId limit 1
    
SQL;
    private $queryIsJ1Student = <<<SQL
    SELECT classid from user_classes uc
    join classes c on c.id = uc.classid
    where c.is_j1_class = 1 and is_student=1 and userid = :userId limit 1
    
SQL;
    private $queryIsE3PTTeacher = <<<SQL
    SELECT uc.classid from user_classes uc
    join classes c on c.id = uc.classid
    join proficiency_classes pc on pc.classid = c.id 
    where c.is_j1_class <> 1 and (is_teacher = 1 or is_test_admin = 1) and userid = :userId limit 1
    
SQL;
    private $queryIsE3PTStudent = <<<SQL
    SELECT uc.classid from user_classes uc
    join classes c on c.id = uc.classid
    join proficiency_classes pc on pc.classid = c.id 
    where (c.is_j1_class is null or c.is_j1_class <> 1) and is_student=1 and userid = :userId limit 1
    
SQL;


}
class StudentSubmission{
    private $studentId;
    private $type;
    private $pageType;
    private $submissionId;
    public function __construct($studentId,$type,$pageType,$submissionId){
        $this->studentId = $studentId;
        $this->type = $type;
        $this->pageType = $pageType;
        $this->submissionId = $submissionId;
    }
    public  function load(){
        if($this->pageType=='QUIZ'){
            return $this->getQuestionSubmission();
        }
        return $this->getPostSubmission();
    }
    private function getQuestionSubmission(){
        $questionResponse = Utility::getInstance()->fetchRow($this->queryGetQuestionSubmission,['questionId'=>$this->submissionId,'userId'=>$this->studentId]);
        $response = ['prompt'=>$questionResponse['prompt']];
        if($this->type=='essay'){
            return array_merge($response,['message'=>$questionResponse['response']]);
        }
        return array_merge($response,json_decode($questionResponse['response']));
    }
    private function getPostSubmission(){
        return Utility::getInstance()->fetchRow($this->queryGetPostSubmission,['postId'=>$this->submissionId]);
    }
    private $queryGetQuestionSubmission = <<<SQL
    SELECT response,q.prompt FROM quiz_responses qr
      join questions q on q.id = qr.question_id
     WHERE question_id = :questionId and user_id = :userId order by quiz_response_id desc limit 1;
SQL;
    private $queryGetPostSubmission = <<<SQL
    SELECT p.message, p.video_url as videofilename, p.video_thumbnail_url as thumbnailfilename FROM posts p WHERE p.id = :postId
SQL;

}
class TestAdmin {
    private $groupId;
    private $classId;
    public function __construct($groupId){
        $this->groupId = $groupId;
        $this->classId = Utility::getInstance()->fetchOne('SELECT g.classid FROM groups g WHERE g.id = :groupId',['groupId'=>$this->groupId]);
    }
    public function addAdmin($userId){
        Utility::getInstance()->insert($this->queryAddAdmin,['groupId'=>$this->groupId,'classId'=>$this->classId,'userId'=>$userId]);
    }
    public function removeAdmin($userId){
        if($userData = $this->getUserClassesData($userId)){
            if($this->hasOtherRole($userData)){
                Utility::getInstance()->reader->update('user_classes',['is_test_admin'=>0],['id'=>$userData['id']]);
            }else{
                Utility::getInstance()->reader->delete('user_classes',['id'=>$userData['id']]);
            }
        }
    }
    private function hasOtherRole($userData){
        return boolval($userData['is_student']) ||
               boolval($userData['is_teacher']) ||
               boolval($userData['is_edit_teacher']) ||
               boolval($userData['is_observer']);
    }
    private function getUserClassesData($userId){
        return Utility::getInstance()->fetchRow($this->queryGetUserClassesData,['groupId'=>$this->groupId,'userId'=>$userId]);
    }
    private $queryAddAdmin = <<<SQL
    INSERT INTO user_classes (userid,classid,groupid,is_test_admin) values (:userId,:classId,:groupId,1)
    ON DUPLICATE KEY UPDATE is_test_admin = 1
SQL;
    private $queryGetUserClassesData = <<<SQL
    SELECT * FROM user_classes uc WHERE uc.groupid = :groupId and uc.userid = :userId
SQL;


}
class TemplateShareResults extends E3Mailer {
    private $custom_body;
    private $custom_subject;
    private $templateReport;
    private $includeId;
    private $includeVideo;
    private $includeComments;
    private $studentTest;
    private $includeCertificate;
    private $includeReport;
    public function __construct($studentTest,$body,$subject,$includeId,$includeVideo,$includeComments,$includeCertificate,$includeReport=false){
        parent::__construct(new User());
        $this->studentTest = $studentTest;
        $this->templateReport = $template = new TemplateStudentReport($studentTest);
        $this->headerText = '';
        $this->custom_body = $body;
        $this->custom_subject = $subject;
        $this->includeComments = $includeComments;
        $this->includeId = $includeId;
        $this->includeVideo = $includeVideo;
        $this->includeCertificate = $includeCertificate;
        $this->includeReport = $includeReport;
    }

    protected function emailBodyTemplate()
    {
        global $PATHS;
        if($this->includeId && $id_file = $this->templateReport->attachment()){
            $this->mailer->addAttachment($id_file);
        }
        if($this->includeCertificate && $certificateFile = J1Certificate::createCertificateFile($this->studentTest['id'],$this->studentTest['classId'])){
            $this->mailer->addAttachment($certificateFile);
        }
        if($this->includeReport && $certificateFile = E3PTReport::createCertificateFile($this->studentTest['id'],$this->studentTest['classId'])){
            $this->mailer->addAttachment($certificateFile);
        }
        if($this->includeVideo){
            foreach($this->studentTest['pageGroups'] as $pageGroup){
                foreach($pageGroup['submissions'] as $submission ){
                    if($v = $submission['video_url']){
                        $this->mailer->addAttachment($PATHS->app_path . $v);
                    }
                }
            }
        }
        if($this->includeComments){
            if(strpos($this->custom_body,'[comments_section]') !== false){
                $this->custom_body = str_replace('<p style="color:white">[comments_section]</p>','<p>'.$this->commentsHtml().'</p>',$this->custom_body);
            }else{

                $this->custom_body .= $this->commentsHtml();
            }
        }else{
            $this->custom_body = str_replace('[comments_section]','',$this->custom_body);
        }
        return $this->custom_body;
    }
    private function commentsHtml(){
        if(!count($this->studentTest['additionalComments'])){
            return '';
        }
        $commentSections = $this->commentSections();
        return $this->studentTest['isJ1']?$this->commentsHtmlJ1($commentSections):$this->commentsHtmlE3PT($commentSections);
    }
    private function commentsHtmlE3PT($commentSections){
        $html =
            '<table style="width:100%;box-sizing: border-box; border-collapse: collapse; border-spacing: 0px; max-width: 100%; margin-bottom: 0px; border: 1px solid rgb(221, 221, 221); font-family: Verdana, Geneva, sans-serif; font-size: 12px; margin-top: 15px;">' .
            ' 	<tbody style="box-sizing: border-box;">' .
            ' 		<tr style="box-sizing: border-box;">' .
            ' 			<th style="box-sizing: border-box; padding: 8px; text-align: left; line-height: 1.42857; vertical-align: top; border: 1px solid rgb(221, 221, 221); color: rgb(95, 192, 79); background-color: rgb(247, 247, 247);">Additional comments</th>' .
            ' 		</tr>' .
            ' 		<tr style="box-sizing: border-box;">' .
            ' 			<td style="box-sizing: border-box; padding: 8px; line-height: 1.42857; vertical-align: top; border: 1px solid rgb(221, 221, 221);">' .
            $commentSections.
            ' 			</td>' .
            ' 		</tr>' .
            ' 	</tbody>' .
            ' </table>';
        return $html;
    }
    private function commentsHtmlJ1($commentSections){
        $html =
            '<table style="width:100%;box-sizing: border-box; border-collapse: collapse; border-spacing: 0px; max-width: 100%; margin-bottom: 0px; border: 1px solid rgb(221, 221, 221); font-family: Verdana, Geneva, sans-serif; font-size: 12px; margin-top: 15px;">' .
            ' 	<tbody style="box-sizing: border-box;">' .
            ' 		<tr style="box-sizing: border-box;">' .
            ' 			<th style="box-sizing: border-box; text-align: left;padding-left: 15px;border: 1px solid #ccc;background: #e6e3e3;font-weight: normal;font-size: 1.7em;padding-bottom: 5px;padding-top: 5px;">Additional comments</th>' .
            ' 		</tr>' .
            ' 		<tr style="box-sizing: border-box;">' .
            ' 			<td style="box-sizing: border-box;padding-left: 15px;padding-top: 13px;
    border: 1px solid #ccc;">' .
            $commentSections.
            ' 			</td>' .
            ' 		</tr>' .
            ' 	</tbody>' .
            ' </table>';
        return $html;
    }
    private function commentSections(){
        $html = '';
        foreach($this->studentTest['additionalComments'] as $pg){
            $name = $pg['name'];
            $comments = $pg['comments'];
            $html.=
                "<p style='box-sizing: border-box; margin: 0px 0px 10px;'>
                    <span style='box-sizing: border-box;'>$name:</span>&nbsp;
                    <span style='box-sizing: border-box;'>$comments</span>
                </p>";
        }
        return $html;
    }
    protected function emailSubject()
    {
        return $this->custom_subject;
    }

}