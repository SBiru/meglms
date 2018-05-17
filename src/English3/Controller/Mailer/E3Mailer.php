<?php


namespace English3\Controller\Mailer;

//require_once realpath(dirname(__FILE__)).'/../../../../vendor/phpmailer/PHPMailerAutoload.php';
use English3\Controller\Organization\OrganizationController;
use English3\Model\User;

abstract class E3Mailer {
    protected $logo;
    protected $mailer;
    protected $user;
    protected $headerText = '';
    protected $orgHeader;

    protected $bodyStyle = 'style="font-family:sans-serif;padding:20px;"';
    public function __construct(User $user = null ,$logoPath='/public/img/green-logo.png',$fromName="English3 Website"){
        global $PATHS,$MAIL_SECURITY;
        $userName = array_key_exists('MAIL_SECURITY', $GLOBALS) && isset($MAIL_SECURITY->username)?$MAIL_SECURITY->username:'noreply@english3.com';
        $pwd = array_key_exists('MAIL_SECURITY', $GLOBALS) && isset($MAIL_SECURITY->password)?$MAIL_SECURITY->password:'E3noreply$!';
        $this->user = $user;
        $this->logo = $PATHS->app_path.$logoPath;
        $this->mailer = new \PHPMailer();
        $this->mailer->IsSMTP();
        $this->mailer->SMTPDebug = 0;
        $this->mailer->Mailer = 'smtp';
        $this->mailer->SMTPAuth = true;
        $this->mailer->Host = array_key_exists('MAIL_SECURITY', $GLOBALS) && isset($MAIL_SECURITY->host)?$MAIL_SECURITY->host:'smtp.gmail.com';
        $this->mailer->Port = 587;
        $this->mailer->SMTPSecure = 'tls';
        $this->mailer->CharSet = 'UTF-8';
        $this->mailer->Username = $userName;
        $this->mailer->Password = $pwd;
        $this->mailer->IsHTML(true); // if you are going to send HTML formatted emails
        $this->mailer->SingleTo = true; // if you want to send a same email to multiple users. multiple emails will be sent one-by-one.
        $this->mailer->From = $userName;
        $this->mailer->FromName = $fromName;
        if(@$MAIL_SECURITY->useDKIM){
            $this->mailer->DKIM_domain = $MAIL_SECURITY->DKIM_domain;
            $this->mailer->DKIM_private = $MAIL_SECURITY->DKIM_private;
            $this->mailer->DKIM_selector = $MAIL_SECURITY->DKIM_selector;
            $this->mailer->DKIM_passphrase = $MAIL_SECURITY->DKIM_passphrase;
            $this->mailer->DKIM_identity = $this->mailer->From;
        }
        if($logoPath){
            $this->mailer->AddEmbeddedImage($this->logo,'logo');
        }

    }

    protected function emailTemplate(){
        $email_message = '<!DOCTYPE html>';

        $email_message .= '<html>';

        $email_message .= '<head>';

        $email_message .= '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';

        $email_message .= '</head>';

        $email_message .= '<body '. $this->bodyStyle .'>';

        $email_message .= $this->emailDefaultHeader();
        $email_message .= $this->emailBodyTemplate();

        $email_message .= '</body>';

        $email_message .= '</html>';

        return $email_message;

    }
    public  function getHeaderFromOrgConfig($orgId){
        $header = OrganizationController::_getField($orgId,'email_header_template');
        $this->orgHeader = $this->prepareHeader($header);;
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
    protected function emailDefaultHeader(){
        if($this->orgHeader){
            return $this->orgHeader;
        }
        $email_message = '<div id="d1" style="width:95%;height:35px;background:white;margin:2%auto;border-radius:5px;box-shadow:5px 5px 30px 
rgba(0,0,0,.6);padding:1%;border-bottom: solid 4px rgb(83,187,67);">';

        $email_message .= '<img src="cid:logo" style="position:relative;display:inline-block;top:15%;height:40px;width:160px;"/>';

        $email_message .= '<h1 style="position:relative;display:inline-block;float:right;color:rgb(53,106,52);font-size:2.5vmin;padding:0;margin:0;margin-top:3vmin;">'. $this->headerText .'</h1>';

        $email_message .= '</div>';

        return $email_message;
    }

    protected abstract function emailBodyTemplate();

    protected abstract function emailSubject();
    public function send($toArray = array()){
        $to = $this->user;
        $this->mailer->Subject = $this->emailSubject();
        #$to->setEmail('dennyserejom@gmail.com'); //for testing
        if(!count($toArray) && strpos($to->getEmail(),'e3.com')===false){
            $this->mailer->addAddress($to->getEmail(),$to->getFirstName(). " ". $to->getLastName());
        }
        foreach($toArray as $user){
            if(strpos($user['email'],'e3.com')!==false){
                continue;
            }
            $this->mailer->addAddress($user['email'],@$user['firstName']. " ". @$user['lastName']);
        }
        $this->mailer->Body = $this->emailTemplate();
        return $this->mailer->send();
    }
    public function sendEmail($to,$message,$subject){
        $this->mailer->Subject = $subject;
        if(gettype($to) == 'string'){
            $to = [$to];
        }

        foreach($to as $address){
            if(strpos($address,'e3.com')!==false){
                continue;
            }
            $this->mailer->addAddress($address);
        }
        $this->mailer->Body = $message;

        return $this->mailer->send();
    }
}
class Mailer extends E3Mailer{

    protected function emailBodyTemplate()
    {
        // TODO: Implement emailBodyTemplate() method.
    }

    protected function emailSubject()
    {
        // TODO: Implement emailSubject() method.
    }
}