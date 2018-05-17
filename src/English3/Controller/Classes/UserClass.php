<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.27.10
 * Time: 11:07
 */

namespace English3\Controller\Classes;




use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UserClass {
    public function getStartEndDate(Request $request,$classId,$userId){
        if($request->query->get('attendance_only')){
            $data = Utility::getInstance()->fetchRow($this->queryGetStartEndDateAttendanceCourse,['classId'=>$classId,'userId'=>$userId]);
        }else{
            $data = Utility::getInstance()->fetchRow($this->queryGetStartEndDateNormalCourse,['classId'=>$classId,'userId'=>$userId]);
            $data['expectedEndDate'] = ClassesController::_getExpectedDate($userId,$classId,true);
        }
        return new JsonResponse($data);
    }
    public function saveStartEndDate(Request $request,$classId,$userId){
        Utility::clearPOSTParams($request);
        $table = $request->request->get('attendance_only')?'user_attendance_only_classes':'user_classes';

        Utility::getInstance()->reader->update($table,$this->prepareParams($request,
            boolval($request->request->get('attendance_only')),
            boolval($request->request->get('is_attendance'))
        ),['classid'=>$classId,'userid'=>$userId]);
        GradebookController::_setRecalculateDueDates($classId,$userId);
        return new Response('ok');
    }
    private function prepareParams(Request $request,$attendanceOnly,$isAttendance){
        if($attendanceOnly){
            return [
                'manual_start_date'=>$request->request->get('manual_attendance_start_date')?:null,
                'manual_end_date'=>$request->request->get('manual_end_date')?:null,
            ];
        }else{
            if($isAttendance){
                return [
                    'manual_end_date'=>$request->request->get('manual_end_date')?:null,
                    'manual_attendance_start_date'=>$request->request->get('manual_attendance_start_date')?:null,
                ];
            }else{
                return [
                    'manual_expected_end_date'=>$request->request->get('manual_expected_end_date')?:null,
                    'manual_start_date'=>$request->request->get('manual_start_date')?:null,
                ];
            }

        }
    }
    public static function getUserClass($userId,$classId,$field = null){
        if($field){
            return Utility::getInstance()->fetchOne("SELECT {$field} FROM user_classes where userid = :userId and classid = :classId",['userId'=>$userId,'classId'=>$classId]);
        }else{
            return Utility::getInstance()->fetchRow("SELECT * FROM user_classes where userid = :userId and classid = :classId",['userId'=>$userId,'classId'=>$classId]);
        }
    }
    public static function isOnlyStudent($userId){
        return !Utility::getInstance()->checkAdmin(null,true,false)
            && !boolval(Utility::getInstance()->fetchOne(self::$queryIsOnlyStudent,['userId'=>$userId]));
    }
    public static function isStudent($userId){
        return boolval(Utility::getInstance()->fetchOne("select * from user_classes where is_student = 1 and userid = ? limit 1",[$userId]));
    }

    private static $queryIsOnlyStudent = <<<SQL
    SELECT id FROM user_classes WHERE (is_teacher <> 0 or is_test_admin<> 0 or is_edit_teacher <> 0 or is_observer <> 
    0) and userid = :userId limit 1; 
SQL;

    private $queryGetStartEndDateNormalCourse = <<<SQL
    SELECT created as startDate, date_left as endDate,manual_end_date,manual_start_date,manual_expected_end_date,manual_attendance_start_date from user_classes where userid = :userId and classid = :classId
SQL;
    private $queryGetStartEndDateAttendanceCourse = <<<SQL
    SELECT date_started as startDate, date_left as endDate,manual_end_date,manual_start_date from user_attendance_only_classes where userid = :userId and classid = :classId
SQL;
    
}