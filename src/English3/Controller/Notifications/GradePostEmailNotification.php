<?php
namespace English3\Controller\Notifications;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\NotificationsController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;

class GradePostEmailNotification
{
    private $studentId;
    private $classId;
    private $postId;
    private $teacherId;
    /**
     * @var ActivityInfo
     */
    private $activityInfo = null
    ;
    public static function sendIfNeeded($teacherId,$studentId,$classId,$postId){
        $self = new self($teacherId,$studentId,$classId,$postId);
        $self->_sendIfNeeded();
    }

    public function __construct($teacherId,$studentId,$classId,$postId){
        $this->classId = $classId;
        $this->studentId = $studentId;
        $this->postId = $postId;
        $this->teacherId = $teacherId;
    }
    private function _sendIfNeeded(){
        if(!$this->checkUserFlag()){
            return;
        }
        $this->sendToUser();
    }
    private function checkUserFlag(){
        return NotificationsController::shouldSendEmailNotificationToUser($this->studentId);
    }

    private function sendToUser(){
        $student = UserController::byId(null,$this->studentId);
        $teacher = UserController::byId(null,$this->teacherId);
        $activityInfo = $this->getActivityInfo();
        $mailer = new TemplateNewTeacherPost($student->user,$teacher->user,
            $activityInfo->className,$activityInfo->pageName);
        $mailer->send();
    }
    private function getActivityInfo(){
        if(!$this->activityInfo){
            $this->activityInfo = new ActivityInfo(Utility::getInstance()->fetchRow($this->queryGetActivityInfo,
                ['postId'=>$this->postId]));
        }
        return $this->activityInfo;
    }
    private $queryGetActivityInfo = <<<SQL
    SELECT p.name as pageName, concat(c.name,if(g.id,concat(' - ',g.name),'')) as className FROM posts
      JOIN pages p on posts.pageid = p.id
      JOIN classes c on c.id = posts.classid
      LEFT join groups g on g.id = posts.groupid
      WHERE posts.id = :postId
SQL;

}
class ActivityInfo{
    public $pageName;
    public $classname;
    public function __construct($row){
        $this->pageName = $row['pageName'];
        $this->className = $row['className'];
    }
}
class TemplateNewTeacherPost extends E3Mailer{
    private $className;
    private $activityName;
    private $teacherName;


    /**
     * TemplateNewStudentPost constructor.
     * @param User $teacher
     * @param User $student
     * @param string $className
     * @param string $activityName
     */
    public function __construct(User $student, User $teacher, $className,$activityName){
        parent::__construct($student);
        $this->headerText = 'New message';
        $this->className = $className;
        $this->activityName = $activityName;
        $this->teacherName = $teacher->getFirstName().' '.$teacher->getLastName();
        $this->studentId = $student->getUserId();
    }
    protected function emailBodyTemplate()
    {

        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:2.5vmin;margin-top:-10px;"> Hello ' . $this->user->getFirstName() . ',</p>';
        $email_message .= "<p style='font-size:2.5vmin;margin-top:-10px;'> You have received a new message from $this->teacherName on $this->className - $this->activityName </p>";
        $email_message .= '
        <p style="font-size:2.5vmin;margin-top:-10px;">
            <div style="text-align: center; margin-top:30px">
                <a href="http://elearn.english3.com" style="text-decoration:none;padding:6px 12px;font-size:14px;line-height:1.42857143;border-radius:4px;display:inline-block;margin-bottom:0;font-weight:400;text-align:center;vertical-align:middle;background-image:none;border:1px solid transparent;white-space:nowrap;color:#fff;background-color:#5cb85c;border-color:#4cae4c" target="_blank" ">
                    Log in to respond
                </a>
            </div>
        </p>';
        $email_message .= '</div>';
        return $email_message;
    }

    protected function emailSubject()
    {
        return "You have received a new message on $this->className - $this->activityName ";
    }
}