<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.1.8
 * Time: 20:58
 */

namespace English3\Controller\ProficiencyTest;



use English3\Controller\GradebookController;
use English3\Controller\ProficiencyTest\Mailer\EmailFirstLogin;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class PaymentReceived {
    public function createUserIfNeeded(Request $request){
        Utility::clearPOSTParams($request);
        $data = $request->request->all();
        if($dateOfBirth = @$data['date_of_birth']){

            $data['date_of_birth'] = date('Y-m-d',strtotime($data['date_of_birth']));
        }
        $userExists = Utility::getInstance()->fetchOne($this->queryUserExists,['email'=>$data['email']]);
        if($userExists){
            return new JsonResponse(['id'=>$userExists]);
        }else{
            $password = Utility::generatePassword(10);
            return new JsonResponse(['id'=>UserController::_createUser([
                'fname'=>$data['fname'],
                'lname'=>$data['lname'],
                'email'=>$data['email'],
                'organizationid'=>$data['orgId']?:1,
                'preferred_language'=>$data['preferred_language']?:'en',
                'password'=>$password,
                'date_of_birth'=>@$data['date_of_birth']
            ]),'password'=>$password]);
        }
    }
    public function createNewAttempt(Request $request){
        Utility::clearPOSTParams($request);
        $data = $request->request->all();
        $attempts = TestAttempts::usersForUserEmail($data['email']);
        $currentAttempt = $this->findMaxAttempt($attempts);
        $user = Utility::getInstance()->fetchRow($this->queryUser,['email'=>$data['email']]);
        $originalUserId = $user['id'];
        unset($user['id']);
        unset($user['created']);
        $user['email']= $data['email'].';attempt-'.($currentAttempt+1);
        Utility::getInstance()->reader->insert('users',$user);
        $userId = Utility::getInstance()->reader->lastInsertId();
        Utility::getInstance()->insert($this->queryCloneUserPreferences,['userId'=>$originalUserId,'newUserId'=>$userId]);
        return new JsonResponse(['id'=> $userId]);
    }
    private function findMaxAttempt($attempts){
        $max = 0;
        foreach($attempts as $attempt){
            if(intval($attempt['attempt'])>$max){
                $max = intval($attempt['attempt']);
            }
        }
        return $max;
    }
    public function enrollUserIfNeeded(Request $request){
        Utility::clearPOSTParams($request);
        $data = $request->request->all();
        $data['groupId']= intval($data['groupId'])?$data['groupId']:null;
        if(@$data['schoolId']){
            Utility::getInstance()->insert($this->queryInsertUserMeta,[$data['userId'],'e3pt_school_id',$data['schoolId']]);
        }
        if(@$data['nationality']){
            Utility::getInstance()->insert($this->queryInsertUserMeta,[$data['userId'],'nationality',$data['nationality']]);
        }
        if(@$data['language']){
            Utility::getInstance()->insert($this->queryInsertUserMeta,[$data['userId'],'language',$data['language']]);
        }
        $enrollmentExists = Utility::getInstance()->fetchOne($this->queryEnrollmentExists,[
            'classId'=>$data['classId'],
            'groupId'=>$data['groupId'],
            'userId'=>$data['userId'],
        ]);
        if($enrollmentExists){
            //handle test again
            return new Response('');
        }else{
            Utility::getInstance()->reader->insert('user_classes',[
                'classid'=>$data['classId'],
                'groupid'=>$data['groupId'],
                'userid'=>$data['userId'],
                'is_student'=>1
            ]);
            GradebookController::_recalculate($data['userId'],null,$data['classId']);
            return new Response('');
        }
    }

    public function checkEmail(Request $request){
        $email = $request->query->get('email');
        $classId = $request->query->get('classId');
        $groupId = $request->query->get('groupId');
        $emailRegex = "({$email})[[:space:]]*(,|$|\/|;)";
        $userId = Utility::getInstance()->fetchOne($this->queryAnyAttemptUserExists,['email'=>$emailRegex]);
        return new JsonResponse([
            'userId'=>$userId,
            'enrollmentId'=>Utility::getInstance()->fetchOne($this->queryEnrollmentExists,['userId'=>$userId,'classId'=>$classId,'groupId'=>$groupId]),
        ]);
    }
    public static function handleNewUserLogin($userId){
        if(self::shouldSendEmail($userId)){
            self::emailAdmins($userId);
        }
    }
    public static function shouldSendEmail($userId){
        return self::isNewUserLogin($userId) && self::hasPurchasedCourses($userId);
    }
    public static function isNewUserLogin($userId){
        return !boolval(Utility::getInstance()->fetchOne('SELECT id FROM user_sessions WHERE userid = :userId',['userId'=>$userId]));
    }
    public static function hasPurchasedCourses($userId){
        return boolval(Utility::getInstance()->fetchOne(self::$queryHasPurchasedCourses,['userId'=>$userId]));
    }
    public static function emailAdmins($userId){
        $student = UserController::byId(null,$userId);
        foreach(self::$adminIDS as $adminId){
            $ctrl = UserController::byId(null,$adminId);
            $mailer = new EmailFirstLogin($ctrl->user,$student);
            $mailer->send();
        }
    }
    private static $adminIDS = [];
    private $queryUser = <<<SQL
    SELECT * FROM users WHERE email = :email limit 1
SQL;
    private $queryCloneUserPreferences = <<<SQL
    INSERT INTO user_preferences (user_id, preference, value) SELECT :newUserId, preference, value FROM user_preferences where user_id = :userId;
SQL;
    private $queryInsertUserMeta = <<<SQL
    INSERT INTO user_meta (userid, meta_key, meta_value) values (?,?,?)
    on duplicate key update meta_value = values(meta_value)
SQL;

    private static $queryHasPurchasedCourses = <<<SQL
    SELECT uc.id FROM user_classes uc
        JOIN products p on p.classid = uc.classid
        WHERE uc.userid = :userId and uc.is_student = 1 LIMIT 1

SQL;
    private $queryUserExists = <<<SQL
    SELECT id FROM users WHERE email = :email
SQL;
    private $queryAnyAttemptUserExists = <<<SQL
    SELECT id FROM users WHERE email REGEXP :email order by created desc limit 1
SQL;

    private $queryEnrollmentExists = <<<SQL
	SELECT id FROM user_classes WHERE userid=:userId and classid=:classId and groupid = :groupId
SQL;
}