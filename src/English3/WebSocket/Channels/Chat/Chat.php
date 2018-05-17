<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 11:36
 */

namespace English3\WebSocket\Channels\Chat;



use English3\Controller\Notifications\ChatEmailNotification;
use English3\Controller\SessionController;
use English3\Controller\SiteController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;
use English3\WebSocket\AdvisoryTopics\ConsumerQueue;
use English3\WebSocket\Channels\ChannelBase;
use English3\WebSocket\Message;
use English3\WebSocket\Users;

class Chat extends ChannelBase{
    protected $clientTopic = '/topic/client.chat';
    protected $serverTopic = '/topic/server.chat';
    private $usersInClasses = array();
    private $advisoryQueue;
    private $log;
    public function __construct(\React\Stomp\Client $client){
        parent::__construct($client);
        $this->advisoryQueue = new ConsumerQueue($client,'client.chat');
        $this->advisoryQueue->setRemoveConnectionCallback(array($this,'sendUserDisconnected'));
        $this->log = new ChatLog();
    }

    public function on($event, Message $message)
    {
        call_user_func(array($this,$event),$message);

    }

    public function newClientConnected(Message $message)
    {

        $me = Users\ConnectedUsers::getWithId($message->userid,$message);
        $me->hideFromOthers(Users\ConnectedUsers::hideUserFromOthers($message->userid));
        $this->sendHideFromOthers($message->userid,$me->hideFromOthers());
        $this->sendOnlineUsers($message);
    }
    private function sendHideFromOthers($userId,$hideFromOthers){
        $message = new Message('hideFromOthers',$hideFromOthers);
        $this->sendMessageToUser($userId,$message);
    }
    public function sendUserDisconnected($userId){
        if(!$this->advisoryQueue->hasSubscriptionUserId($userId)){
            $this->sendOnlineUsers(new Message('onlineUsers',[],null,$userId),false);
        }
    }
    private function sendOnlineUsers(Message $message,$sendToRequestUser = true){
        $message->event = 'onlineUsers';
        $onlineUsers = $this->getOnlineUsers($message->userid,$message);
        foreach($onlineUsers['users'] as $userId=>$user){
            $users = $this->getOnlineUsers($userId,$message);
            if($users!==false){
                $message->data = $users;
                //Users\ConnectedUsers::getWithId($userId)->setOnlineUsers($users);
                $this->sendMessageToUser($userId,$message);
            }
        }
        if($sendToRequestUser){
            $message->data = $onlineUsers;
            $this->sendMessageToUser($message->userid,$message);
        }

    }
    private function openCloseConversation(Message $message){
        $message->data->closed = boolval($message->data->closed);
        $room = $message->data->room;
        $this->log->setGroupClosedState($room,$message->data->closed);
        $this->sendMessageToGroup($message);
    }
    private function hideFromOthers(Message $message){
        $me = Users\ConnectedUsers::getWithId($message->userid);
        $me->hideFromOthers(boolval($message->data));
        Users\ConnectedUsers::hideUserFromOthers($message->userid,boolval($message->data));
        $this->sendMessageToUser($message->userid,$message);
        $this->sendOnlineUsers($message);
    }
    private function message(Message $message){
        $toId = $message->data->to;
        $message->data->from = $message->userid;
        $this->log->saveToDB($message->data);
        $this->sendMessageToUser($toId,$message);
        echo 'Sending'.PHP_EOL;
        ChatEmailNotification::sendIfNeeded($message->data->to,$message->data->from);
    }
    private function messageHasBeenRead(Message $message){
        $from = $message->data->from;
        $to = $message->userid;
        $users =  explode('-',$message->data->room);
        if(count($users)>2){
            $this->log->setGroupMessageReadState($message->data->room,$message->userid);
        }else{
            $this->log->setMessageReadState($from,$to);
        }
        $this->sendMessageToUser($to,$message); // to update in all logged in tabs....
    }

    private function getOnlineUsers($userId,$message)
    {
        $myId = $userId;
        if(!Users\ConnectedUsers::getWithId($myId,$message)){
            return false;
        }
        $onlineUsersBuilder = new OnlineUsers(Users\ConnectedUsers::getWithId($myId,$message)->getUserInfo(), $this->advisoryQueue);
        $onlineUsersBuilder->buildOnlineUsers();
        Users\ConnectedUsers::getWithId($myId)->setOnlineUsers($onlineUsersBuilder);
        return $onlineUsersBuilder->getOnlineUsers();
    }

    private function getAllConnectedUsers(Message $message){
        $filename = self::allOnlineUsersFilename();
        $users = Users\ConnectedUsers::getAndPrepareAll();
        $subscriptions = $this->advisoryQueue->getSubscriptions();
        $print_r = json_encode(['users'=>$users,'subscriptions'=>$subscriptions]);
        file_put_contents($filename, $print_r);
    }
    public function unsubscribe($token)
    {
        $this->sendUserDisconnected($token);
        Utility::removeFromArrayIfExists($token,$this->onlineUsers);
    }
    public static function prepareUser(User $user){
        return [
            'id' => $user->getUserId(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'email' => $user->getEmail(),
            'profilePicture' => $user->getProfilePicture()
        ];
    }
    protected function sendMessageToGroup(Message $message){
        $me = Users\ConnectedUsers::getWithId($message->userid)->getUserModel();
        $message->data->fromName = $me->getFirstName().' '.$me->getLastName();
        parent::sendMessageToGroup($message);
    }
    public static function allOnlineUsersFilename(){
        global $PATHS;
        return $PATHS->app_path . '/public/useruploads/onlineusers.json';
    }

}


class OnlineChatUsers{
    private $forUser;
    private $advisoryTopic;
    private $showClassGroup;
    private $onlineUsers = array(
        'byClass'=>array(),
        'byUser'=>array(),
        'bySite'=>array()
    );
    public function __construct(UserController $forUser,ConsumerQueue $advisoryTopic){
        $this->forUser  = $forUser;
        $this->advisoryTopic  = $advisoryTopic;
    }
    public function buildOnlineUsers(){
        $this->prepareClassUsers();
        $this->onlineUsers['showClassGroup']=$this->showClassGroup;
        $this->onlineUsers['byUser'] = array_values($this->onlineUsers['byUser']);
        $this->onlineUsers['byClass'] = array_values($this->onlineUsers['byClass']);
        $this->onlineUsers['bySite']= $this->groupBySite();
    }
    private function prepareClassUsers(){
        foreach ($this->forUser->classes as $class) {
            $class['students']=array();
            $class['teachers']=array();
            Utility::addToObjectIfNotExists($class['id'],[
                'id'=>$class['id'],
                'name'=>$class['name'],
            ],$this->onlineUsers['byClass']);
            if($class['isStudent']){
                $onlineTeachers = &$this->onlineUsers['byClass'][$class['id']]['teachers'];
                $onlineTeachers = $this->getOnlineTeachersForClass($class['id']);
                $this->onlineUsers['byClass'][$class['id']]['hasEntries'] = count($onlineTeachers);
                if(count($onlineTeachers)){
                    $this->showClassGroup = true;
                }

            }
            if($class['isTeacher']){
                $onlineStudents = &$this->onlineUsers['byClass'][$class['id']]['students'];
                $onlineStudents = $this->getOnlineStudentsForClass($class['id']);
                $this->onlineUsers['byClass'][$class['id']]['hasEntries'] = count($onlineStudents);
                if(count($onlineStudents)){
                    $this->showClassGroup = true;
                }
            }
        }
    }
    private function getOnlineTeachersForClass($classId){
        return $this->getOnlineUsersForClassWithRole('isTeacher',$classId);
    }
    private function getOnlineStudentsForClass($classId){
        return $this->getOnlineUsersForClassWithRole('isStudent',$classId);
    }
    private function getOnlineUsersForClassWithRole($checkRoleMethod,$classId){
        $users = array();
        foreach($this->advisoryTopic->getSubscriptions() as $connectedUserId){
            $user = Users\ConnectedUsers::getWithId($connectedUserId);
            $connectedUser = $user->getUserInfo();
            if(call_user_func(array($connectedUser,$checkRoleMethod),$classId,false)){
                $this->addOnlineUserToByUserList($connectedUser,$checkRoleMethod,$classId);
                $users[] = Chat::prepareUser($connectedUser->user);
            }
        }
        return $users;
    }

    private function addOnlineUserToByUserList(UserController $userInfo,$role,$classId){
        $userId = $userInfo->user->getUserId();

        Utility::addToObjectIfNotExists($userId,array_merge(
                Chat::prepareUser($userInfo->user),[
                'teacherFor'=>array(),
                'studentFor'=>array(),
                'loggedInSince'=>SessionController::loggedInSince($userId),
                'site'=>SiteController::_getSiteForUser($userId)
            ])
        ,$this->onlineUsers['byUser']);
        if($role=='isTeacher'){
            Utility::addToArrayIfNotExists($classId,$this->onlineUsers['byUser'][$userId]['teacherFor']);
        }
        if($role=='isStudent'){
            Utility::addToArrayIfNotExists($classId,$this->onlineUsers['byUser'][$userId]['studentFor']);
        }

    }
    private function groupBySite(){
        $sites = array();
        foreach($this->onlineUsers['byUser'] as $user){
            if(!$user['site']) continue;
            Utility::addToObjectIfNotExists($user['site'],['name'=>$user['site'],'users'=>array()],$sites);
            $sites[$user['site']]['users'][] =$user;

        }
        return array_values($sites);
    }
    public function getOnlineUsers(){
        return $this->onlineUsers;
    }


}