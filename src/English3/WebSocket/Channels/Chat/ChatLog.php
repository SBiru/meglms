<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.9.9
 * Time: 16:07
 */

namespace English3\WebSocket\Channels\Chat;


use English3\Controller\Utility;

class ChatLog {
    private $log = array();
    public function addMessageToLog($message){
        Utility::addToObjectIfNotExists($message->data['room'],array(),$this->log);
        $this->log[$message->data['room']][] = $message->data;
        $this->saveToDB($message->data);
    }
    public function getRoomLog($room){
        if(!$log = @$this->log[$room]){
            $log = $this->loadFromDB($room);
        }
        return $log;
    }
    public function setMessageReadState($from,$to){
        Utility::getInstance()->insert($this->querySetMessageReadState,['fromUser'=>$from,'toUser'=>$to]);
    }
    public function setGroupMessageReadState($group,$userId){
        Utility::getInstance()->insert($this->querySetGroupMessageReadState,['room'=>$group,'userId'=>$userId]);
    }
    public function setGroupClosedState($group,$isClosed){
        Utility::getInstance()->reader->update('chats_groups',[
            'closed'=>intval($isClosed)
        ],[
            'users'=>$group
        ]);
    }
    public function getGroupRooms($userId){
        $groups = Utility::getInstance()->fetch($this->queryGetGroupRooms,['userId'=>$userId]);
        return array_map(function($group) use($userId){
            $users = $this->getGroupUsers($group['users'],$userId);
            $group['closed'] = boolval($group['closed']);
            $mockFirstName = implode(', ',array_map(function($u){return $u['firstName'].' '.$u['lastName'];},$users));
            return [
                'room'=>$group['users'],
                'users'=> $users,
                'firstName'=>$mockFirstName,
                'lastName'=>'',
                'closed'=>$group['closed']
            ];
        },$groups);
    }
    public function getGroupUsers($room,$userId){
        $users = explode('-',$room);
        $groupUsers = array();
        foreach($users as $user){
            if($user != $userId){
                $groupUsers[] = Utility::getInstance()->fetchRow($this->queryGetGroupUser,['userId'=>$user]);
            }
        }
        return array_filter(array_map(function($user) use($userId){
            if($user != $userId){
                return Utility::getInstance()->fetchRow($this->queryGetGroupUser,['userId'=>$user]);
            }
        },$users));
    }
    public function getUnreadRooms($userId){
        $groupMessages = $this->getUnreadMessages($userId,true);
        $userMessages = $this->getUnreadMessages($userId);
        return array_merge($groupMessages,$userMessages);
    }

    private function getUnreadMessages($userId,$isGroup = false){
        $query = $isGroup?$this->queryUnreadRooms:$this->queryUnreadGroupMessages;
        $data = Utility::getInstance()->fetch($query,['userId'=>$userId]);
        $unreadRooms = [];
        foreach($data as $row){

            $unreadRooms[ $this->buildRoomFromRow($row)] = intval($row['messages']);
        }
        return $unreadRooms;
    }
    private function buildRoomFromRow($row){
        $u1 = number_format($row['u1'],0,'.','');
        $u2 = number_format($row['u2'],0,'.','');
        return  $u1.'-'.$u2;
    }
    public function saveToDB($message){
        $groupid = null;
        if($message->to=='group'){
            $groupid = $this->getGroupId($message->room);
        }
        Utility::getInstance()->insert($this->queryInserMessage,[
            'from'=>$message->from,
            'to'=>$message->to,
            'message'=>$message->message,
            'group'=>$groupid
        ]);

    }
    private function getGroupId($room){
        if($groupId = Utility::getInstance()->fetchOne($this->queryGetGroupId,['room'=>$room])){
            return $groupId;
        }else{
            return $this->createGroup($room);
        }
    }
    private function createGroup($room){
        Utility::getInstance()->reader->insert('chats_groups',['users'=>$room]);
        $groupId = Utility::getInstance()->reader->lastInsertId();
        $users = explode('-',$room);
        $values = array_map(function($u) use($groupId){
            return "(".$groupId.",".$u.")";
        },$users);
        Utility::getInstance()->insert(sprintf($this->queryInsertGroupUsers,implode(',',$values)));
        return $groupId;
    }
    private function loadFromDB($room){
        $users = explode('-',$room);
        if(count($users)>2){
            $log = Utility::getInstance()->fetch($this->queryLoadGroupLog,['room'=>$room]);
        }else{
            $log = Utility::getInstance()->fetch($this->queryLoadLog,[
                'user1' => $users[0],
                'user2' => $users[1],
                'room'=>$room
            ]);
        }
        return $log?:[];
    }
    private $queryInserMessage = <<<SQL
    INSERT INTO chats (class_id, from_user_id, to_user_id, message, created,groupid) VALUES
    (0,:from,:to,:message,CURRENT_TIMESTAMP(),:group)
SQL;

    private $queryLoadLog = <<<SQL
    SELECT from_user_id as 'from', to_user_id as 'to', message, created, :room as room FROM chats
    WHERE (from_user_id = :user1 and to_user_id = :user2) or (from_user_id = :user2 and to_user_id = :user1)
SQL;
    private $queryLoadGroupLog = <<<SQL
    select from_user_id as 'from', to_user_id as 'to', message,chats.created,:room as room,concat(fname,' ',lname) as fromName  from chats
    join chats_groups cg on chats.groupid = cg.id
    join users u on chats.from_user_id = u.id
    where cg.users = :room;
SQL;
    private $querySetGroupMessageReadState = <<<SQL
    INSERT INTO chat_group_messages (message_id, user_id, read_on) select chats.id,:userId,CURRENT_TIMESTAMP() from chats
  join chat_group_users cu on cu.groupid = chats.groupid
  join chats_groups cg on cg.id = chats.groupid
  left join chat_group_messages cm on cm.message_id = chats.id and cm.user_id = cu.userid
  where cg.users = :room and cm.message_id is null and chats.from_user_id <> :userId
  ON DUPLICATE KEY UPDATE read_on =values(read_on)
SQL;
    private $querySetMessageReadState = <<<SQL
    UPDATE chats set read_on = CURRENT_TIMESTAMP() WHERE from_user_id = :fromUser and to_user_id = :toUser and read_on is null
SQL;
    private $queryUnreadThreads = <<<SQL
    select from_user_id as 'from', count(*) as unreadMessages,CONCAT(convert(LEAST(from_user_id,to_user_id),char),'-',
    convert(GREATEST(from_user_id,to_user_id),char)) as room  from chats where to_user_id = :userId and read_on is null 
    group
     by 
    from_user_id;
SQL;
    private $queryUnreadRooms = <<<SQL
    SELECT count(*) as 'messages', convert(CONCAT(convert(LEAST(from_user_id,:userId) using utf8),'-',convert(GREATEST
    (from_user_id,:userId) using utf8)) using utf8) as room, convert(LEAST(from_user_id,:userId) using utf8) as u1, 
    convert(GREATEST(from_user_id,:userId) using utf8) as u2 
    FROM 
    chats
    join users u1 on u1.id =  chats.from_user_id
WHERE to_user_id = :userId and read_on is null
group by from_user_id;
SQL;
    private $queryUnreadGroupMessages = <<<SQL
    select count(chats.id) as messages, cg.users as room from chats
  join chat_group_users cu on cu.groupid = chats.groupid
  join chats_groups cg on cg.id = chats.groupid
  left join chat_group_messages cm on cm.message_id = chats.id and cm.user_id = cu.userid
  where cu.userid = :userId and cm.message_id is null and chats.from_user_id <> :userId
 group by cg.users
SQL;
    private $queryGetGroupId = <<<SQL
    SELECT id FROM chats_groups WHERE users = :room
SQL;
    private $queryInsertGroupUsers = <<<SQL
    INSERT INTO chat_group_users (groupid, userid) values %s
SQL;
    private $queryGetGroupRooms = <<<SQL
    SELECT DISTINCT cg.users,cg.closed FROM chats c
    JOIN chats_groups cg on cg.id = c.groupid
    JOIN chat_group_users cu on cu.groupid = cg.id
    WHERE cu.userid = :userId
SQL;
    public $queryGetGroupUser = <<<SQL
    SELECT id,fname as firstName,lname as lastName, email from users where id = :userId
SQL;





}