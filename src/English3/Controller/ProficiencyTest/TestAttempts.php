<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.17.10
 * Time: 16:23
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\GradebookController;
use English3\Controller\Utility;
use MongoDB\BSON\UTCDateTime;

class TestAttempts{
    private static $ATTEMPT_DELIMITER = ';attempt-';
    public static function usersForUserId($userId){
        $email = Utility::getInstance()->fetchOne('SELECT email FROM users WHERE id = :userId',['userId'=>$userId]);
        return self::usersForUserEmail($email);
    }
    public static function usersForUserEmail($email){
        $email = self::prepareEmail($email);
        $regexp = self::attemptRegex($email);
        $entries = Utility::getInstance()->fetch(self::$queryUserEntries,['regexp'=>$regexp]);
        return array_map(function($row){
            if(strpos($row['email'],self::$ATTEMPT_DELIMITER)!==false){
                $attempt = explode(self::$ATTEMPT_DELIMITER,$row['email'])[1];
            }else{
                $attempt = 0;
            }
            return [
                'id'=>$row['id'],
                'email'=>$row['email'],
                'attempt'=>$attempt
            ];
        },$entries);
    }
    public static function prepareEmail($email){
        if(strpos($email,self::$ATTEMPT_DELIMITER)!==false){
            $email = explode(self::$ATTEMPT_DELIMITER,$email)[0];
        }
        return $email;
    }
    private static function attemptRegex($email){
        $delimiter = self::$ATTEMPT_DELIMITER;
        return "({$email})({$delimiter})*";
    }
    public static function takeDirectlyToCourseView($userId=null){
        if(!$userId) $userId = $_SESSION['USER']['ID'];
        $classId = self::hasExactOneAndOnlyProficiencyClass($userId);

        if($classId){
            $isStudent = boolval(Utility::getInstance()->fetchOne("SELECT is_student FROM user_classes WHERE userid = :userId and classid = :classId",['userId'=>$userId,'classId'=>$classId]));
            return $isStudent && !self::hasCompletedClass($userId,$classId);
        }
        return false;
    }
    public static function hasExactOneAndOnlyProficiencyClass($userId=null){

        $data = Utility::getInstance()->fetchRow(self::$queryHasExactOneAndOnlyProficiencyClass,['userId'=>$userId]);
        return $data['classes']==1 && $data['is_student']==1 && $data['isProficiencyClass']?$data['classid']:false;
    }
    private static function hasCompletedClass($userId,$classId){
        $test = new StudentTest($classId,$userId);
        $test->load();
        return $test->hasFinishedSubmitting;
    }


    private static $queryUserEntries = <<<SQL
    SELECT * FROM users WHERE email regexp :regexp
SQL;
    private static $queryHasExactOneAndOnlyProficiencyClass = <<<SQL
    SELECT count(uc.id) classes,is_student,uc.classid,pc.id as isProficiencyClass FROM user_classes uc
    left JOIN proficiency_classes pc ON pc.classid = uc.classid
    WHERE uc.userid = :userId
SQL;


}