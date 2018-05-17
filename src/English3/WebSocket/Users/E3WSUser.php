<?php
namespace English3\WebSocket\Users;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;
use English3\WebSocket\Channels\ActiveScreen;
use English3\WebSocket\Channels\ChannelList;
use English3\WebSocket\Channels\Chat\OnlineUsers;
use English3\WebSocket\Message;

/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.15.9
 * Time: 17:22
 */

class E3WSUser {
    private $connectionInfo;
    private $userId;
    private $userInfo;
    private $currentJob;
    private $onlineUsers;
    private $showAsOffline = false;
    private $connectionIds = array();
    public function __construct(\stdClass $ConnectionInfo = null,Message $message = null){
        if($ConnectionInfo){
            $this->createFromConnectionInfo($ConnectionInfo);
        }else{
            $this->createFromMessage($message);
        }

    }
    private function createFromConnectionInfo($ConnectionInfo){
        $this->connectionInfo = $ConnectionInfo;
        $this->prepareUserId();
        $this->userInfo = UserController::byId(Utility::getInstance()->reader,$this->userId);
    }
    private function prepareUserId(){
        $this->userId = self::getUserIdFromUserName($this->connectionInfo->userName);
        $this->addConnectionId($this->connectionInfo->connectionId->value);
    }
    public static function getUserIdFromUserName($userName){
        return str_replace('user-','',$userName);
    }
    private function createFromMessage(Message $message){
        $this->prepareUserIdFromMessage($message);
        $this->userInfo = UserController::byId(Utility::getInstance()->reader,$this->userId);
    }
    private function prepareUserIdFromMessage(Message $message){
        $this->userId = str_replace('user-','',$message->headers['JMSXUserID']);
        $messageIdParts = explode(':',$message->headers['message-id']);
        $connectionId = $messageIdParts[0].':'.$messageIdParts[1].':'.$messageIdParts[2];
        $this->addConnectionId($connectionId);
    }
    public function addConnectionId($connectionId){
        Utility::addToArrayIfNotExists($connectionId,$this->connectionIds);
    }

    public function hideFromOthers($set=null){
        if(!is_null($set)){
            $this->showAsOffline = $set;
        }
        return $this->showAsOffline;
    }
    public function getUserId(){
        return $this->userId;
    }
    public function getConnectionId(){
        return $this->connectionIds;
    }
    public function removeConnectionId($connectionId){
        if( ($index = array_search($connectionId,$this->connectionIds)) !== false){
            unset($this->connectionIds[$index]);
        }
    }
    public function getUserModel(){
        return $this->userInfo->user;
    }
    public function getUserInfo(){
        return $this->userInfo;
    }
    public function updateCurrentJob(){
        $activeScreenController = ChannelList::getInstance()->getActiveScreenController();
        $activeScreenController->askCurrentJob($this->userId);
    }

    public function getCurrentJob()
    {
        return $this->currentJob;
    }

    public function setCurrentJob($currentJob)
    {
        $this->currentJob = $currentJob;
    }
    public function setOnlineUsers(OnlineUsers $users){
        $this->onlineUsers = $users;
    }
    public function getOnlineUsers(){
        return $this->onlineUsers;
    }
    public function getBasicUserInfo(){
        $user = self::userIntelliSenseHelper($this->getUserModel());
        return [
            'id'=>$user->getUserId(),
            'fname'=>$user->getFirstName(),
            'lname'=>$user->getLastName(),
            'email'=>$user->getEmail(),
        ];
    }
    public static function userIntelliSenseHelper(User $user){
        return $user;
    }
}