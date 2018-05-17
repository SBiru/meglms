<?php
namespace English3\Controller\Reports\SendReportsToUsers;

use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\BaseTemplate;
use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\BorderedStripedTable;
use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\HtmlElement;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\EmailController;
use English3\Controller\UserController;
use English3\Controller\Users\UserGuardiansArray;
use English3\Controller\Utility;
use English3\Model\User;


class ProgressReportSender {
    private $studentReports;
    private $userGuardiansArray;
    private $orgId;
    private $emailSubject;
    public function __construct($orgId,$studentReports){
        $this->orgId = $orgId;
        $studentIds = array_map(function($s){
            return $s['id'];
        },$studentReports);
        $this->studentReports = $studentReports;
        $this->getStudentsGuardians($studentIds);
        $this->emailSubject = 'Progress Report';
    }

    private function getStudentsGuardians($studentsIds){
        $uGuardians = new UserGuardiansArray();
        $this->userGuardiansArray = $uGuardians->getGuardiansGivenUserIds($studentsIds);
    }
    public function emailStudents(){
        foreach($this->studentReports as $studentReport){
            $studentReport['name']=$studentReport['firstName'].' '.$studentReport['lastName'];
            $mailMessage = new ProgressReportSenderTemplate($this->orgId,$studentReport,[$studentReport],'student');
            $this->sendEmail($mailMessage,$studentReport['email']);
        }

    }
    public function emailParents(){
        $parents = $this->groupStudentsByParent();
        foreach($parents as $parent){
            $to=['name'=>'parent/guardian of '.$parent['students'][0]['firstName'].' '.$parent['students'][0]['lastName']];
            $mailMessage = new ProgressReportSenderTemplate($this->orgId,$to,$parent['students'],'parent');
            $this->sendEmail($mailMessage,$parent['email']);
        }
    }
    private function sendEmail(ProgressReportSenderTemplate $mailMessage,$toEmail){
        $from = new User();
        $from->setEmail('noreply@english3.com');
        $from->setFirstName('Progress');
        $from->setLastName('Report');
        $userCtrl = UserController::byEmail(Utility::getInstance()->reader,$toEmail);
        $mailer = new ProgressReportMailer($userCtrl->user);
        $mailer->setConfig($mailMessage->getHeader(),$mailMessage->getBody(),$this->emailSubject);
        $mailer->send();
    }
    private function groupStudentsByParent(){
        $parents = [];
        foreach($this->studentReports as $student){
            $userGuardians = $this->userGuardiansArray[$student['id']]['parents'];
            if(!$userGuardians){
                continue;
            }
            foreach($userGuardians as $addressee){
                $this->createAddresseeIfNotExists($parents,$addressee);
                $this->addStudentToAddressee($parents[$addressee['id']],$student);
            }
        }
        return $parents;
    }
    private function createAddresseeIfNotExists(&$addressees,$addressee){
        if(!@$addressees[$addressee['id']]){
            $addressee['students']=array();
            $addressees[$addressee['id']]=$addressee;
        }

    }
    private function addStudentToAddressee(&$addressee,$student){
        unset($student['advisors']);
        unset($student['parents']);
        $addressee['students'][]=$student;
    }
}
class ProgressReportMailer extends E3Mailer{
    public function __construct(User $user){
        parent::__construct($user,'');
    }
    public function setConfig($header,$body,$subject){
        $this->header = $this->prepareHeader($header);
        $this->body = $body;
        $this->subject = $subject;
        $this->bodyStyle = '';
    }
    protected function prepareHeader($header){
        GLOBAL $PATHS;
        require_once($PATHS->app_path.'/lib/simple_html_dom.php');
        $html = str_get_html($header);
        foreach($html->find('img') as $i=>&$element){
            $src = $element->src;
            $this->mailer->AddEmbeddedImage($PATHS->app_path.$src,'image'.$i);
            $element->src="cid:image".$i;
        }
        $h = $html->outertext;
        return $h;
    }
    protected function emailDefaultHeader()
    {
        return $this->header;
    }
    protected function emailBodyTemplate()
    {
        return $this->body;
    }

    protected function emailSubject()
    {
        return $this->subject;
    }
}
class ProgressReportSenderTemplate extends BaseTemplate{
    public function __construct($orgId,$to,$students,$role){
        parent::__construct($orgId,$to,$role,false);
        $this->tableStyles = new BorderedStripedTable();
        $this->students = $students;
        $this->role = $role;
        $this->genarateTemplate();
    }
//    public function setMailMessage($students){
//        $mailMessage = '';
//        $mailMessage.= $this->emailDescription();
//        $mailMessage.= $this->studentsTable($students);
//        parent::setMailMessage($mailMessage);
//    }
    protected  function tableDescription(){
        $message = '';
        if($this->role=='student'){
            $message = 'Below is your current progress report.';
        }else if($this->role=='parent'){
            $message = 'Below is your '.$this->chooseChildOrChildren($this->students).' current progress report.';
        }
        return (new HtmlElement('p',$message))->getHtml();
    }
    private function chooseChildOrChildren($students){
        if(count($students)>1){
            return "children's";
        }
        else return "child's";
    }
    private function studentsTable($students){
        $tables = [];
        foreach($students as $student){
            $tables[]= $this->studentTable($student);
        }
        return implode('<br>',$tables);
    }
    private function studentTable($student){

        $table = new HtmlElement('table','',$this->tableStyles->tableStyles());
        $table->content.=$this->tableHeader();
        foreach($student['classes'] as $class){
            $table->content.=$this->tableRow($class);
        }

        return $this->prependStudentNameIfNeeded($student,$table);
    }
    private function prependStudentNameIfNeeded($student,$table){
        if($this->role=='parent'){
            $studentName = new HtmlElement('div',$student['name']);
            return $studentName->getHtml() .$table->getHtml();
        }
        else return $table->getHtml();
    }
    private function tableHeader(){
        $tr = new HtmlElement('tr');
        $tr->content.=(new HtmlElement('th','Course',array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Grade on Completed work',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Current overall grade',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Expected so far',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Completed so far',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Course start',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Course end',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        $tr->content.=(new HtmlElement('th','Projected end date',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml();
        return $tr->getHtml();
    }
    private function tableRow($class){
        $this->tableStyles->currentRow++;
        $tr = new HtmlElement('tr');
        $tr->content.=(new HtmlElement('td',$class['name'],array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableGradeOnCompletedWork'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableCurrentOverallGrade'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles(),$this->styleForGradeOverall($class))))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableExpectedSoFar'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableCompletedSoFar'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableCourseStart'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableCourseEnd'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        $tr->content.=(new HtmlElement('td',$class['printableProjectedEndDate'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml();
        return $tr->getHtml();
    }
    private function styleForGradeOverall($class){
        return [
            'color'=>$class['letterExpectedOrCompletedScore']=='F'?'#FF0000':'inherit'
        ];
    }
    protected function emailDescription()
    {
        $this->mailMessage.= $this->tableDescription();
    }

    protected function emailData()
    {
        $this->mailMessage.= $this->studentsTable($this->students);
    }

    protected function emailWelcome()
    {
        parent::setHi( 'Hello '.$this->to['name'] . '');
    }
}
