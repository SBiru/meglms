<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 10:24
 */

namespace English3\WebSocket;


use React\Stomp\Protocol\Frame;

class Message {
    public $headers;
    public $userid;
    public $event;
    public $data;
    public static function fromFrame(Frame $frame){
        $body = json_decode($frame->body);
        $userId = str_replace('user-','',$frame->headers['JMSXUserID']);
        return new Message($body->event,$body->data,$frame->headers,$userId);
    }
    public function __construct($event,$data,$headers=null,$userid=null){
        $this->data=$data;
        $this->event=$event;
        $this->userid=$userid;
        $this->headers=$headers;
    }
    public function prepareToSend(){
        return json_encode([
            'event'=>$this->event,
            'data'=>$this->data
        ]);
    }
}