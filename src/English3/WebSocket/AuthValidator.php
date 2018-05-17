<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.9
 * Time: 10:34
 */

namespace English3\WebSocket;


use English3\Controller\Utility;
use Ratchet\ConnectionInterface;

class AuthValidator {
    public static function validate(ConnectionInterface $from, Message $msg){

        if(!$msg->token || !self::checkTokenInDb($msg->token,$msg->userId)){
            return 'Invalid token';
        }
        return false;
    }
    private static function checkTokenInDb($token,$userId){
        if(!$expiration = Utility::getInstance()->fetchOne('SELECT expiration FROM user_websocket_tokens WHERE token = :token and userid = :userId',['token'=>$token,'userId'=>$userId])){
            return false;
        }

        return strtotime($expiration)>time();
    }

    public static function generateNewToken($userId){
        $expiration = time();
        $expiration += self::$TOKEN_EXPIRATION_TIME_IN_SECONDS;
        $token = Utility::getInstance()->generatePassword(20);
        Utility::getInstance()->insert(self::$queryInsertUserToken,['userId'=>$userId,'token'=>$token,'expiration'=>date('Y-m-d H:i:s',$expiration)]);
        return $token;
    }

    private static $TOKEN_EXPIRATION_TIME_IN_SECONDS = 7200;

    private static $queryInsertUserToken = <<<SQL
    INSERT INTO user_websocket_tokens (userid, token, expiration) VALUES (:userId,:token,:expiration)
     ON DUPLICATE KEY update token = values(token),expiration = values(expiration)
SQL;

}