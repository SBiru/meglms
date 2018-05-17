<?php
namespace English3\Controller\Attendance;

use Doctrine\DBAL\Platforms\SQLAnywhere11Platform;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class AttendanceApproval {
    public function approveAttendancesRequest(Request $request,$userId){
        Utility::clearPOSTParams($request);
        $classes = $request->request->get('classes');
        $this->approveAttendances($userId,$classes);
        if($request->request->has('attendanceWithdrawDate')){
            Utility::getInstance()->reader->update('users',['attendance_withdraw_date'=>$request->request->get('attendanceWithdrawDate')],['id'=>$userId]);
        }else{
            Utility::getInstance()->reader->update('users',['attendance_withdraw_date'=>null],['id'=>$userId]);
        }

        $this->updateMissingAttendanceCache($userId);
        return new JsonResponse('Done');
    }
    public function getApprovedAttendancesRequest(Request $request,$userId){
        return new JsonResponse([]);
    }

    public function approveAttendances($userId,$classes){
        $preparedClasses = $this->getDifferenceFromAlreadyApprovedAttendances($userId,$classes);
        AttendanceApprovalDB::insertApprovedAttendances($userId,$preparedClasses);
        AttendanceApprovalDB::deleteDraftAttendances($userId,$classes);
    }
    private function getDifferenceFromAlreadyApprovedAttendances($userId,$classes){
        $currentAttendances = $this->getApprovedAttendances([$userId=>$classes]);
        foreach($classes as &$class){
            foreach ($class['dates'] as $key=>&$date) {
                $dayInfo = @$currentAttendances[$userId]['classes'][$class['id']]['dates'][$date['date']];
                if(!$this->hasChanges($date,$dayInfo)){
                    unset($class['dates'][$key]);
                    continue;
                }
                $currentAttendanceTime = $dayInfo['time'];
                if($currentAttendanceTime){
                    $date['time'] = intval($date['time']) - $currentAttendanceTime;
                }
            }
        }
        return $classes;
    }
    private function hasChanges($currentAttendanceEntry,$newAttendanceEntry){
        return
            @$currentAttendanceEntry['absent']!=@$newAttendanceEntry['absent'] ||
        @$currentAttendanceEntry['reason']!=@$newAttendanceEntry['reason'] ||
        @$currentAttendanceEntry['time']!=@$newAttendanceEntry['time'];
    }
    public function getApprovedAttendances($studentsToGet,$dates=null){
        $students = array();
        $rawDBData = AttendanceApprovalDB::getApprovedAttendances($studentsToGet,$dates);
        foreach($rawDBData as $row){
            Utility::addToObjectIfNotExists($row['userid'],[
                'id'=>$row['userid'],
                'classes'=>array()
            ],$students);
            $classes = &$students[$row['userid']]['classes'];
            Utility::addToObjectIfNotExists($row['classid'],[
                'id'=>$row['classid'],
                'dates'=>array()
            ],$classes);
            $dates = &$students[$row['userid']]['classes'][$row['classid']]['dates'];
            $dates[$row['date']]=[
                'date'=>$row['date'],
                'time'=>intval($row['time']),
                'absent'=>boolval($row['absent']),
                'reason'=>$row['reason'],
            ];
        }
        return $students;
    }
    private function updateMissingAttendanceCache($userId){
        $missingAttendanceChecker = new MissingAttendanceChecker();
        $org = Utility::getInstance()->fetchOne('SELECT organizationid FROM users WHERE id = :id',['id'=>$userId]);
        $missingAttendanceChecker->_update($org,null,[$userId]);
    }
}
class AttendanceApprovalDB{
    public static function getApprovedAttendances($students,$dates = null){
        $query = self::getApprovedAttendancesQuery($students,$dates);
        return Utility::getInstance()->fetch($query);
    }
    private static function getApprovedAttendancesQuery($students,$filterDates = null){
        list($studentIds,$classes,$dates) = self::listOfStudentsClassesAndDates($students);
        $filterDateRange = '';
        if(!is_null($filterDates) && array_key_exists('minDate',$filterDates)!==false){
            $minDate = $filterDates['minDate'];
            $filterDateRange.= " AND date >= '{$minDate}'";
        }
        if(!is_null($filterDates) && array_key_exists('maxDate',$filterDates)!==false){
            $maxDate = $filterDates['maxDate'];
            $filterDateRange.= " AND date <= '{$maxDate}'";
        }
        $select = <<<SQL
        SELECT a.*,last_input.absent,last_input.reason FROM (SELECT id,userid,concat(classid,"*",attendance_only) as classid,date,sum(time) as time,max(id) as maxId
        FROM approved_attendance_log a
SQL;
        $where = ' WHERE userid in (' . implode(',',$studentIds).')';
        $where .= count($classes)?' AND concat(classid,"*",attendance_only) in ("' . implode('","',$classes).'")':'';
        $where .= count($dates)?' AND date in ("' . implode('","',$dates).'")':'';
        $where .= $filterDateRange;

        $groupBy = <<<SQL
        GROUP BY userid,classid,attendance_only,date) a
        JOIN approved_attendance_log last_input ON a.maxId = last_input.id
SQL;
        return $select.$where.$groupBy;
    }
    private static function listOfStudentsClassesAndDates($students){
        $studentIds = array();
        $classes = array();
        $dates = array();

        foreach($students as $key=>$value){
            if(gettype($value) != 'array'){
                $studentIds[]=$value;
            }else{
                $studentIds[]=$key;
                self::appendToClassesAndDates($classes,$dates,$value);
            }
        }

        return [$studentIds,$classes,$dates];
    }
    private static function appendToClassesAndDates(&$classes,&$dates,$studentClasses){
        foreach($studentClasses as $class){
            foreach($class['dates'] as $date){
                if(in_array($date['date'],$dates)===false){
                    $dates[]=$date['date'];
                }
            }
            if(in_array($class['id'],$classes)===false){
                $classes[]=$class['id'];
            }
        }
    }

    public static function insertApprovedAttendances($userId,$classes){
        $query = self::insertApprovedAttendancesQuery($userId,$classes);
        if($query){
            Utility::getInstance()->insert($query);
        }
    }
    private static function insertApprovedAttendancesQuery($userId,$classes){
        $values = array();
        foreach($classes as $class){
            $classId = explode('*',$class['id'])[0];
            $attendanceOnly = explode('*',$class['id'])[1];
            foreach($class['dates'] as $date){
                if($date['time']==0 && !$date['absent']){
                    continue;
                }
                $values[]= '("'. implode('","',[$userId,$classId,$attendanceOnly,$date['date'],$date['time'],@$date['absent'],@$date['reason']]) . '")';
            }
        }

        return count($values)?"INSERT INTO approved_attendance_log (userid,classid,attendance_only,date,time,absent,reason) values ". implode(',',$values):null;
    }
    public static function deleteDraftAttendances($userId,$classes){
        $deleteDates = array();
        $deleteClasses = array();
        foreach($classes as $class){
            foreach ($class['dates'] as $key=>&$date) {
                Utility::addToArrayIfNotExists($date['date'],$deleteDates);
            }
            Utility::addToArrayIfNotExists($class['id'],$deleteClasses);
        }
        $query = sprintf(self::$queryDeleteDraft,implode("','",$deleteClasses),implode("','",$deleteDates));
        Utility::getInstance()->insert($query,['userId'=>$userId]);
    }
    private static $queryDeleteDraft = <<<SQL
    DELETE FROM attendance WHERE userid = :userId and concat(classid,'*',attendance_only) in ('%s') and date in ('%s')
SQL;


}
