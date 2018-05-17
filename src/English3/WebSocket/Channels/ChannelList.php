<?php
namespace English3\WebSocket\Channels;



use English3\WebSocket\Channels\AutomatedAlerts\Manager;
use English3\WebSocket\Channels\Chat\Chat;
use English3\WebSocket\Channels\Forum\Forum;

class ChannelList {
    private static $instance;
    private $list;
    public static function startListening(\React\Stomp\Client $client){
        self::getInstance($client);
    }
    public static function getInstance(\React\Stomp\Client $client = null){
        if(!self::$instance){
            self::$instance = new ChannelList($client);
        }
        return self::$instance;
    }
    private function __construct($client){
        $this->list = [
            'chat' => new Chat($client),
            'activeScreen' => new ActiveScreen($client),
            'alerts' => new Manager($client),
            'forum' => new Forum($client)
        ];
    }
    public function getList(){
        return $this->list;
    }

    /**
     * @return ActiveScreen
     */
    public function getActiveScreenController(){
        return $this->list['activeScreen'];
    }
}