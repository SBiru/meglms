<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.12
 * Time: 16:08
 */

namespace English3\WebSocket\Channels\AutomatedAlerts;


use Kahlan\Plugin\Call\Message;
use React\Stomp\Client;

class Logger {
    private static $config = [
        'writeToFile'=>false,
        'logFile'=>'alerts.log',
        'sendToClient'=>true,
        'clientTopic'=>'/topic/client.alerts',
        'event'=>'alertLog',
        'echo'=>false,
    ];
    /**
     *@var \React\Stomp\Client
     */
    private static $client;
    public static function setConfig(array $config){
        self::$config = array_merge(self::$config,$config);
    }
    public static function setClient(Client $client){
        self::$client = $client;
    }

    public static function DEBUG($message){
        global $PATHS;
        self::LOG($message,$config=['echo'=>true,
        'writeToFile'=>true,
        'logFile'=>$PATHS->app_path.'/websockets.log']);
    }
    public static function LOG($message,$config=null){
        $config = $config?array_merge(self::$config,$config):self::$config;
        $message = self::prependTime($message);
        if($config['writeToFile']){
            self::writeToFile($message);
        }
        if($config['echo']){
            echo $message. PHP_EOL;
        }
        if($config['sendToClient']){
            self::sendToClient($message,$config);
        }
    }
    private static function prependTime($message){
        return date('Y-m-d H:i:s').' --- ' . $message;
    }
    private static function writeToFile($message){

    }

    private static function sendToClient($message,$config){
        if(self::$client){
            $msg = new \English3\WebSocket\Message($config['event'],['msg'=>$message]);
            self::$client->send($config['clientTopic'],$msg->prepareToSend());
        }
    }
}