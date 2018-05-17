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

class TemplateGradedJ1EmailForAdmins extends E3Mailer{
    protected $class;
    protected $studentName;
    protected $studentId;
    protected $studentTest;
    protected $certificate;
    public function __construct(User $user,User $student,$class,$certificate=null){
        parent::__construct($user);
        $this->headerText = 'Interview completed';
        $this->class = $class;
        $this->studentName = $student->getFirstName().' '.$student->getLastName();
        $this->studentId = $student->getUserId();
        $interview = new StudentTest($class['id'],$student->getUserId());
        $this->studentTest = $interview->load();
        $this->certificate = $certificate;
    }
    protected function emailBodyTemplate()
    {

        $this->addAttachments();
        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Hello ' . $this->user->getFirstName() . ',</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> We have graded the interview for '.
            $this->studentName .". Below you will find the interview score. To review the student's video please log in to elearn.english3.com. </p>";
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> If you have any question or concern about the score please send an email to matthew.heiner@english3.com.</p>';
        $email_message .= $this->scoreTableHtml();
        $email_message .= $this->commentsHtml();
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> The English3 Team </p>';
        $email_message .= '
        <p style="font-size:1.3em;margin-top:-10px;">
            <div style="text-align: center; margin-top:30px">
                <a href="https://elearn.english3.com" style="text-decoration:none;padding:6px 12px;font-size:14px;line-height:1.42857143;border-radius:4px;display:inline-block;margin-bottom:0;font-weight:400;text-align:center;vertical-align:middle;background-image:none;border:1px solid transparent;white-space:nowrap;color:#fff;background-color:#5cb85c;border-color:#4cae4c" target="_blank" ">
                    Log in
                </a>
            </div>
        </p>';

        $email_message .= '</div>';
        return $email_message;
    }
    protected function addAttachments(){
        $test = new StudentTest($this->class['id'],$this->studentId);
        $template = new TemplateStudentReport($test->load());
        if($id_file = $template->attachment()){
            $this->mailer->addAttachment($id_file);
        }
        if($this->certificate){
            $this->mailer->addAttachment($this->certificate);
        }
    }
    protected function scoreTableHtml(){

        return "<table style='{$this->styles['table']}'>
                <tr>
                    <th style='{$this->styles['table_th-td']}{$this->styles['table_th']} width:200px'>Interview Score</th>
                    <th style='{$this->styles['table_th-td']}{$this->styles['table_th']} '>Score Description</th>
                </tr>
                <tr>
                    <td style='{$this->styles['table_th-td']}{$this->styles['main_score']}'>
                        {$this->studentTest['actualTotalScore']}
                    </td>
                    <td style='{$this->styles['table_th-td']}{$this->styles['score_description']}'>
                        {$this->studentTest['scoreDescription']}
                    </td>
                </tr>
            </table>";
    }
    protected function commentsHtml(){
        if(!count($this->studentTest['additionalComments'])){
            return '';
        }
        $commentSections = $this->commentSections();
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
    protected function commentSections(){
        $html = '';
        foreach($this->studentTest['additionalComments'] as $pg){
            $name = $pg['name'];
            $comments = $pg['comments'];
            $html.=
                "<p style='box-sizing: border-box; margin: 0px 0px 10px;font-size: 1.3em'>
                    <span style='box-sizing: border-box;'>$name:</span>&nbsp;
                    <span style='box-sizing: border-box;'>$comments</span>
                </p>";
        }
        return $html;
    }

    protected function emailSubject()
    {
        return "We have graded the " . $this->class['name'];
    }
    protected $styles=[
        'table'=>'border: 1px solid #ccc;
        width: 100%;
        border-collapse: collapse;',
        'table_th-td'=>'text-align: left;
        padding-left: 15px;
        border: 1px solid #ccc;',
        'table_th'=>'background: #e6e3e3;
        font-weight: normal;
        font-size: 1.7em;
        padding-bottom: 5px;
        padding-top: 5px;',
        'main_score'=>'font-size: 5em;
        padding-left:0;
        text-align:center;
        line-height: 1.5;
        height: 150px;',
        'score_description'=>'font-size: 1.3em;text-align: center'
    ];
}