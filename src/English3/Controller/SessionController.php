<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class SessionController{

    public function __construct(Connection $reader) {
        $this->reader = $reader;
        if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
            $this->userId = $_SESSION['USER']['ID'];
            $this->loggedIn = true;
        } else {
            $this->loggedIn = false;
        }
    }

    public function checkUser() {
        if (!$this->loggedIn) {
            throw new BadRequestHttpException('Not logged in');
        }
    }
    public function timeleft(Request $request){
        global $SECURITY;
        $this->checkUser();
        if(!$_SESSION['JUST_STUDENT']){
            return new JsonResponse(['timeleft'=>100000000]);
        }
        $timeleft = ($_SESSION['TIMEOUT'] + $_SESSION['LAST_ACTIVITY']) - time();
        return new JsonResponse(['timeleft'=>$timeleft]);
    }
    public static function updateSessionStart(){
        $userId = $_SESSION['USER']['ID'];
        $last_session_start = Utility::getInstance()->fetchOne("SELECT current_session_start FROM user_sessions WHERE userid = :userId",['userId'=>$userId]);
        Utility::getInstance()->insert(self::$queryupdateSessionStart,[
            'userId'=>$userId,
            'last_session_start'=>$last_session_start,
            'current_session_start'=>date('Y-m-d H:i:s')
        ]);
    }
    public function stop(Request $request){
        global $SECURITY;
        return new JsonResponse(['status'=>'ok']);
    }
    public static function loggedInSince($userId){
        return Utility::getInstance()->fetchOne("SELECT current_session_start FROM user_sessions us where us.userid = :userId",['userId'=>$userId]);
    }
    public static $queryupdateSessionStart = <<<SQL
    INSERT INTO user_sessions (userid,sessions,total_time,last_session_start,current_session_start)
    values (:userId,1,0,:last_session_start,:current_session_start)
    ON DUPLICATE KEY UPDATE last_session_start = values(last_session_start),current_session_start = values(current_session_start)
SQL;

}
?>