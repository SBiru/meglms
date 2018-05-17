<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.15.9
 * Time: 15:03
 */
namespace English3\WebSocket\AdvisoryTopics;
use English3\WebSocket\Users\ConnectedUsers;
use English3\WebSocket\Users\E3WSUser;
use React\Stomp\Protocol\Frame;

class Connection {
    private $client;
    public function __construct(\React\Stomp\Client $client){
        $this->client = $client;
    }
    public function startListening(){
        $this->client->subscribe('/topic/ActiveMQ.Advisory.Connection',array($this,'onMessage'));
    }
    public function onMessage(Frame $frame){
        $message = json_decode($frame->body);
        if(@$message->ConnectionInfo && $message->ConnectionInfo->userName != 'persistent_server' && strpos($message->ConnectionInfo->userName, 'server') === false && strpos($message->ConnectionInfo->userName, 'admin') === false && strpos($message->ConnectionInfo->userName, 'system') === false){
            $userId = E3WSUser::getUserIdFromUserName($message->ConnectionInfo->userName);
            if($user = ConnectedUsers::getWithId($userId)){
                $user->addConnectionId($message->ConnectionInfo->connectionId->value);
            }else{
                ConnectedUsers::add(new E3WSUser($message->ConnectionInfo));
            }


        }else if(isset($message->RemoveInfo)){
            $class = '@class';
            if(@$message->RemoveInfo->objectId->$class == 'ConnectionId'){
                ConnectedUsers::removeWithConnectionId($message->RemoveInfo->objectId->value);
            }
        }
        echo (count(ConnectedUsers::getAll()))."\n";
    }
}