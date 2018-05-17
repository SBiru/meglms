<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.3.8
 * Time: 14:27
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\ClassesController;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class EmailCompletedTest {
    private $isJ1;
    public function studentCompletedTest(Request $request, $userId,$classId){
        $this->isJ1 = ClassesController::isJ1($classId);
        if(ClassesController::isPracticeTest($classId)){
            return 'ok';
        }
        $sentEmailsStatus = $this->getCompletedTestEmailStatus($userId,$classId);
        $user = UserController::byId(Utility::getInstance()->reader,$userId);
        $class = ClassesController::_getClass($classId);
        if($sentEmailsStatus['finished_test']) {
            return new JsonResponse(['ok']);
        }

        if($this->isJ1){
            $this->emailTeachersIfNecessary($user,$class);
            $this->setCompletedTestEmailStatus($userId,$classId,$sentEmailsStatus);
        }else{
            $sender = new CompletedTestEmailTemplate($user->user,$class);
            $success = $sender->send();
            if($success){
                $this->setCompletedTestEmailStatus($userId,$classId,$sentEmailsStatus);
            }
        }

        return new JsonResponse(['ok']);
    }
    public static function _studentCompletedTest($userId,$classId){
        global $PATHS;
        $server = (@$PATHS->httpOrHttps?:'http') . '://'. $_SERVER['SERVER_NAME'];
        $cmd = "curl '{$server}/api/proficiency-test/user/{$userId}/completed/{$classId}' -X POST -H 'Content-Type: application/json' -H 'Accept: application/json'  &> /dev/null &";
        exec($cmd);
    }

    private function setCompletedTestEmailStatus($userId,$classId,$currentStatus){
        $currentStatus['finished_test'] = true;
        Utility::getInstance()->reader->update('user_classes',['completion_email_sent'=>json_encode($currentStatus)],['classid'=>$classId,'userid'=>$userId]);
    }
    private function getCompletedTestEmailStatus($userId,$classId){
        $currentStatus = Utility::getInstance()->fetchOne("SELECT completion_email_sent From user_classes uc WHERE uc.classid = :classId and uc.userid = :userId",['classId'=>$classId,'userId'=>$userId]);
        $currentStatus = $currentStatus?:'{}';
        return json_decode($currentStatus,true);

    }
    private function emailTeachersIfNecessary($student,$class){
        $teachers = $this->getTeachers($class['id']);
        foreach($teachers as $teacher){
            if(EmailUsers::canSendJ1Teacher($teacher['id'])){
                $t = UserController::byId(Utility::getInstance()->reader,$teacher['id']);
                $sender = new TemplateSubmittedTestEmailForTeachers($t->user,$student->user,$class);
                $sender->send();
            }
        }
    }
    private function getTeachers($classId){
        return Utility::getInstance()->fetch($this->queryGetTeachers,['classId'=>$classId]);
    }
    private $queryGetTeachers = <<<SQL
    SELECT distinct u.id,fname,lname,email from users u 
    join user_classes uc on u.id = uc.userid
    where uc.classid = :classId and uc.is_teacher = 1
  
SQL;
}
class CompletedTestEmailTemplate extends E3Mailer{
    private $class;
    public function __construct(User $user,$class){
        parent::__construct($user);
        $this->headerText = 'Test completed';
        $this->class = $class;
    }
    protected function emailBodyTemplate()
    {
        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Hello ' . $this->user->getFirstName() . ',</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> You have successfully completed the '. $this->class['name'] .'. You will receive a confirmation email once your test has been graded. </p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> Warm regards,</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> The English3 Team </p>';
        $email_message .= '</div>';
        return $email_message;
    }

    protected function emailSubject()
    {
        return "You have successfully completed the " . $this->class['name'];
    }
}

