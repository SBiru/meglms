<?php

namespace English3\Controller;

use English3\Controller\Attendance\AttendanceApproval;
use English3\Controller\Attendance\AttendanceApprovalDB;
use English3\Controller\Attendance\AttendanceSync;
use English3\Controller\AutomatedAlerts\Alerts\MissingAttendance;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Serializer\Encoder\JsonDecode;
use XMLReader;
use SimpleXML;
use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AttendanceController{
    public function __construct(Connection $reader) {
        $this->util = Utility::getInstance();
        $this->reader = $reader;
    }
    private function buildFileResponse($content,$filename){
        $headers = array(
            'Content-Description'=>'File Transfer',
            'Content-Type'=>'application/octet-stream',
#            'Content-Disposition'=> 'attachment, filename=S3S.cfg',
            'Content-Length'=> ''.strlen($content),
            'Cache-Control'=> 'must-revalidate, post-check=0, pre-check=0',
            'Expires'=> '0',
            'Pragma'=> 'public',
        );
        $response = new Response($content,200,$headers);
        $d = $response->headers->makeDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $filename
        );
        $response->headers->set("Set-Cookie","fileDownload=true; path=/");
        $response->headers->set('Content-Disposition', $d);
        return $response;
    }
    private function createDefaultFile($data){
        return $this->createGenericLayout($data,null,json_decode($this->defaultLayout,true));
    }

    private function createPowerSchoolFile($data){
        $fileContent = '';
        $fileContent.= 'Student_Number';
        $fileContent.= ',Att_Date';
        $fileContent.= ',Total_Minutes';
        $fileContent.= ',Attendance Code';
        $fileContent.= ',Att_Mode_Code';
        $fileContent.= ',LMS_id'."\r\n";
        foreach($data as $advisee){
            if(count($advisee['data'])){
                foreach($advisee['data'] as $class){
                    foreach($class['dates'] as $date){
                        $fileContent.=$advisee['externalId'];
                        $fileContent.=','.$date['date'];
                        $fileContent.=','.round(intval($date['time'])/60.0,2);
                        $fileContent.=',O,ATT_ModeTime';
                        $fileContent.=','.$class['lmsId']."\r\n";

                    }
                }
            }
        }
        return $fileContent;
    }
    private function createMissingFile($missing){
        $fileContent = 'Name,Phone'."\r\n";
        foreach($missing as $user){
            $fileContent.=$user['name'].','.$user['phone']."\r\n";
        }
        return $fileContent;
    }
    private function prepareDates($params){
        $dates = array($params['startDate']);
        $lastDate = new \DateTime($params['startDate']);
        $lastDate->add(new \DateInterval('P1D'));
        $endDate = $params['endDate']?new \DateTime($params['endDate']):new \DateTime();
        while($lastDate<$endDate){
            $dates[]=$lastDate->format('Y-m-d');
            $lastDate->add(new \DateInterval('P1D'));
        }
        return $dates;
    }
    private function createDatesTmpTable($params){
        $dates = $this->prepareDates($params);
        $this->util->reader->executeUpdate("CREATE TEMPORARY TABLE IF NOT EXISTS tmp_dates (date DATE null)");
        $dates = implode("'),('",$dates);
        $this->util->reader->executeUpdate("INSERT INTO tmp_dates values ('{$dates}')");
    }
    private function queryForApprovedAttendances($params){
        $query = self::$queryGetApprovedAttendanceTable;
        $queryParams = array();
        if(!@$params['all']) {
            $query .= ' and u.id in (:advisees)';
        }
        if($params['previousSyncOptions']){
            if($params['previousSyncOptions']['type']=='last'){
                $query = sprintf($query,'((a.synced_on is null))');

            }else{
                $query = sprintf($query,'((a.synced_on=:lastSync))');
                $queryParams = ['lastSync'=>$params['previousSyncOptions']['syncDateTime']['synced_on']];
            }
        }else{
            $query = sprintf($query,'((a.date>=:minDate and a.date<=:maxDate))');
            $queryParams = [
                'minDate'=>$params['startDate'],
                'maxDate'=>$params['endDate'],
            ];
        }
        return [$query,$queryParams];
    }
    private function createGenericLayout($params,$layout,$layoutOptions=null){
        if(!$layoutOptions){
            $layoutOptions = self::_getLayout($layout);
        }

        if(@$params['approvedOnly']){
            list($query,$queryParams) = $this->queryForApprovedAttendances($params);

        }else{
            $this->createDatesTmpTable($params);
            $query = self::$queryGetAttendanceTable;
            $queryParams = [
                'minDate'=>$params['previousSyncOptions']?'':$params['startDate'],
                'maxDate'=>$params['previousSyncOptions']?date('Y-m-d'):$params['endDate'],
            ];
            list($queryApproved,$queryApprovedParams) = $this->queryForApprovedAttendances($params);
            $query.=' union '.$queryApproved;
            $queryParams = array_merge($queryParams,$queryApprovedParams);
        }

        if($params['classId']){
            $query.=' and c.id = '.$params['classId'];
        }
        $advisees = array_map(function($advisee){return $advisee['id'];},$params['advisees']);
        $paramTypes = [];
        if(!$params['all']){
            $queryParams['advisees']=$advisees;
            $paramTypes = ['advisees'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY];
        }


        $originalTable = $this->util->reader->fetchAll($query,
            $queryParams,
            $paramTypes
        );
        $this->originalExportTable = $originalTable;
        $this->util->reader->executeUpdate("DROP TEMPORARY TABLE IF EXISTS tmp_dates");
        $selectedGroups = array();
        foreach($layoutOptions['columns'] as $col){
            if($col['obj'] && !isset($selectedGroups[$col['obj']])){
                $selectedGroups[$col['obj']]=$col['name'];
            }
        }
        $groupedTableTmp = Utility::groupBy($originalTable,function($row) use($selectedGroups){
            $index='';
            foreach($selectedGroups as $group){
                $index .='|' . $row[$group];
            }
            return $index;
        });

        $groupedTable = array();
        foreach($groupedTableTmp as $group){
            $totalAttendance = array_reduce($group,function($memo,$r){
                return $memo + $r['Attendance'];
            });
            $groupedRow = $group[0];

            $groupedRow['Attendance'] = $totalAttendance;
            $groupedTable[]=$groupedRow;
        }
        $finalTable = array();
        $header = array();
        $rowToColumns = array();
        $asColumnIndex=null;

        foreach($layoutOptions['columns'] as $col) {
            if (boolval($col['asColumns'])) {
                $asColumnIndex = $col['name'];
                foreach ($groupedTable as $group) {
                    $colName = $group[$col['name']];
                    if (!isset($rowToColumns[$colName])) {
                        $rowToColumns[$colName]=0;
                    }
                    if(!Utility::findWhere($header,['name'=>$colName])){
                        $colValue = $rowToColumns[$colName];
                        $header[]=[
                            'name'=>$colName,
                            'label'=>$colName,
                            'tblIndex'=>$colName,
                            'convertTime'=>true
                        ];
                        foreach($groupedTable as &$g){
                            if(!isset($g[$colName])){
                                $g[$colName]=0;
                            }
                        }
                    }
                }
            }else{
                $header[]=$col;
            }
        }
        if($asColumnIndex){
            $groupedTable = Utility::groupBy($groupedTable,function($r) use($selectedGroups,$asColumnIndex){
                $index = '';
                foreach($selectedGroups as $group){
                    if($group!=$asColumnIndex){
                        $index .= '|' . $r[$group];
                    }
                }
                return $index;
            });
            $groupedTable = array_map(function($g) use($asColumnIndex){
                $row = $g[0];
                foreach($g as $r){
                    $row[$r[$asColumnIndex]]+=$r['Attendance'];
                }
                return $row;
            },$groupedTable);

        }
        foreach($groupedTable as $group){
            $row = array();
            foreach($header as $col){
                $row[$col['name']]=$group[$col['name']];
            }
            $finalTable[]=$row;
        }
        $fileContent='';
        foreach($header as $col){
            $fileContent.='"'.$col["label"].'",';
        }
        $fileContent=substr($fileContent,0,-1)."\r\n";
        foreach($finalTable as $row){
            foreach($header as $col){
                if($col['name']=="Attendance" || @$col['convertTime']){
                    if(isset($layoutOptions['timeUnit'])){
                        if($layoutOptions['timeUnit']=='minutes'){
                            $row[$col['name']]=round(intval($row[$col['name']])/60.0,2);
                        }elseif($layoutOptions['timeUnit']=='hours'){
                            $row[$col['name']]=round(intval($row[$col['name']])/3600.0,2);
                        }
                    }
                }
                if($col['name']=="Date"){
                    if(isset($layoutOptions['dateFormat'])){
                        $format = '';
                        $separator = isset($layoutOptions['timeSeparator'])?$layoutOptions['timeSeparator']:'-';
                        foreach($layoutOptions['dateFormat'] as $f){
                            $format.=$separator.($f=='Month'?'m':($f=='Day'?'d':'Y'));
                        }
                        $format = substr($format,1);
                        $row[$col['name']] = date($format,(new \DateTime($row[$col['name']]))->getTimestamp());
                    }

                }
                $fileContent.='"'.$row[$col["name"]].'",';
            }
            $fileContent=substr($fileContent,0,-1)."\r\n";
        }
        return $fileContent;
    }
    private function createFile($data,$layout){
        $fileContent = '';
        if(intval($layout)){
            $fileContent=$this->createGenericLayout($data,$layout);
        }elseif($layout=='default'){
            $fileContent=$this->createDefaultFile($data);
        }elseif($layout=='powerschool'){
            $fileContent=$this->createPowerSchoolFile($data);
        }

        return $fileContent;
    }
    public function getMissing(Request $request){
        Utility::clearPOSTParams($request);
        if(!$request->request->has('users')){
            return Utility::buildHTTPError('Please select at least one user');
        }
        if(!$request->request->has('minDate')){
            return Utility::buildHTTPError('Start date is required');
        }

        $advisees = $request->request->get('users');
        $startDate = $request->request->has('minDate')?$request->request->get('minDate'):null;
        $endDate = $request->request->has('maxDate')?$request->request->get('maxDate'):null;
        $classId = $request->request->has('classId')?$request->request->get('classId'):null;


        $alert = new MissingAttendance(array());

        $missing = $alert->getMissingAttendanceGivenStudentIds($advisees,$startDate,$endDate,$classId);
        if(boolval($request->request->has('download'))){
            return $this->buildFileResponse($this->createMissingFile($missing),'missing_attendance.csv');
        }else{
            return new JsonResponse(['users'=>$missing]);
        }


    }
    public function export(Request $request){
        Utility::clearPOSTParams($request);
        if($request->request->has('type') && $request->request->get('type')=='json'){
            $requestData = json_decode($request->request->get('content'),true);
            foreach($requestData as $key=>$value){
                $request->request->set($key,$value);
            }
        }

        if(!$request->request->has('advisees')){
            return Utility::buildHTTPError('Please select at least one advisee');
        }

        $data = array();
        $advisees = $request->request->get('advisees');
        $startDate = $request->request->has('startdate')?$request->request->get('startdate'):null;
        $endDate = $request->request->has('enddate')?$request->request->get('enddate'):null;
        $classId = $request->request->has('classId')?$request->request->get('classId'):null;
        $layout = $request->request->has('layout')?$request->request->get('layout'):'default';
        $exportType = $request->request->get('exportType');
        $approvedOnly = $exportType?$exportType['id']=='approved':false;
        $removeFromSyncQueue = boolval($exportType['removeFromSyncQueue']);
        $all = $request->request->get('all');
        $fromPreviousSync = boolval($request->request->get('fromPreviousSync'));
        if($fromPreviousSync){
            $previousSyncOptions = array(
                'type'=> $request->request->get('fromPreviousSyncType'),
                'syncDateTime'=>$request->request->get('selectedSyncDate')
            );
        }

        if(intval($layout) || $layout=='default'){
            $data=array(
                'advisees'=>$advisees,
                'classId'=>$classId,
                'approvedOnly'=>$approvedOnly
            );
            if($all){
                $data['all'] = true;
            }
            if($fromPreviousSync){
                $data['previousSyncOptions'] = $previousSyncOptions;
            }else{
                $data['startDate']=$startDate;
                $data['endDate']=$endDate;
            }

            $content = $this->createFile($data,$layout);
        }else{
            foreach($advisees as $advisee){
                $advisee['data']=self::_getForUser($advisee['id'],$startDate,$endDate,$classId);
                $data[]=$advisee;
            }
            $content = $this->createFile($data,$layout);
        }

        $filename = 'attendance_' . date('Y_m_d').'.csv';
        if(boolval($request->request->has('preview'))){
            return new JsonResponse(['content'=>$content]);
        }else{
            if($approvedOnly && isset($this->originalExportTable) && $removeFromSyncQueue){
                AttendanceSync::markAsSynced($this->originalExportTable);
            }
            return $this->buildFileResponse($content,$filename);
        }

    }
    public function save(Request $request,$userId){
        Utility::clearPOSTParams($request);
        if($request->request->has('classId')){

        }elseif($request->request->has('classes')){
            $classes = $request->request->get('classes');
            $data = array();
            foreach($classes as $class){
                foreach($class['dates'] as $date){
                    if(isset($date['absent']) && boolval($date['absent'])){
                        $date['time']=null;
                    }
                    $classIdAttendance =explode('*',$class['id']);
                    $classId = $classIdAttendance[0];
                    $attendanceOnly = $classIdAttendance[1];
                    $data[]=array(
                        'date'=>$date['date'],
                        'userid'=>$userId,
                        'classid'=>$classId,
                        'time'=>$date['time'],
                        'absent'=>@$date['absent'],
                        'reason'=>@$date['reason'],
                        'attendance_only'=>$attendanceOnly
                    );
                }
            }
            if(count($data)){
                $queryInsert = self::queryInsertMultipleAttendance($data);
                $this->util->insert($queryInsert);
            }
            if($request->request->has('attendanceWithdrawDate')){
                $date = date('Y-m-d',strtotime(substr($request->request->get('attendanceWithdrawDate'),0,10)));
                Utility::getInstance()->reader->update('users',['attendance_withdraw_date'=>$date],['id'=>$userId]);
            }else{
                Utility::getInstance()->reader->update('users',['attendance_withdraw_date'=>null],['id'=>$userId]);
            }
            return new JsonResponse('Done');
        }
    }
    public function getLayouts(Request $request){
        $this->util->calcLoggedIn();
        $userId = $this->util->me->user->getUserId();
        $orgId = $this->util->me->user->getOrgId();

        $data = $this->util->fetch(self::$queryGetLayouts,['userId'=>$userId,'orgId'=>$orgId]);
        foreach($data as &$row){
            $options = json_decode($row['options'],true);
            $row['share']=boolval($row['is_shared']);
            unset($row['is_shared']);
            $row = array_merge($row,$options);
        }
        return new JsonResponse($data);
    }
    public function getLayout(Request $request,$id){
        $this->util->calcLoggedIn();
        return new JsonResponse(self::_getLayout($id));
    }
    public function saveLayout(Request $request){
        $u = $this->util;
        $u->calcLoggedIn();

        Utility::clearPOSTParams($request);

        $userId = $u->me->user->getUserId();
        $orgId = $u->me->user->getOrgId();

        $options = $request->request->all();
        $u->checkRequiredFields(['name','columns'],$options);

        $is_shared = boolval($options['share']);
        $name = $options['name'];
        if(!$name){
            return Utility::buildHTTPError("Layout name is required");
        }
        if(count($options['columns'])<2){
            return Utility::buildHTTPError("Layout must have at least 2 columns");
        }

        unset($options['share']);
        unset($options['name']);



        if(isset($options['id'])){
            $id=$options['id'];
            unset($options['id']);
            $options = json_encode($options);
            $u->reader->update(
                'attendance_layouts',
                array(
                    'name'=>$name,
                    'is_shared'=>$is_shared,
                    'options'=>$options
                ),
                array(
                    'id'=>$id
                )
            );
        }else{
            $options = json_encode($options);
            $params = array(
                'userid'=>$userId,
                'orgid'=>$orgId,
                'name'=>$name,
                'is_shared'=>$is_shared,
                'options'=>$options
            );

            $id = $u->insert(self::$queryInsertLayout,$params);
        }
        return new JsonResponse(self::_getLayout($id));
    }
    public function deleteLayout(Request $request,$id){
        $this->util->calcLoggedIn();
        $this->util->reader->delete(
            'attendance_layouts',
            array('id'=>$id)
        );
        return new JsonResponse('Done');
    }
    public function get(Request $request,$userId){
        return new JsonResponse(self::_getForUser(
            $userId,
            $request->query->get('minDate'),
            $request->query->get('maxDate'),
            $request->query->get('classId')
        ));
    }
    public function all(Request $request){
        $this->util->calcLoggedIn();
        Utility::clearPOSTParams($request);
        if($request->request->has('users')){
            return new JsonResponse(self::_getForUsers(
                $request->request->get('users'),
                $request->request->get('minDate'),
                $request->request->get('maxDate'),
                $request->request->get('classId')
            ));
        }
        else{
            return new JsonResponse([]);
        }

    }
    public static function _getLayout($id){
        $data = Utility::getInstance()->fetchRow(self::$queryGetLayout,['id'=>$id]);
        $data['share']=boolval($data['is_shared']);
        unset($data['is_shared']);
        $options=json_decode($data['options'],true);
        return array_merge($data,$options);
    }
    public static function _getForUsers($userIds,$minDate=null,$maxDate=null,$classId=null,$includeTimeSpent=true){
        $userArray = implode(',',$userIds);
        $query = self::$queryGetAttendance." and a.userid in ({$userArray}) order by userid,classid";
        $maxDate=is_null($maxDate)?(new \DateTime())->format('Y-m-d'):(new \DateTime($maxDate))->format('Y-m-d');
        $minDate=is_null($minDate)?0:(new \DateTime($minDate))->format('Y-m-d');

        $params = ['maxDate'=>$maxDate,'minDate'=>$minDate];
        if($classId){
            $query.=' and a.classid=:classId';
            $params['classId']=$classId;
        }
        $data = Utility::getInstance()->fetch($query,$params);
        $lastUser = null;
        $userData = array();
        $users=array();

        if($includeTimeSpent){
            foreach($userIds as $id){
                if(!isset($users[$id])){
                    $users[$id]=array();
                }
                $users[$id]['timeSpent'] = UserActivityController::_get(Utility::getInstance()->reader,$id,$minDate,'range',$maxDate);
                $users[$id]['missing_Dates']=array();
                $users[$id]['totalAttendance']=0;
            }
        }
        foreach($data as $row){
            if(is_null($lastUser) || $lastUser==$row['userid']){
                $userData[]=$row;
                $lastUser=$row['userid'];
            }else{
                $users[$lastUser]=array('classes'=> self::_getForUser(null,null,null,null,$userData));

                $userData = array();
                $userData[]=$row;
                $lastUser=$row['userid'];
            }
        }
        if(!is_null($lastUser)){
            $users[$lastUser]=array('classes'=> self::_getForUser(null,null,null,null,$userData));
        }

        $approval = new AttendanceApproval();
        $approvedAttendances = $approval->getApprovedAttendances($userIds,$params);

        self::mergeDraftWithApprovedAttendances($users,$approvedAttendances);

        $att = new MissingAttendance(array());
        $missing = $att->getMissingAttendanceGivenStudentIds($userIds,$minDate, $maxDate, $classId);
        if ($missing) {
            foreach ($users as $key => $val) {
                $temp = array();
                foreach ($missing as $item) {
                    if ($key == $item['id']) {
                        $users[$key]['totalAttendance']=$item['totalAttendance']?$item['totalAttendance']:0;
                        foreach ($item['classes'] as $itr) {
                            foreach ($itr['dates'] as $d) {
                                if (!in_array($d, $temp))
                                array_push($temp, $d);
                            }
                        }
                    }
                }
                $users[$key]['missing_Dates'] =$temp;
            }
        }

        return $users;
    }
    private static function mergeDraftWithApprovedAttendances(&$users,$approvedAttendances){
        foreach($users as $userId => &$user){
            if(@$approvedAttendances[$userId]['classes']){
                $user['classes'] = $approvedAttendances[$userId]['classes'];
                foreach($user['classes'] as &$class){
                    foreach($class['dates'] as $dateString => &$date){
                        $date['approved'] = true;
                    }
                }
            }
        }
    }
    public static function _getForUser($userId,$minDate=null,$maxDate=null,$classId=null,$data=null){
        if(is_null($data)){
            $query = self::$queryGetAttendance.' and a.userid = :userId';

            $maxDate=is_null($maxDate)?(new \DateTime())->format('Y-m-d'):(new \DateTime($maxDate))->format('Y-m-d');
            $minDate=is_null($minDate)?0:(new \DateTime($minDate))->format('Y-m-d');

            $params = ['userId'=>$userId,'maxDate'=>$maxDate,'minDate'=>$minDate];
            if($classId){
                $query.=' and a.classid=:classId';
                $params['classId']=$classId;
            }
            $data = Utility::getInstance()->fetch($query,$params);

        }
        $classes = array();

        foreach($data as $row){
            if(!isset($classes[$row['classid']])){
                $classes[$row['classid']]=array(
                    'id'=>$row['classid'],
                    'name'=>$row['name'],
                    'lmsId'=>$row['LMS_id'],
                    'dates'=>array()
                );
            }
            $classes[$row['classid']]['dates'][$row['date']]=array(
                'date'=>$row['date'],
                'time'=>$row['time'],
                'absent'=>boolval($row['absent']),
                'reason'=>$row['reason']
            );
        }

        return array_values($classes);
    }
    //$data must be array(
    // array(date=>:date,classid=>:classid,userid=>:userid,time=>:time)
    //)
    private static function queryInsertMultipleAttendance($data){
        $values = array();
        foreach($data as $row){
            $r=array();
            $r[]=$row['date'];
            $r[]=$row['classid'];
            $r[]=$row['userid'];
            $r[]=$row['time'];
            $r[]=$row['absent'];
            $r[]=$row['reason'];
            $r[]=intval($row['attendance_only']);

            $values[]=implode("','",$r);
        }
        $query = "INSERT INTO attendance (date, classid, userid, time,absent,reason,attendance_only) values ('".
            implode("'),('",$values).
            "') ON DUPLICATE KEY UPDATE time= VALUES(time), absent = VALUES(absent), reason = VALUES(reason)";
        return $query;
    }
    private $defaultLayout = '{"columns":[{"name":"Student Name","label":"Student","obj":"students","tblIndex":1,"asColumns":false,"disableAsColumns":true},{"name":"Date","label":"Date","obj":"dates","tblIndex":4,"asColumns":false,"disableAsColumns":true},{"name":"Class Name","label":"Class","obj":"classes","tblIndex":3,"asColumns":true,"disableAsColumns":false}],"timeUnit":"hours","timeSeparator":"-","dateFormat":["Month","Day","Year"]}';
    private static $queryInsertAttendance = <<<SQL
    INSERT INTO attendance (date, classid, userid, time)
     values (:date,:classid,:userid,:time)
     ON DUPLICATE KEY UPDATE time=:time
SQL;

    //Require appended filters like " and userid=:userId"
    private static $queryGetAttendance = <<<SQL
    SELECT
      a.date,
      concat(a.classid,'*',a.attendance_only) as classid,
      a.userid,
      time,
      absent,
      reason,
      c.name,
      c.LMS_id
    FROM attendance a
    JOIN (
      select '0' as attendance_only,c.id,c.name,c.LMS_id FROM classes c
      union ALL
      select '1' as attendance_only,ac.id,ac.name,NULL from attendance_only_classes ac
    ) c on c.id = a.classid and c.attendance_only = a.attendance_only
    JOIN users u ON u.id = a.userid
    left JOIN (
      SELECT '0' as attendance_only,uc.userid,uc.classid,if(uc.manual_start_date,uc.manual_start_date,uc.created) as date_started,if(uc.manual_end_date,uc.manual_end_date,uc.date_left) as date_left FROM user_classes uc
      UNION ALL
      SELECT '1' as attendance_only,uac.userid,uac.classid,if(uac.manual_end_date,uac.manual_end_date,uac.date_started) as date_started,if(uac.manual_end_date,uac.manual_end_date,uac.date_left) as date_left FROM user_attendance_only_classes uac
    ) uc ON uc.userid = u.id and uc.classid = a.classid
    WHERE a.date>=:minDate and a.date<=:maxDate and u.track_attendance=1 and if(u.attendance_withdraw_date,u.attendance_withdraw_date > curdate(),1)
    and (uc.date_left is null or uc.date_left >= CURRENT_DATE())
SQL;

    private static $queryInsertLayout = <<<SQL
    INSERT INTO attendance_layouts (userid,orgid,name,is_shared,options)
     values (:userid,:orgid,:name,:is_shared,:options)
     ON DUPLICATE KEY UPDATE orgid=values(orgid),is_shared=values(is_shared),options=values(options)
SQL;
    private static $queryGetLayout = <<<SQL
    SELECT * FROM attendance_layouts WHERE id =:id
SQL;
    private static $queryGetLayouts = <<<SQL
    SELECT * FROM attendance_layouts WHERE userid = :userId or (orgid=:orgId and is_shared=1)
SQL;
    private static $queryGetAttendanceTable = <<<SQL
    SELECT
        a.id,
        a.modified_on as 'Modified on',
        null as 'Synced on',
        0 as 'Approved',
        concat(u.fname,' ',u.lname) as 'Student Name',
        u.external_id as 'Student Number',
        c.LMS_id as 'LMS ID',
        c.name as 'Class Name',
        a.date as Date,
        a.time as Attendance,
        a.absent as Absent,
        a.reason as Reason
    FROM users u
    JOIN user_classes uc ON uc.userid = u.id
    JOIN classes c ON uc.classid = c.id
    JOIN attendance a ON a.userid = u.id and c.id = a.classid
    WHERE u.id in (:advisees) and (a.date is null or (a.date>=:minDate and a.date<=:maxDate))

SQL;
    private static $queryGetApprovedAttendanceTable = <<<SQL
    SELECT
        distinct
        a.id,
        a.modified_on as 'Modified on',
        a.synced_on as 'Synced on',
        1 as 'Approved',
        concat(u.fname,' ',u.lname) as 'Student Name',
        u.external_id as 'Student Number',
        c.LMS_id as 'LMS ID',
        if(c.id,c.name,'Class manually deleted from the system') as 'Class Name',
        a.date as Date,
        a.time as Attendance,
        a.absent as Absent,
        a.reason as Reason
    FROM approved_attendance_log a
    JOIN users u ON a.userid = u.id
    LEFT JOIN (
      select '0' as attendance_only,c.id,c.name,c.LMS_id FROM classes c
      union ALL
      select '1' as attendance_only,ac.id,ac.name,NULL from attendance_only_classes ac
    ) c on c.id = a.classid and c.attendance_only = a.attendance_only
    WHERE a.time>0 and %s

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
        c.id as classId,
        a.date as date,
        a.time as attendance
    FROM users u
    JOIN user_classes uc ON uc.userid = u.id
    JOIN classes c ON uc.classid = c.id
    LEFT JOIN attendance a ON a.userid = u.id and c.id = a.classid and (a.date is null or (a.date>=:minDate	 and a.date<=:maxDate))

    WHERE 1
SQL;

}
?>