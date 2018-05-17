<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails;

//use English3\Controller\AutomatedAlerts\AutomatedEmails\BaseAlertEmail;
use English3\Controller\Attendance\MissingAttendanceChecker;
use English3\Controller\AutomatedAlerts\Alerts\MissingAttendance;
use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\MissingAttendanceTemplate;
use English3\Controller\Users\UserGuardiansArray;
use Exception;

class MissingAttendanceEmail extends BaseAlertEmail{
    public $students;

    private $minDate;
    private $maxDate;
    private $alertObj;
    protected $options;

    public function __construct($orgId,$options,$testVersion=true,$preview=false){
        $options['orgId']=$orgId;
        $this->preview = $preview;
        $this->options = $options;
        $this->alertObj = new MissingAttendanceChecker();
        parent::__construct($orgId,'Students missing attendance',$testVersion);

    }
    public function getStudents(){
        $this->userGuardians = null;
        if($this->preview){
            return $this->students = $this->previewMockStudents();
        }
            list($startDate,$endDate) = $this->getStartAndEndDate();
        $this->students = $this->alertObj->getOrgStudentsMissingAttendance($this->orgId,$startDate,$endDate);
    }
    private function getStartAndEndDate(){
        if($this->options['period']['value']=='previous week'){
            $startDate = date('Y-m-d',$this->lastWeekStartDate());
            $endDate = date('Y-m-d',$this->lastWeekEndDate());
        }else{
            $startDate = null;
            $endDate = date('Y-m-d',$this->lastWeekStartDate());
        }
        return [$startDate,$endDate];
    }
    private function lastWeekStartDate($now=null){
        $previous_week = strtotime("-1 week +1 day");
        $start_week = strtotime("last monday midnight",$previous_week);
        return $start_week;
    }
    private function lastWeekEndDate($now= null){
        return strtotime("next friday",$this->lastWeekStartDate($now));
    }
    public function emailUser($email)
    {
        $this->checkIfStudentsAreLoaded();
        $mailMessage = new MissingAttendanceTemplate($this->orgId, ['name'=>'','email'=>$email], $this->students, 'customEmail',$this->options);
        if($this->preview){
            $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
        }
        $this->sendEmail($mailMessage);
    }
    public function emailStudents(){
        $this->checkIfStudentsAreLoaded();
        $count = 0;
        foreach($this->students as $student){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new MissingAttendanceTemplate($this->orgId,$student,[$student],'student',$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }
    protected function sendEmailToParentsOrAdvisors($addressees,$role){
        $count = 0;
        foreach($addressees as $addressee){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new MissingAttendanceTemplate($this->orgId,$addressee,$addressee['students'],$role,$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }
    private function previewMockStudents(){
        return [
            24=>[
                'id'=>24,
                'first_name'=>'Student',
                'last_name'=>'Demo',
                'name'=>'Demo, Student',
                'fullName'=>'Student Demo',
                'phone'=>'XXX-XXX-XXXX'

            ]
        ];
    }



}
