<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 10:45
 */

namespace English3\WebSocket;


use English3\Controller\Utility;
use English3\WebSocket\Channels\ChannelList;
use Ratchet\ConnectionInterface;


class EventManager {
    public static $subscriptions = array();
    public static function handle(ConnectionInterface $from, Message $message){
        $channelList = ChannelList::getInstance()->getList();
        if(!$message->channel || !$handler =  $channelList[$message->channel]){
            $e = new Error($from,'Invalid channel',$message->channel);
            return $e->send();
        }
        if(!@$message->event){
            $e = new Error($from,'Invalid event',$message->channel);
            return $e->send();
        }
        if($message->event=='subscribe'){
            $handler->subscribe($from,$message);
            $handler->addToSubscriptions($from,$message->channel);

        }else{
            $handler->on($message->event,$from,$message);
        }

    }
    public static function cleanUpChannels($token){
        $channelList = ChannelList::getInstance()->getList();
        if($channels = @self::$subscriptions[$token]){
            foreach ($channels as $channel) {
                $handler =  $channelList[$channel];
                $handler->unsubscribe($token);
            }
        }

    }

}