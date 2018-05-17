<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.12
 * Time: 18:04
 */

namespace English3\Controller\AutomatedAlerts\AutomatedEmails;


use English3\Controller\Attendance\MissingAttendanceChecker;
use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\AttendanceReminderTemplate;

class AttendanceReminderEmail extends BaseAlertEmail {

    public function getStudents()
    {
        $alertObj = new MissingAttendanceChecker();
        $this->students = $alertObj->getOrgStudentsMissingAttendance($this->orgId);
    }

    public function emailStudents()
    {
        $this->checkIfStudentsAreLoaded();
        $count = 0;
        foreach($this->students as $student){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new AttendanceReminderTemplate($this->orgId,$student,[$student],'student',$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }

    public function emailUser($email)
    {
        $this->checkIfStudentsAreLoaded();
        $mailMessage = new AttendanceReminderTemplate($this->orgId, ['name'=>'','email'=>$email], $this->students, 'customEmail',$this->options);
        if($this->preview){
            $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
        }
        $this->sendEmail($mailMessage);
    }

    protected function sendEmailToParentsOrAdvisors($addressees, $role)
    {
        $count = 0;
        foreach($addressees as $addressee){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new AttendanceReminderTemplate($this->orgId,$addressee,$addressee['students'],$role,$this->options);
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