<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/27/17
 * Time: 1:51 PM
 */

namespace English3\Controller\Exports;


use English3\Controller\CSVExporter;
use English3\Controller\Utility;
use Phinx\Util\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class FinalGradeExporter extends ExporterBase {
    protected function exportHeader(){
        return ['studentid','sectionid','teacherid','date','grade'];
    }
    protected function createFileName(){
        $datetime = date('YmdHis');
        $prefix = 'elmsfinalgradesexport';
        return $prefix.'_'.$datetime;
    }

    protected $queryGetHistory = <<<SQL
      SELECT
      export_filename as filename,
      count(*) as number_of_entries,
       modified_on as created_on
       from final_grades WHERE export_filename is not null and orgid = :orgId
      group by export_filename;
SQL;
    protected $queryGetPending = <<<SQL
      SELECT count(*) as number_of_entries from final_grades WHERE export_filename is  null and orgid = :orgId
SQL;
    protected $queryGetOrgFromFilename = <<<SQL
      SELECT orgid from final_grades where export_filename=:filename limit 1;
SQL;
    protected $queryGetFilenameEntries = <<<SQL
    SELECT fg.external_userid,fg.sectionid,fg.external_teacherid,fg.modified_on,fg.grade FROM final_grades fg where export_filename=:filename;
SQL;
    protected $queryGetNewEntries = <<<SQL
    SELECT fg.external_userid,fg.sectionid,fg.external_teacherid,fg.modified_on,fg.grade FROM final_grades fg where export_filename is null and orgid = :orgId;
SQL;
    protected $queryMarkEntriesAsExported = <<<SQL
    UPDATE final_grades SET export_filename = :filename WHERE export_filename is null
SQL;



}