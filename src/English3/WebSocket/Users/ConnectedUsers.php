<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.15.9
 * Time: 17:23
 */

namespace English3\WebSocket\Users;




use English3\WebSocket\Message;

class ConnectedUsers {
    private static $users = array();
    private static $usersSetAsOffline = array();
    public static function getAll(){
        return self::$users;
    }
    public static function add(E3WSUser $user){
        self::$users[$user->getUserId()] = $user;
    }
    public static function remove(E3WSUser $user){
        unset(self::$users[$user->getUserId()]);
    }
    public static function removeWithId($userId){
        unset(self::$users[$userId]);
    }
    public static function removeWithConnectionId($connectionId){
        if($user = self::user(self::getWithConnectionId($connectionId)))
        {
            $user->removeConnectionId($connectionId);
            if(count($user->getConnectionId())==0){
                unset(self::$users[self::user($user)->getUserId()]);
            }else{
                self::user($user)->updateCurrentJob();
            }
        }


    }
    public static function getWithId($userId,Message $message = null){
        if(!array_key_exists($userId,self::$users) && $message && $message->userid){
            self::add(new E3WSUser(null,$message));
        }
        return self::user(@self::$users[$userId]);

    }
    private static function user(E3WSUser $u = null){ return $u;}
    public static function getWithConnectionId($connectionId){
        foreach(self::$users as $user){
            if(array_search($connectionId,self::user($user)->getConnectionId()) !== false){
                return $user;
            }
        }
    }

    public static function isConnected($userId){
        return boolval(@self::$users[$userId]);
    }
    public static function hideUserFromOthers($userId,$hideFromOthers=null){
        if(is_null($hideFromOthers)){
            return array_search($userId,self::$usersSetAsOffline) !== false;
        }

        if($hideFromOthers === false){
            if($index = array_search($userId,self::$usersSetAsOffline) !== false){
                array_splice(self::$usersSetAsOffline,$index,1);
            }
        }else{
            if($index = array_search($userId,self::$usersSetAsOffline) === false){
                self::$usersSetAsOffline[]=$userId;
            }
        }
    }
    public static function getAndPrepareAll(){
        $users = array();
        foreach(self::$users as $id => $user){
            $users[$id]=$user->getBasicUserInfo();
            $users[$id]['currentJob']=$user->getCurrentJob();
            $users[$id]['connectionId']=$user->getConnectionId();
        }
        return $users;
    }

}