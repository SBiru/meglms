<?php
namespace English3\WebSocket\Channels\Forum;
use English3\Controller\Forum\ForumNotifications;
use English3\WebSocket\AdvisoryTopics\ConsumerQueue;
use English3\WebSocket\Channels\ChannelBase;
use English3\WebSocket\Message;

class Forum extends ChannelBase
{
    protected $clientTopic = '/topic/client.forum';
    protected $serverTopic = '/topic/server.forum';
    protected $alerts = array();
    protected $scheduler;
    protected $sql;
    public function __construct(\React\Stomp\Client $client){
        parent::__construct($client);
        $this->advisoryQueue = new ConsumerQueue($client,'client.forum');
    }
    public function on($event, Message $message)
    {
        call_user_func(array($this,$event),$message);
    }
    public function forumChanged(Message $message){
        echo 'forumChanged'.PHP_EOL;
        $id = $message->data->id;
        $notifications = new ForumNotifications();
        $affectedUserIds = $notifications->updateForSubscribers($id);
        foreach($affectedUserIds as $userid){
            echo 'forumChanged - '.$userid.PHP_EOL;
            $this->sendMessageToUser($userid,new Message('update',['id'=>$id]));
        }
    }

}