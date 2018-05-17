<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.1.12
 * Time: 15:28
 */

namespace English3\Controller\Attendance;


use English3\Controller\AutomatedAlerts\Alerts\MissingAttendance;
use English3\Controller\AutomatedAlerts\Alerts\MissingAttendanceSQL;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class MissingAttendanceChecker {
    private $queryInsertMissingAttendance;
    public static function shouldWarning($userId){

        if(array_key_exists('MISSING_ATTENDANCE',$_SESSION)){
            if(!self::isLastCheckIsGreaterThanOneDay($_SESSION['MISSING_ATTENDANCE']['LAST_WARNING'])){
                return false;
            }
        }

        if($isMissingAttendance = boolval(Utility::getInstance()->fetchOne('SELECT userid FROM attendance_students_missing WHERE userid = :id limit 1',['id'=>$userId])) && OrganizationController::isAttendanceWarningEnabled($userId) ){
            session_start();
            $_SESSION['MISSING_ATTENDANCE']=[
                'isMissing'=>true,
                'LAST_WARNING'=>new \DateTime()
            ];
            session_write_close();
            return self::lateAttendanceReportInDays($userId);
        }else{
            session_start();
                unset($_SESSION['MISSING_ATTENDANCE']);
            session_write_close();
            return false;
        }
    }
    private static function lateAttendanceReportInDays($userId){
        $lastAttendanceReported = strtotime(Utility::getInstance()->fetchOne('SELECT date FROM approved_attendance_log where userid = :id order by date desc limit 1',['id'=>$userId]));
        $lastEndWeekReported = strtotime('next Sunday',$lastAttendanceReported);
        return ceil(abs($lastEndWeekReported - time())/60/60/24);
    }
    private static function isLastCheckIsGreaterThanOneDay(\DateTime $lastCheck){
        $lastCheckPlusOne = $lastCheck->modify('+1 day');
        $now = new \DateTime();
        return $now> $lastCheckPlusOne;
    }
    public function check(Request $request,$orgId){
        $alertChecker = new MissingAttendance(array());
        $maxDate = $request->get("maxDate")?:$this->lastWeekEndDate();
        $data= $this->loadDataFromDB($alertChecker,$orgId,'2016-01-01',$maxDate);
        return new JsonResponse($this->prepareStudents($data));

    }
    public function get(Request $request,$orgId){
        if($ids = $request->get('students')){

            $where = sprintf(' and userid in (%s)',$ids);
        }else{
            $where = " and orgid = ".$orgId;
        }
        $data = Utility::getInstance()->fetch(self::$queryGetStudentsMissingAttendance.$where);
        return new JsonResponse($this->prepareStudents($data));
    }
    public function getOrgStudentsMissingAttendance($orgId,$startDate=null,$endDate=null){
        $where = " and orgid = ".$orgId;
        $groupBy = ' group by userid';
        $query = self::$queryGetStudentsMissingAttendanceWithDetails.$where.$groupBy;
        if($startDate || $endDate){
            $where = '';
            if($startDate){
                $where.= sprintf(" and a.day >= '%s'",$startDate);
            }
            if($endDate){
                $where.= sprintf(" and a.day < '%s'",$endDate);
            }
            $query = sprintf("SELECT * FROM (%s) a WHERE 1 %s",$query,$where);
        }
        return Utility::getInstance()->fetch($query);
    }
    public function update(Request $request,$orgId){
        Utility::clearPOSTParams($request);
        $this->_update($orgId,$request->get("maxDate"));
        return new JsonResponse('ok');
    }
    public function _update($orgId,$maxDate=null,$students = null){
        $maxDate = $maxDate?:self::lastWeekEndDate();
        $this->prepareInsertQuery($students);
        $this->deleteOldData($orgId,$students);
        $twoWeeksAgo = strtotime('-14 days');
        if($isTodayMonday = (date('w',$twoWeeksAgo)==1)){
            $minDate = date('Y-m-d',$twoWeeksAgo);
        }else{
            $minDate = date('Y-m-d',strtotime('last Monday',$twoWeeksAgo));
        }

        Utility::getInstance()->insert($this->queryInsertMissingAttendance,['orgId'=>$orgId,'minDate'=>$minDate,'maxDate'=>$maxDate]);
    }
    private function prepareInsertQuery($students = null){
        if($students){
            $filterQuery = sprintf(MissingAttendanceSQL::$queryGetOnlyMissingAttendanceForOrg,'and u.id in ('.implode(',',$students).')');
        }else{
            $filterQuery = sprintf(MissingAttendanceSQL::$queryGetOnlyMissingAttendanceForOrg,'and u.organizationid = :orgId');
        }

        $this->queryInsertMissingAttendance = sprintf($this->queryInsertMissingAttendanceBase,$filterQuery);

    }
    private function deleteOldData($orgId,$students=null){
        if($students){
            Utility::getInstance()->insert($this->queryDeleteMissingAttendanceCachedData.' and userid in ('.implode(',',$students).')');
        }else{
            Utility::getInstance()->insert($this->queryDeleteMissingAttendanceCachedData.' and orgid = '.$orgId);
        }
    }
    private static function lastWeekEndDate(){
        return date('Y-m-d',strtotime('last Sunday'));
    }
    private function prepareStudents($data){
        $students = array();
        foreach($data as $row){
            $this->addUserFromRowIfNecessary($students,$row);
            $this->addMissingDateFromRow($students[$row['id']],$row);
        }
        if(count($students)==0){
            $students = ['not_found'=>true];
        }
        return $students;
    }
    private function loadDataFromDB(MissingAttendance $alertChecker,$orgId,$minDate=null,$maxDate=null){
        return $alertChecker->sql->getMissingAttendanceForDateRangeInOrg($orgId,$minDate,$maxDate);
    }
    private function addUserFromRowIfNecessary(array &$users,array $row){
        Utility::addToObjectIfNotExists($row['id'],
        [
            'id'=>$row['id'],
            'studentName'=>@$row['studentName'],
            'missing_dates'=>array()
        ]
            ,$users);
    }
    private function addMissingDateFromRow(array &$user,array $row){
        Utility::addToArrayIfNotExists($row['day'],$user['missing_dates']);
    }

    private $queryInsertMissingAttendanceBase = <<<SQL
    INSERT INTO attendance_students_missing (orgid,userid,day) select :orgId,a.id,a.day from (%s) a;
SQL;

    private static $queryGetStudentsMissingAttendance = <<<SQL
    SELECT orgid,userid as id,day FROM attendance_students_missing WHERE 1
SQL;
    private static $queryGetStudentsMissingAttendanceWithDetails = <<<SQL
    SELECT orgid,userid as id,day,userid,
    u.fname,
    u.lname,
    u.phone,
    concat(u.fname, ' ',u.lname) as name
     FROM attendance_students_missing am
      join users u on am.userid = u.id
     WHERE 1
SQL;
    private $queryDeleteMissingAttendanceCachedData = <<<SQL
    DELETE FROM attendance_students_missing WHERE 1
SQL;


}