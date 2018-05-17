<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.4
 * Time: 17:03
 */

namespace English3\Controller\Attendance;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class AttendanceSync {
    public function syncHistoryRequest(Request $request){
        return new JsonResponse(Utility::getInstance()->fetch(AttendanceSyncDB::$querySyncHistory));
    }
    public function syncQueue(Request $request){
        return new JsonResponse(['queue'=>AttendanceSyncDB::syncQueue()]);
    }
    public static function markAsSynced($attendanceTable){
        $ids = self::attendanceIds($attendanceTable);
        $now = date('Y-m-d H:i:s');
        $query = AttendanceSyncDB::queryMarkAsSynced($ids,$now);
        if($query){
            Utility::getInstance()->insert($query);
        }

    }
    private static function attendanceIds($attendanceTable){
        $ids  = array_map(function($a){
            if(is_null($a['Synced on'])){
                return $a['id'];
            }
        },$attendanceTable);

        return array_filter($ids);
    }

}
class AttendanceSyncDB{
    public static function queryMarkAsSynced($ids,$datetime){
        $values = array();
        foreach($ids as $id){
            $values[] = sprintf("(%s,'%s')",$id,$datetime);
        }
        return count($values)?sprintf(self::$queryMarkAsSynced_,implode(',',$values)):'';
    }
    public static function syncQueue(){
        return Utility::getInstance()->fetchOne(self::$querySyncQueue);
    }
    public static $querySyncHistory = <<<SQL
    SELECT DISTINCT synced_on FROM approved_attendance_log WHERE synced_on is not null ORDER BY synced_on DESC;
SQL;
    private static $queryMarkAsSynced_ = <<<SQL
    INSERT INTO
      approved_attendance_log (id,synced_on) values %s
      ON DUPLICATE KEY UPDATE synced_on = values(synced_on)
SQL;
    private static $querySyncQueue = <<<SQL
    SELECT count(distinct a.id)
    FROM users u
    LEFT JOIN (
	  select '0' as attendance_only,uc.classid,uc.userid FROM user_classes uc
	  union all
	  select '1' as attendance_only,uac.classid,uac.userid FROM user_attendance_only_classes uac
	) uc ON uc.userid = u.id
	LEFT JOIN (
	  select '0' as attendance_only,uc.classid,uc.userid FROM user_classes_history uc
	  union all
	  select '1' as attendance_only,uac.classid,uac.userid FROM user_attendance_only_classes_history uac
	) uch ON uch.userid = u.id and not (uch.userid=uc.userid and uch.classid = uc.classid)
	JOIN approved_attendance_log a ON a.userid = u.id and (uc.classid = a.classid or uch.classid = a.classid)
    JOIN (
      select '0' as attendance_only,c.id,c.name,c.LMS_id FROM classes c
      union ALL
      select '1' as attendance_only,ac.id,ac.name,NULL from attendance_only_classes ac
    ) c on c.id = a.classid and c.attendance_only = a.attendance_only
     WHERE synced_on IS NULL and time > 0;
SQL;



}