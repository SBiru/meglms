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

class TemplateSubmittedTestEmailForTeachers extends E3Mailer{
    private $class;
    private $studentName;
    private $studentId;
    public function __construct(User $user,User $student,$class){
        parent::__construct($user);
        $this->headerText = 'Interview submitted';
        $this->class = $class;
        $this->studentName = $student->getFirstName().' '.$student->getLastName();
        $this->studentId = $student->getUserId();
    }
    protected function emailBodyTemplate()
    {
        global $PATHS;
        $test = new StudentTest($this->class['id'],$this->studentId);
        $template = new TemplateStudentReport($test->load());
        if($id_file = $template->attachment()){
            $this->mailer->addAttachment($id_file);
        }

        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> ' . $this->user->getFirstName() . ',</p>';
        $email_message .= "<p style='font-size:1.3em;margin-top:-10px;'> $this->studentName completed the {$this->class['name']}. Log in to view and evaluate the interview. </p>";
        if($PATHS->serverName === 'China'){
            $email_message.=  "<p style='font-size:1.3em;margin-top:-10px;'> The interview was completed from China. Please allow up to to 3 hours to sync to elearn.english3.com so you can watch it. </p>";
        }
        

        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Best, <br> The English3 Team </p>';
        $email_message .= '
        <p style="font-size:1.3em;margin-top:-10px;">
            <div style="text-align: center; margin-top:30px">
                <a href="http://elearn.english3.com" style="text-decoration:none;padding:6px 12px;font-size:14px;line-height:1.42857143;border-radius:4px;display:inline-block;margin-bottom:0;font-weight:400;text-align:center;vertical-align:middle;background-image:none;border:1px solid transparent;white-space:nowrap;color:#fff;background-color:#5cb85c;border-color:#4cae4c" target="_blank" ">
                    Log in
                </a>
            </div>
        </p>';
        $email_message .= '</div>';
        return $email_message;
    }

    protected function emailSubject()
    {
        return "New interview submitted ";
    }
}