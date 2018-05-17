<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/27/17
 * Time: 1:51 PM
 */

namespace English3\Controller\Exports;


use Crontab\Job;
use English3\Controller\CSVExporter;
use English3\Controller\Utility;
use Phinx\Util\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Crontab\Crontab;
class AttendanceExporter extends  ExporterBase{
    public function test(){
        $crontab = new Crontab();
        $job = new Job();
        $job->setCommand('ls');
        $job->setMinute(0);
        $job->setComments("Attendance exporter - orgId 10");
        $crontab->removeJob($job);
        $crontab->write();
        return new JsonResponse('ok');
    }
    protected function downloadCorruptedEntries($id,$type=null){
        if($type=='sectionid'){
            return $this->downloadSectionIdCorruptedEntries($id);
        }
        if($type=='studentid_number'){
            return $this->downloadStudentIdCorruptedEntries($id);
        }
        return parent::downloadCorruptedEntries($id,$type);
    }

    protected function downloadSectionIdCorruptedEntries($classId)
    {
        $data = Utility::getInstance()->fetch($this->queryGetEntriesForClass,['classId'=>$classId]);
        $fileContent = $this->createFileFromEntries($data);
        return Utility::buildFileResponse($fileContent,"attendance_classid_{$classId}.csv");
    }
    protected function downloadStudentIdCorruptedEntries($studentId)
    {
        $data = Utility::getInstance()->fetch($this->queryGetEntriesForUser,['userId'=>$studentId]);
        $fileContent = $this->createFileFromEntries($data);
        return Utility::buildFileResponse($fileContent,"attendance_studentid_{$studentId}.csv");
    }

    protected function createFileName(){
        $datetime = date('YmdHis');
        $prefix = 'ignorethis';
        return $prefix.'_'.$datetime;
    }
    protected function exportHeader()
    {
        return ['StudentID','Date','filename','minutes','SectionID','SchoolID','RecordID'];
    }
    protected function getCorruptedEntries($orgId){
        $corruptedEntries = new CorruptedEntries();
        $this->getEntriesMissingSectionid($orgId,$corruptedEntries);
        $this->getEntriesMissingIdNumber($orgId,$corruptedEntries);
        return $corruptedEntries;
    }
    private function getEntriesMissingSectionid($orgId,CorruptedEntries &$corruptedEntries){
        $missingSectionId = intval(Utility::getInstance()->fetchOne($this->queryGetMissingSectionId,['orgId'=>$orgId]));
        $missingSectionIdDetails = Utility::getInstance()->fetch($this->queryGetMissingSectionIdDetails,['orgId'=>$orgId]);
        if($missingSectionId)
        {
            $corruptedEntries->addReason('sectionid',
                "missing sectionid. Teacher probably needs to match the PowerSchool section with the ELMS class.",
                $missingSectionId,
                $missingSectionIdDetails
            );
        }
    }
    private function getEntriesMissingIdNumber($orgId,CorruptedEntries &$corruptedEntries){
        $missing = intval(Utility::getInstance()->fetchOne($this->queryGetMissingIdNumber,['orgId'=>$orgId]));
        $missingDetails = Utility::getInstance()->fetch($this->queryGetMissingIdNumberDetails,['orgId'=>$orgId]);
        if($missing)
        {
            $corruptedEntries->addReason('student_idnumber',
                "missing student_idnumber. Please contact E3 staff to set it.",
                $missing,
                $missingDetails
            );
        }
    }

    protected $exportType = 'attendance';
    protected $queryGetHistory = <<<SQL
      SELECT
      export_filename as filename,
      count(*) as number_of_entries,
       synced_on as created_on
       from approved_attendance_log WHERE export_filename is not null and orgid = :orgId
      group by export_filename;
SQL;
    protected $queryGetPending = <<<SQL
      SELECT count(*) as number_of_entries from approved_attendance_log WHERE export_filename is  null and orgid = 
      :orgId and sectionid is not null and external_userid is not null and time > 0
SQL;
    protected $queryGetMissingSectionId = <<<SQL
      SELECT count(*) as number_of_entries from approved_attendance_log WHERE export_filename is  null and orgid = 
      :orgId and external_userid is not null and sectionid is null and time > 0
SQL;
    protected $queryGetMissingSectionIdDetails = <<<SQL
      SELECT a.classid as id,if(c.id,c.name,"Class manually delete") as name, count(*) as number_of_entries from approved_attendance_log a
       left join classes c on c.id = a.classid
       WHERE export_filename is  null and orgid = :orgId and a.sectionid is null and time > 0 group by a.classid
SQL;
    protected $queryGetMissingIdNumber = <<<SQL
      SELECT count(*) as number_of_entries from approved_attendance_log a
       join users u on u.id = a.userid WHERE export_filename is  null and orgid = 
      :orgId and u.ps_idnumber is null and time > 0
SQL;
    protected $queryGetMissingIdNumberDetails = <<<SQL
      SELECT a.userid as id,concat(u.fname,' ',u.lname) as name, count(*) as number_of_entries from 
      approved_attendance_log a
       join users u on u.id = a.userid
       WHERE export_filename is  null and orgid = :orgId and u.external_id is null and time > 0 group by a.userid
SQL;
    protected $queryGetOrgFromFilename = <<<SQL
      SELECT orgid from approved_attendance_log where export_filename=:filename limit 1;
SQL;
    protected $queryGetFilenameEntries = <<<SQL
    SELECT a.external_userid,a.date,a.export_filename,a.time,a.sectionid,'120',id FROM approved_attendance_log a where 
    export_filename=:filename;
SQL;
    protected $queryGetNewEntries = <<<SQL
    SELECT a.external_userid,a.date,a.export_filename,a.time,a.sectionid,'120',id FROM approved_attendance_log a where 
    export_filename is null and orgid = :orgId and a.sectionid is not null and a.external_userid is not null and a.time >0;
SQL;
    protected $queryMarkEntriesAsExported = <<<SQL
    UPDATE approved_attendance_log a SET export_filename = :filename, synced_on = CURRENT_TIMESTAMP() WHERE 
    export_filename is null and a.sectionid is not null and a.external_userid is not null and a.time > 0
SQL;
    protected $queryGetEntriesForClass = <<<SQL
    SELECT a.external_userid,a.date,a.export_filename,a.time,a.sectionid,'120',id FROM approved_attendance_log a WHERE a.classid = :classId and a.attendance_only = 0 and export_filename is null and time > 0
SQL;
    protected $queryGetEntriesForUser = <<<SQL
    SELECT a.external_userid,a.date,a.export_filename,a.time,a.sectionid,'120',id FROM approved_attendance_log a 
    WHERE a.userid = :userId and export_filename is null and time > 0
SQL;




}