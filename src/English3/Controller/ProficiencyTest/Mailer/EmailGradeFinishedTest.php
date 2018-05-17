<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.3.8
 * Time: 14:27
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\ClassesController;
use English3\Controller\Exports\J1Certificate\J1Certificate;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\UserController;
use English3\Controller\UserMetaController;
use English3\Controller\Utility;
use English3\Model\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class EmailGradeFinishedTest {
    public static function testGradeCompleted($userId,$classId){

        $user = UserController::byId(Utility::getInstance()->reader,$userId);
        $class = ClassesController::_getClass($classId);
        $studentSender = new GradedTestEmailTemplate($user->user,$class);
        self::emailAdminsIfNeeded($userId,$class,$user->user);
        if(ClassesController::isJ1($classId)){
            $certificateFilename = self::createCertificate($userId,$classId,false);
            if($certificateFilename){
                $sender = new TemplateGradedJ1CertificateEmailForApplicant($user->user,$class,$certificateFilename);
                $sender->send();
                unlink($certificateFilename);
            }
            EmailUsers::setCompletedTestEmailStatus($userId,$classId,EmailUsers::getCompletedTestEmailStatus($userId,
                $classId),'grade_finished');
            return new JsonResponse('ok');
        }
        EmailUsers::sendEmail($userId,$classId,'grade_finished',$studentSender);
        return new JsonResponse(['ok']);
    }
    private static function emailAdminsIfNeeded($userId,$class,User $student){

        if(!EmailUsers::shouldSendEmail($userId,$class['id'],'grade_finished')) return;

        $ids = Utility::getInstance()->fetch(self::$queryGetAdmins,['classId'=>$class['id'],'userId'=>$userId]);
        $isJ1 = ClassesController::isJ1($class['id']);
        $filename = '';
        if($isJ1){

            $filename = self::createCertificate($userId,$class['id']);
            if($filename){
                self::sendDepartmentEmail($userId,$student,$class,$filename);
            }
        }
        foreach($ids as $row){
            if($isJ1 && !EmailUsers::canSendJ1Admin($row['id'])){
                continue;
            }
            if(!$isJ1 && !EmailUsers::canSendE3PTAdmin($row['id'])){
                continue;
            }
            $admin = UserController::byId(Utility::getInstance()->reader,$row['id']);
            if($isJ1){
                if($filename){
                    $sender = new TemplateGradedJ1CertificateEmailForAdmins($admin->user,$student,$class,$filename);
                }else{
                    $sender = new TemplateGradedJ1EmailForAdmins($admin->user,$student,$class);
                }

            }else{
                $sender = new TemplateGradedTestEmailForAdmins($admin->user,$student,$class);
            }

            $sender->send();
        }
        unlink($filename);
    }
    private  static function createCertificate($userId,$classId,$official=true){
        return J1Certificate::createCertificateFile($userId,$classId,$official);
    }
    private static function sendDepartmentEmail($userId,$student,$class,$certificate){
        $address =  UserMetaController::getField($userId,'department_email');
        $name =  UserMetaController::getField($userId,'department_contact');
        if($address){
            $departmentContact = new User();
            $departmentContact->setEmail($address);
            $departmentContact->setFirstName($name);
            $sender = new TemplateGradedJ1DepartmentEmailForAdmins($departmentContact,$student,$class,$certificate);
            $sender->send();
        }

    }

    private static $queryGetAdmins = <<<SQL
    SELECT u.id FROM users u
  JOIN user_classes ac ON ac.userid = u.id
WHERE ac.classid = :classId and ac.is_test_admin = 1
GROUP BY u.id
union
  select a.userid from proficiency_schools_admins a
  join user_meta m on m.meta_value = a.schoolid
  where m.meta_key = 'e3pt_school_id' && m.userid = :userId
SQL;

}
class GradedTestEmailTemplate extends E3Mailer{
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
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> We have graded the '. $this->class['name'] .' you completed on '. date("M/d/y") .'. You can log into our platform with your user name and password to view your score. </p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> If you have any question or concern about your test score please send an email to matthew.heiner@english3.com.</p>';
        $email_message .= '<p style="font-size:1.3em;margin-top:-10px;"> The English3 Team </p>';
        $email_message .= '</div>';
        return $email_message;
    }

    protected function emailSubject()
    {
        return "We have graded the " . $this->class['name'];
    }
}

