<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 11:36
 */

namespace English3\WebSocket\Channels;



use English3\WebSocket\Message;
use Ratchet\ConnectionInterface;

class ValidateConnection extends ChannelBase{

    public function on($event,ConnectionInterface $from, Message $message)
    {
        $message->data = 'Connected!';
        $from->send($message->toJson());
    }

    public function subscribe(ConnectionInterface $from, Message $message)
    {
        $message->data = 'Connected!';
        $from->send($message->toJson());
    }

    public function unsubscribe($token)
    {
        // TODO: Implement unsubscribe() method.
    }
}