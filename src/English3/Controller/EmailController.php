<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;


use English3\Controller\Organization\OrganizationController;
use English3\Controller\UserController;
use English3\Controller\ClassesController;
use English3\Controller\TranslationsController;
use English3\Model\User;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class EmailController{

    // to -> email or array of emails
    // attachment -> must contain filename and path
    // $cc -> array of emails
    public static function sendEmail($message,User $from,$to,$subject = '',$attachment = null,$cc=null){
        $separator = md5(time());

        // carriage return type (we use a PHP end of line constant)
        $eol = PHP_EOL;
        $fromEmailAddress = 'noreply@english3.com';
        // main header (multipart mandatory)
        $headers = 'From: ' . $from->getFirstName() . ' ' . $from->getLastName() . ' <'.$fromEmailAddress.'>'. $eol;
        $headers .= 'Reply-to: ' . $from->getEmail() . $eol;
        if(!empty($cc)){
            $headers .= 'CC: ' . implode(",",$cc) . $eol;
        }
        $headers .= "MIME-Version: 1.0" . $eol;
        $headers .= "Content-Type: multipart/mixed; boundary=\"" . $separator . "\"" . $eol . $eol;

        $emessage = "--" . $separator . $eol;
        $emessage .= "Content-type: text/html;" . $eol;
        $emessage .= "Content-Transfer-Encoding: 8bit" . $eol . $eol;
        $emessage .= $message . $eol . $eol;

        // attachment
        if($attachment){
            $filename = $attachment->filename;
            $file = $attachment->path . $filename;
            $file_size = filesize($file);
            $handle = fopen($file, "r");
            $content = fread($handle, $file_size);
            fclose($handle);
            $content = chunk_split(base64_encode($content));

            $emessage .= "--" . $separator . $eol;
            $emessage .= "Content-Type: application/octet-stream; name=\"" . $filename . "\"" . $eol;
            $emessage .= "Content-Transfer-Encoding: base64" . $eol;
            $emessage .= "Content-Disposition: attachment" . $eol . $eol;
            $emessage .= $content . $eol . $eol;
        }

        $emessage .= "--" . $separator . "--";
        $to_list = array();
        if(gettype($to)==='array'){
            foreach($to as $email){
                $to_list[] = $email;
            }
        }
        else{
            $to_list[] = $to;
        }
        if(@mail(implode(',',$to_list), $subject, $emessage, $headers,'-f'.$fromEmailAddress)) {
            return true;
        }
        return false;
    }

    public static function sendFinalGrade($userId, $classId, $grade, $comments){
        $util = new Utility();
        $className = $util->fetchOne(ClassesController::$queryGetClass,['classId'=>$classId],'name');
        $user = UserController::byId($util->reader,$userId);
        $me = UserController::me($util->reader);
        $translations = TranslationsController::_getForUser($userId);

        $message = self::replacePlaceHolders(self::$finalGradeMessage,[
            'grade'=>$grade,
            'comments'=>$comments,
            'class'=>$className
        ]);

        $hi = isset($translations['user_language']['hi']) ? $translations['user_language']['hi'] : $translations['en']['hi'];
        $hi = self::replacePlaceHolders($hi,[
            'fname'=>$user->user->getFirstName(),
            'lname'=>$user->user->getLastName(),
        ]);

        $email = self::replacePlaceHolders(self::$mainTemplate,[
            'hi'=>$hi,
            'mail_message'=>$message,
            'sender_mail'=>$me->user->getEmail()
        ]);
        $canSendMail = !boolval(OrganizationController::_getField($user->user->getOrgId(),'disallow_email'));
        if($canSendMail){
            return self::sendEmail($email,$me->user,$user->user->getEmail(),'Final grade for class '.$className);
        }
        return true;

    }

    public static function replacePlaceHolders($text,$params){

        foreach($params as $key=>$value){
            $text = str_replace("##".$key."##",$value,$text);
        }
        return $text;
    }
    public static function sendFileBiggerThanLimitToMike($filename,$filesize){
        $from = new User();
        $from->setFirstName("Uploaded");
        $from->setLastName("File");
        $message = $filename. " has more than ".$filesize.'mb.';
        self::sendEmail($message,$from,'mike.griffiths@english3.com','File exceeds size limit');
    }
    public static $finalGradeMessage = '
        <p>You have received the final grade for the class ##class##!</p>
        <p><b>Grade:</b> ##grade##</p>
        <b>Teacher comments:</b>
        <p>##comments##</p>
    ';
    public static $mainTemplate ='
    <div style="width:100%!important;min-width:100%;color:#222222;
font-family:Helvetica,Arial,sans-serif;font-weight:normal;text-align:left;line-height:18px;font-size:12px;margin:0;padding:0">
        <table style="width:100%;margin: 50px auto">
            <tr>
                <td style = "padding: 20px 30px;background: rgb(244, 244, 244);">
                    <div><a href="http://elearn.english3.com"> <img src="http://www.english3.com/images/green-logo.png" width="150px"></a></div>
                    <div style="margin-left: 37px;font-size: 14px;">Results that speak for themselves</div>
                </td>
            </tr>
        </table>
        <table style="width:100%;margin:auto;font-size:20px">
            <tr>
                <td>
                    ##hi##
                    <br>
                    <br>
                    ##mail_message##
                    <p>&nbsp;</p>
                </td>
            </tr>
        </table>
    </div>

    <div style="width:100%;margin: 70px auto;padding:10px 0;color:white;background-color: black">
        <div style="padding: 0 10px">

            <div>
                Do not reply this email.
                 <br>
                If you want to contact the person who sent this email, you can use this address <<span style="color:#9aff97">##sender_mail##</span>>.
            </div>
            <div>
                Copyright © 2015 English3. All rights reserved.
            </div>
        </div>

    </div>
    ';

}
?>

