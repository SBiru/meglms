<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.3.8
 * Time: 15:51
 */

namespace English3\Controller\ProficiencyTest\Mailer;


use English3\Controller\ClassesController;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;

class EmailUsers {
    public static function sendEmail($userId,$classId,$completionFlag,E3Mailer $sender){

        $sentEmailsStatus = self::getCompletedTestEmailStatus($userId,$classId);
        if($sentEmailsStatus[$completionFlag] || ClassesController::isJ1($classId)){
            return new JsonResponse(['ok']);
        }
        $success = $sender->send();
        if($success){
            self::setCompletedTestEmailStatus($userId,$classId,$sentEmailsStatus,$completionFlag);
        }
        return $success;
    }
    public static function shouldSendEmail($userId,$classId,$completionFlag){
        $sentEmailsStatus = self::getCompletedTestEmailStatus($userId,$classId);
        return !$sentEmailsStatus[$completionFlag];
    }
    public static function setCompletedTestEmailStatus($userId,$classId,$currentStatus,$completionFlag){
        $currentStatus[$completionFlag] = true;
        Utility::getInstance()->reader->update('user_classes',['completion_email_sent'=>json_encode($currentStatus)],['classid'=>$classId,'userid'=>$userId]);
    }
    public static function getCompletedTestEmailStatus($userId,$classId){
        $currentStatus = Utility::getInstance()->fetchOne("SELECT completion_email_sent From user_classes uc WHERE uc.classid = :classId and uc.userid = :userId",['classId'=>$classId,'userId'=>$userId]);
        $currentStatus = $currentStatus?:'{}';
        return json_decode($currentStatus,true);
    }
    public static function canSendJ1Admin($userId){
        return !boolval(Utility::getInstance()->fetchOne(self::$queryGetAutomaticEmailFlagForAdmin,
            ['userId'=>$userId]));
    }
    public static function canSendE3PTAdmin($userId){
        return !boolval(Utility::getInstance()->fetchOne(self::$queryGetAutomaticE3PTEmailFlagForAdmin,
            ['userId'=>$userId]));
    }
    public static function canSendJ1Teacher($userId){
        return !boolval(Utility::getInstance()->fetchOne(self::$queryGetAutomaticEmailFlagForTeacher,
            ['userId'=>$userId]));
    }

    private static $queryGetAutomaticEmailFlagForAdmin = <<<SQL
    SELECT meta_value FROM user_meta where userid = :userId and meta_key = 'disable_j1_graded_email'
SQL;
    private static $queryGetAutomaticE3PTEmailFlagForAdmin = <<<SQL
    SELECT meta_value FROM user_meta where userid = :userId and meta_key = 'disable_e3pt_graded_email'
SQL;
    private static $queryGetAutomaticEmailFlagForTeacher = <<<SQL
    SELECT meta_value FROM user_meta where userid = :userId and meta_key = 'disable_j1_submitted_email'
SQL;

}