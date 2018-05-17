<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails;

use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\BaseTemplate;
use English3\Controller\EmailController;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\Users\UserGuardiansArray;
use English3\Model\User;
use Exception;

abstract class BaseAlertEmail {
    protected $orgId;
    protected $students;
    protected $testLimit;
    protected $userGuardians;
    private $emailSubject;
    #private $testerEmail = 'moises.lizarraga@english3a.com';
    private $testerEmail = [['email'=>'dennyserejom@gmail.com'],['email'=>'moises.lizarraga@english3.com']];
    #private $testerEmail = [['email'=>'dennyserejom@gmail.com']];
    protected $preview =false;
    protected $options = array();

    public function __construct($orgId,$emailSubject='Test',$testVersion=true){
        $this->orgId = $orgId;
        $this->testLimit = 2;
        $this->emailSubject = $emailSubject;
    }
    public function setPreview($preview){
        $this->preview = $preview;
    }
    public abstract function getStudents();
    public abstract function emailStudents();
    public function emailAdmins(){}
    public function emailTeachers(){}
    public function emailAdvisors(){
        //TODO: Remove test code parts
        $this->checkIfStudentsAreLoaded();
        $addressees = $this->prepareAddressees('advisors');
        return $this->sendEmailToParentsOrAdvisors($addressees,'advisor');
    }
    public function emailParents(){
        //TODO: Remove test code parts
        $this->checkIfStudentsAreLoaded();
        $addressees = $this->prepareAddressees('parents');
        return $this->sendEmailToParentsOrAdvisors($addressees,'parent');
    }
    public abstract function emailUser($email);
    protected abstract function sendEmailToParentsOrAdvisors($addressees,$role);
    protected function getPreview(BaseTemplate $mailMessage){

    }
    protected function sendEmail(BaseTemplate $mailMessage){
        $this->checkSendTo();
        $user = $this->mockUser($this->testerEmail);
        $sender = new MailSender($user);
        $sender->setBody($mailMessage->getBody());
        $sender->setSubject($this->emailSubject);
        $sender->getHeaderFromOrgConfig($this->orgId);
        $sender->send($this->testerEmail);
    }
    public function checkSendTo(){
        return true;
    }
    public function mockUser($email){
        $user = new User();
        $user->setEmail($email);
        return $user;
    }
    protected function prepareAddressees($type='parents'){
        if($this->preview) return $this->mockPreviewParents($type);
        $addressees = array();
        $this->checkAndLoadGuardians();
        foreach($this->students as $student){
            $userGuardians = $this->userGuardians[$student['id']][$type];
            if(!$userGuardians){
                continue;
            }
            foreach($userGuardians as $addressee){
                $this->createAddresseeIfNotExists($addressees,$addressee);
                $this->addStudentToAddressee($addressees[$addressee['id']],$student);
            }
        }
        return $addressees;
    }
    protected function mockPreviewParents($type='parents'){
        return [
            [
                'id'=>1,
                'name'=>$type.' Demo',
                'email'=>'demo@'.$type.'.com',
                'students'=>[
                    [
                        'id'=>24,
                        'first_name'=>'Student',
                        'last_name'=>'Demo',
                        'name'=>'Demo, Student',
                        'fullName'=>'Student Demo',
                        'phone'=>'XXX-XXX-XXXX'

                    ]
                ]
            ]
        ];
    }
    protected function createAddresseeIfNotExists(&$addressees,$addressee){
        if(!@$addressees[$addressee['id']]){
            $addressee['students']=array();
            $addressees[$addressee['id']]=$addressee;
        }

    }
    protected function addStudentToAddressee(&$addressee,$student){
        unset($student['advisors']);
        unset($student['parents']);
        $addressee['students'][]=$student;
    }
    protected function checkIfStudentsAreLoaded(){
        if(!$this->students){
            throw new AlertEmailException("No student was found.",1);
        }
    }
    protected function checkAndLoadGuardians(){
        if(!is_null($this->userGuardians)){
            return;
        }
        $userIds = array_map(function($user){
            return $user['id'];
        },$this->students);
        $userGuardiansArray = new UserGuardiansArray();
        $this->userGuardians = $userGuardiansArray->getGuardiansGivenUserIds($userIds);
    }

    public function setOptions(array $options){
        $this->options = $options;
    }

}
class MailSender extends E3Mailer{
    protected $subject;
    protected $body;
    protected function emailBodyTemplate()
    {
        return $this->body;
    }
    public function setBody($body){
        $this->body = $body;
    }
    public function setSubject($subject){
        $this->subject = $subject;
    }
    protected function emailSubject()
    {
        return $this->subject;
    }
}
class AlertEmailException extends Exception{
    public function __construct($message, $code = 0, Exception $previous = null){
        parent::__construct($message, $code, $previous);
    }

}