<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 11:36
 */

namespace English3\WebSocket\Channels;


use English3\Controller\Utility;
use English3\WebSocket\EventManager;
use English3\WebSocket\Message;
use English3\WebSocket\Users;
use Ratchet\ConnectionInterface;
use React\Stomp\Protocol\Frame;


abstract class ChannelBase {
    protected $subscribers;
    protected $client;
    protected $clientTopic;
    protected $serverTopic;
    public function __construct(\React\Stomp\Client $client){
        $this->client=$client;
        $this->startListening($this->serverTopic,$client);
    }
    protected function startListening($topic,\React\Stomp\Client $client)
    {
        $client->subscribe($topic,array($this,'onMessage'));
    }
    public function onMessage(Frame $frame){
        $message = Message::fromFrame($frame);
        $this->on($message->event,$message);
    }

    abstract public function on($event, Message $message);

    protected function sendMessageToUser($userId,Message $msg){
        if($userId == 'group'){
            return $this->sendMessageToGroup($msg);
        }
        $this->client->send($this->clientTopic,$msg->prepareToSend(),['toUserId'=>$userId,'JMSExpiration'=>time()*1000 + 15000,'JMSDeliveryMode'=>'Persistent']);
    }
    protected function sendMessageToGroup(Message $message){
        if($room = @$message->data->room){
            $users = explode('-',$room);
            foreach($users as $user){
                if($user != $message->userid){
                    $this->sendMessageToUser($user,$message);
                }
            }
        }
    }

}