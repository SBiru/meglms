<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.11.8
 * Time: 12:46
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\Mailer\E3Mailer;
use English3\Controller\ProficiencyTest\StudentTest;
use English3\Model\User;

class TemplateGradedTestEmailForAdmins extends E3Mailer{
    private $class;
    private $studentName;
    private $studentId;
    public function __construct(User $user,User $student,$class){
        parent::__construct($user);
        $this->headerText = 'Test completed';
        $this->class = $class;
        $this->studentName = $student->getFirstName().' '.$student->getLastName();
        $this->studentId = $student->getUserId();
    }
    protected function emailBodyTemplate()
    {
        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Hello ' . $this->user->getFirstName() . ',</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> We have graded the test for '. $this->studentName .' who completed the '. $this->class['name'] .' on '. date("M/d/y") .". Below you will find the test scores per area with their corresponding description and the Total score. To review the student's responses and videos please log into our platform with your credentials and look up the student in your Dashboard. </p>";
        $email_message .= '<p>' . $this->reportTemplate() . '</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> If you have any question or concern about your test score please send an email to matthew.heiner@english3.com.</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> The English3 Team </p>';
        $email_message .= '</div>';
        return $email_message;
    }
    private function reportTemplate(){
        $test = new StudentTest($this->class['id'],$this->studentId);
        $template = new TemplateStudentReport($test->load());
        if($id_file = $template->attachment()){
            $this->mailer->addAttachment($id_file);
        }
        return $template->createReport();
    }

    protected function emailSubject()
    {
        return "We have graded the " . $this->class['name'];
    }
}