<?php
global $PATHS;
require_once ($PATHS->app_path.'/controllers/sql.php');
use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
function sessionClosed($expired=false){
    global $SECURITY;
    $sql = new BaseSQL();
    if(!$expired){
        if(isset($_SESSION['CREATED'])){
            $totalTime = time() - $_SESSION['CREATED'];
        }
        else{
            $totalTime=0;
        }
    }
    else{
        $totalTime = $_SESSION['TIMEOUT'];
    }
    

    if(array_key_exists('USER', $_SESSION) && array_key_exists('ID', $_SESSION['USER']) && !array_key_exists('ADMIN_AS_USER', $_SESSION['USER'])){
        $userId = $_SESSION['USER']['ID'];
        $query = "SELECT * FROM user_sessions where userid = {$userId}";
        $session = $sql->fetch_one($query);
        if($session){
            $totalTime += $session->total_time;
            $sessions = $session->sessions+1;
            $sql->query_noResult("UPDATE user_sessions set
                    total_time = {$totalTime},
                     sessions = {$sessions}
                    WHERE userid ={$userId}");

        }
        else{
            $sql->query_noResult("insert into user_sessions set
                    total_time = {$totalTime},
                     sessions = 1,
                     userid = {$userId}");
        }
    }
}

function checkTimeout(Connection $db){
    global $SECURITY;
    if(isset($_SESSION['JUST_STUDENT']) && !$_SESSION['JUST_STUDENT']){
        return;
    }

    $timeout_exceptions = [
        '/timeout',
        '/email/new-emails'
    ];

    if(isset($_SESSION['LAST_ACTIVITY'])){
        $timeout = $_SESSION['TIMEOUT'];
        if (time() - $_SESSION['LAST_ACTIVITY'] >= $timeout) {
            session_start();
            sessionClosed(true);
            session_unset();
            session_destroy();
            header("Location: http://" . $_SERVER['HTTP_HOST'] . "/", 303);
            exit();

        }else{
            if(gettype(array_search($_SERVER['REQUEST_URI'],$timeout_exceptions))=='boolean'){
                $sessionTest = $_SESSION['LAST_ACTIVITY'];
                session_start();
                $_SESSION['LAST_ACTIVITY']=time();
                if ($sessionTest === $_SESSION['LAST_ACTIVITY']){

                    $_SESSION['LAST_ACTIVITY']=time();
                }
                session_write_close();
            }
        }

    }else{
        if(array_search($_SERVER['REQUEST_URI'],$timeout_exceptions)===false){

            if(isset($_SESSION['USER']['ID'])){
                session_start();
                $me = UserController::me($db);
                if(!$me->amIJustStudent()){
                    $_SESSION['JUST_STUDENT']=false;
                    return;
                }

                $userid = $_SESSION['USER']['ID'];
                $query = <<<SQL
                  SELECT session_time from users
                  JOIN organizations o on users.organizationid = o.id
                  WHERE users.id = :userId
SQL;

                $timeout = $db->executeQuery($query,['userId'=>$userid]);

                $_SESSION['TIMEOUT'] = intval($timeout->fetchColumn())*60;
                $_SESSION['LAST_ACTIVITY']=time();
                $_SESSION['CREATED']=time();
                $_SESSION['JUST_STUDENT']=true;
                session_write_close();
            }

        }

    }
}
