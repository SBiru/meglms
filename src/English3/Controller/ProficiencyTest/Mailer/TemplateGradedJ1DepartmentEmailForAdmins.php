<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.11.8
 * Time: 12:46
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\Exports\J1Certificate\J1Certificate;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\ProficiencyTest\StudentTest;
use English3\Model\User;

class TemplateGradedJ1DepartmentEmailForAdmins extends TemplateGradedJ1CertificateEmailForAdmins {
    protected function emailBodyTemplate()
    {

        $this->addAttachments();
        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Hello,</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"><b>'.
            $this->studentName ."</b> requested that you receive his/her English interview Score Report. 
Please print the attached E3J1 Score Report and include it in the applicant’s documents for Exchange Visitor Services. </p>";
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> If you have any question or concern about the score please send an email to matthew.heiner@english3.com.</p>';
        $email_message .= $this->scoreTableHtml();
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Best Regards,<br>The English3 Team </p>';
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

}