<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.2.12
 * Time: 14:20
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\Utility;

class MissingAttendanceSQL{

    public function getUsersAttendanceForDateRange($userIds,$minDate=null,$maxDate=null,$classId=null){
        if(!$userIds && $classId){
            $userIds = $this->getUsersForClass($classId);
        }
        $userArray = implode(',',$userIds);
        $query = self::$queryGetMissingAttendance." and u.id in ({$userArray}) GROUP BY u.id,c.id,a.date order by u.lname,u.fname,a.classid";
        $maxDate=is_null($maxDate)?(new \DateTime())->format('Y-m-d'):(new \DateTime($maxDate))->format('Y-m-d');
        $minDate=is_null($minDate)?0:(new \DateTime($minDate))->format('Y-m-d');

        $params = ['maxDate'=>$maxDate,'minDate'=>$minDate];
        if($classId){
            $query.=' and a.classid=:classId';
            $params['classId']=$classId;
        }
        return Utility::getInstance()->fetch($query,$params);
    }
    private function getUsersForClass($classId){
        $data =Utility::getInstance()->fetch('SELECT userid FROM user_classes WHERE classid = :classId and is_student=1',['classId'=>$classId]);
        return array_map(function($s){return $s['userid'];},$data);
    }
    public function getMissingAttendanceForDateRangeInOrg($orgId,$minDate=null,$maxDate=null){
        return Utility::getInstance()->fetch(self::$queryGetOnlyMissingAttendanceForOrg, ['maxDate'=>$maxDate,'minDate'=>$minDate,'orgId'=>$orgId]);
    }
    public function getStudentAttendanceForDateRangeInOrg($orgId,$minDate=null,$maxDate=null){
        $query= self::$queryGetMissingAttendance;
        $query .= " and u.organizationid = :orgId GROUP BY u.id,c.id,a.date order by u.lname,u.fname,a.classid limit 20";
        $maxDate=is_null($maxDate)?(new \DateTime())->format('Y-m-d'):(new \DateTime($maxDate))->format('Y-m-d');
        $minDate=is_null($minDate)?'2015-01-01':(new \DateTime($minDate))->format('Y-m-d');

        $params = ['maxDate'=>$maxDate,'minDate'=>$minDate,'orgId'=>$orgId];
        return Utility::getInstance()->fetch($query,$params);
    }
    public static $queryGetOnlyMissingAttendanceForOrg = <<<SQL
    SELECT base.*,sum(al.time) total_attendance,sum(al.absent) as absent FROM (SELECT *,yearweek(day) as week FROM (SELECT
      concat(u.fname,' ',u.lname) as studentName,
      u.external_id,
      u.phone,
      u.id,
      u.fname,
      u.lname,
      c.LMS_id,
      c.name as className,
      concat(c.id,'*',c.attendance_only) as classId,
      uc.date_left,
      uc.date_started,
      c.id as classid_,
      c.attendance_only
    FROM users u
      LEFT JOIN (
             SELECT '0' as attendance_only,uc.userid,uc.classid,if(uc.manual_start_date,uc.manual_start_date,uc.created) as date_started,if(uc.manual_end_date,uc.manual_end_date,uc.date_left) as date_left FROM user_classes uc
             UNION ALL
             SELECT '1' as attendance_only,uac.userid,uac.classid,if(uac.manual_start_date,uac.manual_start_date,uac.date_started) as date_started,if(uac.manual_end_date,uac.manual_end_date,uac.date_left) as date_left FROM user_attendance_only_classes uac
           ) uc ON uc.userid = u.id
      LEFT JOIN (
          select '0' as attendance_only,uc.classid,uc.userid FROM user_classes_history uc
          union all
          select '1' as attendance_only,uac.classid,uac.userid FROM user_attendance_only_classes_history uac
	  ) uch ON uch.userid = u.id and not (uch.userid=uc.userid and uch.classid = uc.classid)
      JOIN (
             SELECT '0' as attendance_only,c.name,c.id,c.LMS_id,c.exclude_from_alerts FROM classes c
             UNION ALL
             SELECT '1' as attendance_only,ac.name,ac.id,NULL,'0' as exclude_from_alerts FROM attendance_only_classes ac
           ) c ON uc.classid = c.id and uc.attendance_only = c.attendance_only


    WHERE c.exclude_from_alerts = 0 and u.track_attendance=1 and if(u.attendance_withdraw_date,u.attendance_withdraw_date > curdate(),1)
          and (uc.date_left is null or uc.date_left >= CURRENT_DATE())  and 1 %s

    GROUP BY u.id,c.id order by u.lname,u.fname) att, (
    SELECT DATE_ADD(:minDate, INTERVAL t4+t16+t64+t256+t1024 DAY) day
    FROM
    (SELECT 0 t4    UNION ALL SELECT 1   UNION ALL SELECT 2   UNION ALL SELECT 3  ) t4,
    (SELECT 0 t16   UNION ALL SELECT 4   UNION ALL SELECT 8   UNION ALL SELECT 12 ) t16,
    (SELECT 0 t64   UNION ALL SELECT 16  UNION ALL SELECT 32  UNION ALL SELECT 48 ) t64,
    (SELECT 0 t256  UNION ALL SELECT 64  UNION ALL SELECT 128 UNION ALL SELECT 192) t256,
    (SELECT 0 t1024 UNION ALL SELECT 256 UNION ALL SELECT 512 UNION ALL SELECT 768) t1024
    ) b
    where b.day >= att.date_started and b.day <= att.date_left and b.day < :maxDate and DAYOFWEEK(b.day)<>1 and DAYOFWEEK(b.day)<>7
                                                                                                                     ) base
      LEFT JOIN approved_attendance_log al ON al.userid = base.id and base.classid_ = al.classid and base.attendance_only = al.attendance_only and al.date = base.day

      GROUP BY base.id,base.week
    having total_attendance is null and (absent = 0 or absent is null)
SQL;
    private static $queryGetMissingAttendance = <<<SQL
    SELECT
        concat(u.fname,' ',u.lname) as studentName,
        u.external_id,
        u.phone,
        u.id,
        u.fname,
        u.lname,
        c.LMS_id,
        c.name as className,
        concat(c.id,'*',c.attendance_only) as classId,
        a.date as date,
        sum(a.time) as attendance,
        uc.date_started as dateEnrolled
    FROM users u
    LEFT JOIN (
      SELECT '0' as attendance_only,uc.userid,uc.classid,if(uc.manual_start_date,uc.manual_start_date,uc.created) as date_started,if(uc.manual_end_date,uc.manual_end_date,uc.date_left) as date_left FROM user_classes uc
      UNION ALL
      SELECT '1' as attendance_only,uac.userid,uac.classid,if(uac.manual_start_date,uac.manual_start_date,uac.date_started) as date_started,if(uac.manual_end_date,uac.manual_end_date,uac.date_left) as date_left FROM user_attendance_only_classes uac
    ) uc ON uc.userid = u.id
      LEFT JOIN (
          select '0' as attendance_only,uc.classid,uc.userid FROM user_classes_history uc
          union all
          select '1' as attendance_only,uac.classid,uac.userid FROM user_attendance_only_classes_history uac
	  ) uch ON uch.userid = u.id and not (uch.userid=uc.userid and uch.classid = uc.classid)
    JOIN (
      SELECT '0' as attendance_only,c.name,c.id,c.LMS_id,c.exclude_from_alerts FROM classes c
      UNION ALL
      SELECT '1' as attendance_only,ac.name,ac.id,NULL,'0' as exclude_from_alerts FROM attendance_only_classes ac
    ) c ON (uc.classid = c.id or uch.classid = c.id) and (uc.attendance_only = c.attendance_only or uch.attendance_only = c.attendance_only )
    LEFT JOIN approved_attendance_log a ON a.userid = u.id and c.id = a.classid and c.attendance_only = a.attendance_only and (a.date is null or (a.date>=:minDate	 and a.date<=:maxDate))
    WHERE c.exclude_from_alerts = 0 and u.track_attendance=1 and if(u.attendance_withdraw_date,u.attendance_withdraw_date > curdate(),1)
     and 1
SQL;




}