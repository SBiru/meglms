<?php
namespace English3\WebSocket;

use English3\WebSocket\AdvisoryTopics\Connection;
use English3\WebSocket\Channels\ChannelList;
use React\EventLoop\LoopInterface;
use React\EventLoop\Timer\Timer;

class BrokerServer {
    protected $client;
    /**
     * @var LoopInterface $loop
     */
    public static $loop;
    private $defaultConf=array(
        'host' => '127.0.0.1',
        'port' => 61613,
        'login'=>'persistent_server'
    );
    public function __construct($loop,$config = array()){
        $factory = new \React\Stomp\Factory($loop);
        $this->client = $factory->createClient(array_merge($this->defaultConf,$config));
        self::$loop = $loop;
    }
    public function start(callable $callback = null){
        $this->client->connect()
        ->then(function(){
            $connectionListener = new Connection($this->client);
            $connectionListener->startListening();
            ChannelList::startListening($this->client);
        });
    }
    public function getClient(){
        return $this->client;
    }
    public function stop(){
        $this->client->disconnect();
    }
}
