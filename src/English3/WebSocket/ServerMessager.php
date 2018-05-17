<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.12
 * Time: 16:42
 */

namespace English3\WebSocket;


class ServerMessager {
    public static function sendSimpleMessage($destination,Message $message){
        $server = new self('server'.time());
        $server->start(function() use ($server,$destination,$message){
            $server->getClient()->send($destination,$message->prepareToSend());
            $server->loop->addTimer(0,function()use($server){
                $server->stop();
            });
        });
    }
    private $server;
    public $loop;
    public function __construct($name){
        $this->loop = \React\EventLoop\Factory::create();
        $this->server = new Server($this->loop,['login'=>$name]);
    }
    public function start(callable $callback){
        $this->server->start($callback);
        $this->loop->run();
    }
    public function stop(){
        $this->server->stop();
        $this->loop->stop();
    }
    public function getClient(){
        return $this->server->getClient();
    }
}
class Server extends BrokerServer {
    public function start(callable $callback){
        $this->client->connect()->then($callback);
    }
}