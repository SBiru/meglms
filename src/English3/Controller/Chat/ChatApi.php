<?php
namespace English3\Controller\Chat;


use English3\Controller\Utility;
use English3\WebSocket\Channels\Chat\Chat;
use English3\WebSocket\Channels\Chat\ChatLog;
use English3\WebSocket\Channels\Chat\OfflineUsers;
use English3\WebSocket\Message;
use English3\WebSocket\ServerMessager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ChatApi {
    public function loadRoomLog(Request $request, $room){
        $log = new ChatLog();
        return new JsonResponse($log->getRoomLog($room));
    }
    public function downloadRoomLog(Request $request,$room){
        $logCtrl = new ChatLog();
        $log = $logCtrl->getRoomLog($room);
        $txt = '';
        $users = $logCtrl->getGroupUsers($room,0);
        $mappedUsers = [];
        foreach($users as $user){
            $mappedUsers[$user['id']] =$user;
        }
        foreach($log as $msg){
           $txt.=sprintf("[%s] %s: %s\n",$msg['created'],$this->prepareUserName($mappedUsers[$msg['from']]),$msg['message']);
        }

        return new JsonResponse(['content'=>$txt,'filename'=>$this->prepareFilename($users)]);
    }

    private function prepareFilename($users){
        return implode('_',array_map(function($user){
            return $this->prepareUserName($user);
        },$users)).'_chat.txt';
    }
    private function prepareUserName($user){
        return $user['firstName'].' '.$user['lastName'];
    }
    public function loadGroupRooms(Request $request){
        $myId = $_SESSION['USER']['ID'];
        $log = new ChatLog();
        return new JsonResponse($log->getGroupRooms($myId));
    }
    public function getUnreadMessages(Request $request){
        $myId = $_SESSION['USER']['ID'];
        $log = new ChatLog();
        $unread = $log->getUnreadRooms($myId);
        if(!count($unread)){
            $unread =['1'=>0];
        }

        return new JsonResponse($unread);
    }
    public function getOfflineUsers(Request $request){
        $myId = $_SESSION['USER']['ID'];
        $users = new OfflineUsers($myId);
        return new JsonResponse($users->getAll());
    }
    public function getAllConnectedUsers(Request $request){
        Utility::getInstance()->checkAdmin();
        $message = new Message('getAllConnectedUsers',[]);
        ServerMessager::sendSimpleMessage('/topic/server.chat',$message);
        return new JsonResponse(['file'=>'/public/useruploads/onlineusers.json']);
    }

    public static function chatMode(){
        return new ChatMode();
    }

}
