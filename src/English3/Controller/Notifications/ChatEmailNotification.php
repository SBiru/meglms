<?php
namespace English3\Controller\Notifications;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\NotificationsController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;

class ChatEmailNotification
{
    private $senderId;
    private $receiverId;

    public static function sendIfNeeded($senderId,$receiverId){
        $self = new self($senderId,$receiverId);
        $self->_sendIfNeeded();
    }

    public function __construct($senderId,$receiverId){
        $this->senderId = $senderId;
        $this->receiverId = $receiverId;
    }
    private function _sendIfNeeded(){
        if(!$this->checkUserFlag()){
            return;
        }
        $this->sendToUser();
    }
    private function checkUserFlag(){
        echo $this->receiverId;
        return NotificationsController::shouldSendEmailNotificationToUser($this->receiverId)||
            NotificationsController::shouldSendEmailNotificationToUser($this->receiverId,'teacher');
    }

    private function sendToUser(){
        $sender = UserController::byId(null,$this->senderId);
        $receiver = UserController::byId(null,$this->receiverId);
        $mailer = new TemplateNewMessage($sender->user,$receiver->user);
        $mailer->send();
    }


}
//class WorkerMailThread extends \Thread{
//    private $mailer;
//    public function __construct(E3Mailer $mailer){
//        $this->mailer = $mailer;
//    }
//    public function run(){
//        $this->mailer->send();
//    }
//}
class TemplateNewMessage extends E3Mailer{
    private $senderName;


    /**
     * TemplateNewStudentPost constructor.
     * @param User $receiver
     * @param User $sender
     */
    public function __construct(User $receiver, User $sender){
        parent::__construct($receiver);
        $this->headerText = 'New message';
        $this->senderName = $sender->getFirstName().' '.$sender->getLastName();

    }
    protected function emailBodyTemplate()
    {

        $email_message = '<div style="position:relative;width:89%;background:white;margin:1% auto;border-radius:5px;box-shadow:5px 5px 30px rgba(0,0,0,.6);padding:4%;">';
        $email_message .= '<p style="font-size:2.5vmin;margin-top:-10px;"> Hello ' . $this->user->getFirstName() . ',</p>';
        $email_message .= "<p style='font-size:2.5vmin;margin-top:-10px;'> You have received a new message from $this->senderName</p>";
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
        return "You have received a new message from $this->senderName";
    }
}