<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.3.10
 * Time: 14:32
 */

namespace English3\WebSocket\Channels;


use English3\Controller\ClassesController;
use English3\Controller\Utility;
use English3\WebSocket\Channels\Chat\OnlineUsers;
use English3\WebSocket\Message;
use English3\WebSocket\Users\ConnectedUsers;

class ActiveScreen extends ChannelBase{
    protected $clientTopic = '/topic/client.currentJob';
    protected $serverTopic = '/topic/server.currentJob';

    public function __construct(\React\Stomp\Client $client){
        parent::__construct($client);
    }
    public function on($event, Message $message)
    {
        call_user_func(array($this,$event),$message);
    }

    public function currentJob(Message $message){
        $user = ConnectedUsers::getWithId($message->userid);
        if($user===null){
            return;
        }
        if($job = $this->jobFromLocation($message->data)){
            $user->setCurrentJob($job);
            if($user->getOnlineUsers()){
                $this->notifyUsers($message->userid,$user->getOnlineUsers(),$job);
            }

        }
    }
    public function currentJobFor(Message $message){
        if($this->canViewCurrentJob($message->userid,$message->data->userId)){
            if($user = ConnectedUsers::getWithId($message->data->userId)){
                $message->data->currentJob= $user->getCurrentJob();
                if($message->data->currentJob == null){
                    $this->askCurrentJob($message->data->userId);
                }
            };
        }else{
            $message->data->message = 'Permission denied';
        }
        $this->sendMessageToUser($message->userid,$message);
    }
    public function askCurrentJob($userId){
        $message = new Message('currentJob',[]);
        $this->sendMessageToUser($userId,$message);
    }

    private function jobFromLocation($location){
        $job = null;
        if(intval($location->courseId) && count(explode('/',$location->hash))<3) return $this->courseJobUnknownActivity($location->courseId);
        if($location->pathname == '/') return $this->courseJob($location);
        if(strpos($location->pathname,'/home')!==false ) return $this->splashJob($location);
        if(strpos($location->pathname,'/grades')!==false ) return $this->gradesJob($location);
        return $job;
    }
    private function courseJobUnknownActivity($courseId){
        return Utility::getInstance()->fetchRow($this->queryClassInfo,['courseId'=>$courseId]);
    }
    private function courseJob($location){
        $parts =explode('/',$location->hash);
        $pageId = $parts[count($parts)-1];
        if(!intval($pageId)){
            return null;
        }
        return Utility::getInstance()->fetchRow($this->queryActivityInfo,['pageId'=>$pageId]);
    }
    private function splashJob($location){
        return ['currentWorking'=>'Splash page'];
    }
    private function gradesJob($location){
        return ['currentWorking'=>'Reviewing grades'];
    }

    private function notifyUsers($userId,OnlineUsers $users,$job){
        if(!$users){
            return;
        }
        foreach($users->getOnlineUsers()['users'] as $user){
            if(!$user['id']){
                continue;
            }
            $this->sendMessageToUser($user['id'],new Message('currentJobFor',[
                'userId'=>$userId,
                'currentJob'=>$job
            ]));
        }
    }

    private function canViewCurrentJob($myId,$studentId){
        if(Utility::isAdminOrOrgAdmin($myId)){
            return true;
        }
        $canView = Utility::getInstance()->fetchOne($this->queryCanViewCurrentJob,['studentId'=>$studentId,'teacherId'=>$myId]);
        return boolval($canView);
    }
    private $queryCanViewCurrentJob = <<<SQL
    SELECT sc.userid
    from user_classes sc
    join user_classes tc on tc.classid = sc.classid
    where
    sc.userid = :studentId and sc.is_student = 1
    and tc.userid = :teacherId and tc.is_teacher = 1;
SQL;
    private $queryActivityInfo = <<<SQL
    SELECT c.name as className,
      u.description as unitName,
      p.name as pageName,
      c.id as classId
    from pages p
    join units u on u.id = p.unitid
    join classes c on c.courseid = u.courseid
    where p.id = :pageId;
SQL;
    private $queryClassInfo = <<<SQL
    SELECT c.name as className,
      '' as unitName,
      '' as pageName,
      c.id as classId
    from courses co
    join classes c on c.courseid = co.id
    where co.id=:courseId;
SQL;


}