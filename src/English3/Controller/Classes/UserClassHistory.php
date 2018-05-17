<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.29.4
 * Time: 14:46
 */

namespace English3\Controller\Classes;


use English3\Controller\PowerSchoolController;
use English3\Controller\Utility;
use Phinx\Util\Util;

class UserClassHistory {
    public static function moveAllToClassHistory($classId,$groupId = null){
        $enrollments = Utility::getInstance()->fetch(self::$queryAllUsersFromClass,['classId'=>$classId]);
        foreach($enrollments as $enrollment){
            self::moveUserToClassHistory($enrollment['userid'],$classId,$groupId);
        }
    }
    public static function moveUserToClassHistory($userId,$classId,$groupId = null){
        self::addToUserClassHistory($userId,$classId,$groupId);
        self::deleteFromUserClassesTable($userId,$classId,$groupId);
    }

    public static function addToUserClassHistory($userId,$classId,$groupId = null){
        $userClassData = self::getUserClassData($userId,$classId,$groupId);
        if($userClassData){
            $userClassData['date_left'] = date('Y-m-d H:i:s');
            unset($userClassData['id']);
            $currentId = self::getUserClassHistoryId($userId,$classId,$groupId);
            if($currentId){
                Utility::getInstance()->reader->update('user_classes_history',$userClassData,['id'=>$currentId]);
            }else{
                Utility::getInstance()->reader->insert('user_classes_history',$userClassData);
            }
        }
    }

    private function deleteFromUserClassesTable($userId,$classId,$groupId = null){
        $where = [
            'userid'=>$userId,
            'classid'=> $classId
        ];
        if($groupId){
            $where['groupid']=$groupId;
        }
        Utility::getInstance()->reader->delete('user_classes',$where);
    }
    private static function getUserClassData($userId,$classId,$groupId = null){
        $getUserClassQuery = PowerSchoolController::$queryGetUserClassesData . ($groupId?' and groupid = :groupId':'');
        $getUserClassParams = ['userId'=>$userId,'classId'=>$classId];
        if($groupId){
            $getUserClassParams['groupId']= $groupId;
        }
        return Utility::getInstance()->fetchRow($getUserClassQuery,$getUserClassParams);
    }
    private static function getUserClassHistoryId($userId,$classId,$groupId = null)
    {
        $getUserClassQuery = "SELECT * FROM user_classes_history where userid = :userId and classid = :classId" . ($groupId ? ' and groupid = :groupId' : '');
        $getUserClassParams = ['userId' => $userId, 'classId' => $classId];
        if ($groupId) {
            $getUserClassParams['groupId'] = $groupId;
        }
        return Utility::getInstance()->fetchOne($getUserClassQuery, $getUserClassParams,'id');
    }
    public static function moveUserToAttendanceClassHistory($userId,$classId){
        self::addToUserAttendanceClassHistory($userId,$classId);
        self::deleteFromUserClassesAttendanceTable($userId,$classId);
    }
    public static function addToUserAttendanceClassHistory($userId,$classId){
        $userClassData = self::getUserClassAttendanceData($userId,$classId);
        if($userClassData){
            $userClassData['date_left'] = date('Y-m-d H:i:s');
            unset($userClassData['id']);
            $currentId = self::getUserClassAttendanceHistoryId($userId,$classId);
            if($currentId){
                Utility::getInstance()->reader->update('user_attendance_only_classes_history',$userClassData,['id'=>$currentId]);
            }else{
                Utility::getInstance()->reader->insert('user_attendance_only_classes_history',$userClassData);
            }
        }
    }
    private static function getUserClassAttendanceData($userId,$classId,$groupId = null){
        $getUserClassQuery = PowerSchoolController::$queryGetUserAttendanceClassesData . ($groupId?' and groupid = :groupId':'');
        $getUserClassParams = ['userId'=>$userId,'classId'=>$classId];
        if($groupId){
            $getUserClassParams['groupId']= $groupId;
        }
        return Utility::getInstance()->fetchRow($getUserClassQuery,$getUserClassParams);
    }
    private static function getUserClassAttendanceHistoryId($userId,$classId,$groupId = null)
    {
        $getUserClassQuery = "SELECT * FROM user_attendance_only_classes_history where userid = :userId and classid = :classId" . ($groupId ? ' and groupid = :groupId' : '');
        $getUserClassParams = ['userId' => $userId, 'classId' => $classId];
        if ($groupId) {
            $getUserClassParams['groupId'] = $groupId;
        }
        return Utility::getInstance()->fetchOne($getUserClassQuery, $getUserClassParams,'id');
    }
    public static function deleteFromUserClassesAttendanceTable($userId,$classId){
        $where = [
            'userid'=>$userId,
            'classid'=> $classId
        ];
        Utility::getInstance()->reader->delete('user_attendance_only_classes',$where);
    }

    private static $queryAllUsersFromClass = <<<SQL
    SELECT userid from user_classes where classid = :classId;
SQL;




}