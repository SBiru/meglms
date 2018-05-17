<?php


namespace English3\Controller\AutomatedAlerts;


use English3\Controller\AutomatedAlerts\AutomatedEmails\AttendanceReminderEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\BaseAlertEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\BehindInCoursesEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\GradeBelowTargetEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\MissingAttendanceEmail;
use Symfony\Component\HttpFoundation\JsonResponse;

class RunAutomatedAlerts {
    private $alertOptions;
    private $alert;
    private $testVersion;
    private $preview;
    public function __construct($alertOptions,$preview = false, BaseAlertEmail $alert = null){
        $this->alertOptions = $alertOptions;
        $this->alert = $alert;
        $this->preview = $preview;
        $this->testVersion = $this->alertOptions['isTestVersion'];
    }
    public function behindInCourses(){
        $this->alert = new BehindInCoursesEmail($this->alertOptions['orgId'],$this->alertOptions['options']['percBehind']['value'],null,$this->testVersion,$this->preview);
        $this->alert->setOptions($this->alertOptions['options']);
        return $this->runAlert();
    }
    public function missingAttendance(){
        $this->alert = new MissingAttendanceEmail($this->alertOptions['orgId'],$this->alertOptions['options'],$this->testVersion,$this->preview);
        $this->alert->setOptions($this->alertOptions['options']);
        return $this->runAlert();
    }
    public function gradeBelowTarget(){
        $this->alert = new GradeBelowTargetEmail($this->alertOptions['orgId'],$this->alertOptions['options']['targetGrade']['value'],$this->testVersion);
        $this->alert->setOptions($this->alertOptions['options']);
        $this->alert->setPreview($this->preview);
        return $this->runAlert();
    }
    public function attendanceReminder(){
        $this->alert = new AttendanceReminderEmail($this->alertOptions['orgId'],"Attendance Reminder",$this->testVersion);
        $this->alert->setPreview($this->preview);
        return $this->runAlert();
    }
    private function runAlert(){

        $this->alert->getStudents();

        foreach($this->alertOptions['addressees'] as $recipient){
            if($recipient=='Advisors'){
                $res = $this->alert->emailAdvisors();
            }else if($recipient=='Parents'){
                $res =  $this->alert->emailParents();
            }else if($recipient=='Students'){
                $res =  $this->alert->emailStudents();
            }else if($recipient=='Teachers'){
                $res = $this->alert->emailTeachers();
            }else if($recipient=='Admins'){
                $res = $this->alert->emailAdmins();
            }else{
                $res = $this->alert->emailUser($recipient);
            }
            if($this->preview){
                return $res;
            }
        }
        return new JsonResponse('ok');
    }


}