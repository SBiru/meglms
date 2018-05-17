<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.15.9
 * Time: 15:03
 */
namespace English3\WebSocket\AdvisoryTopics;
use English3\Controller\Utility;
use English3\WebSocket\Users\ConnectedUsers;
use React\Stomp\Protocol\Frame;

class ConsumerQueue {
    private $client;
    private $queue;
    private $subscriptions = array();
    private $connectionIds = array();
    private $newConnectionCallback;
    private $removeConnectionCallback;
    public function __construct(\React\Stomp\Client $client, $queue){
        $this->client = $client;
        $this->queue = $queue;
        $this->startListening();
    }
    public function setNewConnectionCallback($callback){
        $this->newConnectionCallback = $callback;
    }
    public function setRemoveConnectionCallback($callback){
        $this->removeConnectionCallback = $callback;
    }
    public function startListening(){
        $this->client->subscribe('/topic/ActiveMQ.Advisory.Consumer.Topic.' . $this->queue,array($this,'onMessage'));
    }
    public function onMessage(Frame $frame){
        $message = json_decode($frame->body);
        if(@$message->ConsumerInfo){
            $this->addSubscription($message);
        }else if(@$message->RemoveInfo){
            $userId = $this->removeSubscription($message);
            if(@$this->removeConnectionCallback){
                call_user_func($this->removeConnectionCallback,$userId);
            }
        }
    }
    private function addSubscription($message){
        if(isset($message->ConsumerInfo->selector) && $userId = $this->getUserIdFromSelector($message->ConsumerInfo->selector)){
            Utility::addToObjectIfNotExists($userId,[],$this->subscriptions);
            $this->subscriptions[$userId][] = $message->ConsumerInfo->consumerId->connectionId;
            $this->connectionIds[$message->ConsumerInfo->consumerId->connectionId] = $userId;
        }
    }
    private function getUserIdFromSelector($selector){
        $userId = str_replace('convert_string_expressions:toUserId = ','',$selector);
        return intval($userId)?:false;
    }
    private function removeSubscription($message){
        $class = '@class';
        $userId = null;
        if(@$message->RemoveInfo->objectId->$class == 'ConsumerId'){
            $connectionId  = $message->RemoveInfo->objectId->connectionId;
            if($userId = $this->connectionIds[$connectionId]){
                if( ($index = array_search($connectionId,$this->subscriptions[$userId])) !== false){
                    unset($this->subscriptions[$userId][$index]);
                    if(count($this->subscriptions[$userId])==0){
                        unset($this->subscriptions[$userId]);
                    }
                }
                unset($this->connectionIds[$connectionId]);
            }
        }
        return $userId;
    }
    public function hasSubscriptionUserId($userId){
        return array_key_exists($userId,$this->subscriptions) !== false;
    }
    public function getSubscriptions(){
        return $this->subscriptions;
    }
}