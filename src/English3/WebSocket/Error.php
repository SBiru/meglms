<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 10:22
 */

namespace English3\WebSocket;

use Ratchet\ConnectionInterface;

class Error {
    private $to;
    private $message;


    public function __construct(ConnectionInterface $to,$id,$userId,$messageTxt,$channel=''){
        $this->to = $to;
        $this->buildMessage($messageTxt,$id,$userId,$channel);

    }
    private function buildMessage($messageTxt,$id,$userId,$channel){
        $this->message = new Message($id,$userId,'error',['reason'=>$messageTxt],null,$channel);
    }
    public function send(){
        $this->to->send($this->message->toJson());
        return true;
    }

}