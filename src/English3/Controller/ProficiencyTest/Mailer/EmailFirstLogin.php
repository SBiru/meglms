<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.3.11
 * Time: 10:19
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\Mailer\E3Mailer;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;

class EmailFirstLogin extends E3Mailer{
    private $student;
    private $classes;
    public function __construct(User $user,UserController $student){
        parent::__construct($user);
        $this->headerText = 'New Login';
        $this->student = $student;
    }
    protected function emailBodyTemplate()
    {
        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Hello ' . $this->user->getFirstName() . ',</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> '. $this->student->user->getFirstName().' '.$this->student->user->getLastName() .'('.$this->student->user->getEmail().')'.' has logged in for the first time to '. $_SERVER['HTTP_HOST'] . '</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> The student courses are:</p>';
        $email_message .= $this->courses();
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Warm regards,</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> The English3 Team </p>';
        $email_message .= '</div>';
        return $email_message;
    }
    protected function courses(){
        $email_message='';
        foreach($this->getClasses() as $class){
            $email_message .= '<p style="font-size:2.0vmin;">'.$class.'</p>';
        }
        return $email_message;
    }

    protected function emailSubject()
    {
        $subject = ["New Login",$this->org(), $this->classNames(),$this->server()];
        return implode(' - ',$subject);
    }
    protected  function org(){
        return Utility::getInstance()->fetchOne('SELECT name FROM organizations where id = :id',['id'=>$this->student->user->getOrgId()]);
    }
    protected  function getClasses(){
        if(!$classes = $this->classes){
            $classes = array_map(function($c){
                return $c['abbreviation'];
            },Utility::getInstance()->fetch('SELECT abbreviation FROM products JOIN user_classes uc on uc.classid = products.classid WHERE uc.userid = :id',['id'=>$this->student->user->getUserId()]));
        }
        return $classes;
    }
    protected  function classNames(){
        return implode(' ',$this->getClasses());
    }
    protected  function server(){
        global $PATHS;
        return $PATHS->serverName;
    }
}