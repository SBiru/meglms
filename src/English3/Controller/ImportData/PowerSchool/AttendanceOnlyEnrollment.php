<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.31.3
 * Time: 10:27
 */

namespace English3\Controller\ImportData\PowerSchool;


use English3\Controller\Utility;
use Symfony\Component\Config\Definition\Exception\Exception;

class AttendanceOnlyEnrollment {
    private $classId;
    private $studentId;
    public function __construct($classId,$studentId){
        $this->classId = $classId;
        $this->studentId = $studentId;
    }
    public function updateEnrollment($dateStarted,$dateLeft){
        $this->checkIfClassExists();
        Utility::getInstance()->insert(
            AttendanceOnlyEnrollmentSQL::$queryInsertOrUpdateEnrollment,
            [
                'userId'=>$this->studentId,
                'classId'=>$this->classId,
                'dateStarted'=>$dateStarted,
                'dateLeft'=>$dateLeft
            ]
        );
    }
    private function checkIfClassExists(){
        $dbId = Utility::getInstance()->fetchOne(AttendanceOnlyClass::$queryGetClassWithId,['id'=>$this->classId]);
        if(!boolval($dbId)){
            throw new Exception(sprintf('Class %s does not exists',$this->classId));
        }
    }
}
class AttendanceOnlyEnrollmentSQL {
    public static $queryInsertOrUpdateEnrollment = <<<SQL
    INSERT INTO user_attendance_only_classes (userid,classid,date_started,date_left)
    VALUES (:userId,:classId,:dateStarted,:dateLeft)
    ON DUPLICATE KEY UPDATE date_started = values(date_started),date_left = values(date_left)
SQL;

}