<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.21.10
 * Time: 12:54
 */

namespace English3\Controller\Reports;




use English3\Controller\CSVExporter;
use English3\Controller\CSVField;
use English3\Controller\CSVFieldType;
use English3\Controller\CSVRow;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class DashboardReport {
    private $exporter;
    public function help(Request $request){

        $response ="<p>For a specific date range use /api/dashboard-report?range=yyyymmdd-yyyymmdd</p>".
                   "<p>For a simplified date range use /api/dashboard-report?range=1W</p>".
                   "<p>Acceptable range letters: D W M Y</p>";
        return new Response($response);
    }
    public function get(Request $request){
        list($startDate,$endDate) = $this->prepareDateRange($request);
        $this->exporter = new CSVExporter();
        $this->createCSV(Utility::getInstance()->fetch($this->queryGetReport,['startDate'=>$startDate,'endDate'=>$endDate]));

        return $this->sendFile($this->exporter->writeCSV(),$startDate,$endDate);
    }
    public function getBySchool(Request $request){
        list($startDate,$endDate) = $this->prepareDateRange($request);
        $this->exporter = new CSVExporter();
        $this->createCSV(Utility::getInstance()->fetch($this->queryGetReportBySchool,['startDate'=>$startDate,'endDate'=>$endDate]));

        return $this->sendFile($this->exporter->writeCSV(),$startDate,$endDate);
    }
    private function prepareDateRange(Request $request){
        $input = $request->query->get('range');
        if($range = $this->testSpecificDateRanges($input)){
            return $range;
        }else if ($range = $this->testRangeIndicator($input)){
            return $range;
        }
        $startDate = date('Y-m-d');
        $endDate = date('Y-m-d');
        return [$startDate,$endDate];
    }
    private function testSpecificDateRanges($input){
        preg_match("/([0-9]{8})-([0-9]{8})/", $input, $output_array);
        if(count($output_array)==3){
            return [$output_array[1],$output_array[1]];
        }
    }
    private function testRangeIndicator($input){
        preg_match("/([0-9][A-z])/", $input, $output_array);
        if(count($output_array)){
            $interval = $output_array[0];
            $di = new \DateInterval('P'.$interval);
            $di->invert = 1;
            $startDate = (new \DateTime())->add($di)->format('Y-m-d');
            return [$startDate,date('Y-m-d')];
        }
    }
    private function createCSV($data){
        $this->csvHeader($this->exporter);
        $this->csvBody($this->exporter,$data);
    }
    private function csvHeader(CSVExporter $exporter){
        $header = array_map(function($col){
            return new CSVField(CSVFieldType::STATIC_TYPE,$col);
        },$this->csvHeader);
        $exporter->addRow(
            new CSVRow([],$header)
        );
    }
    private function csvBody(CSVExporter $exporter,$data){
        foreach($data as $row){
            $csvRow = array();
            foreach($this->csvHeader as $col){
                $csvRow[]=new CSVField(CSVFieldType::STATIC_TYPE,$row[$col]);
            }
            $exporter->addRow(new CSVRow([],$csvRow));
        }
    }
    private function sendFile($fileData,$startDate,$endDate){
        $response = new Response();
        $filename = 'dashboardreport_'.$startDate.'_'.$endDate.'.csv';
//        $fh = fopen($filename, 'w');
//        fwrite($fh, $fileData);
//        fclose($fh);
//        mb_convert_encoding($filename, 'UTF-16LE', 'UTF-8');

        $response->headers->set('Cache-Control', 'private');
        $response->headers->set('Content-Encoding', 'UTF-8');
        $response->headers->set('Content-type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . basename($filename) . '";');

        $response->sendHeaders();
        $response->setContent($fileData);
//        ob_clean();
//        flush();
//        unlink($filename);
        return $response;
    }
    private $csvHeader = [
        'name',
        'className',
        'classId',
        'all_active_students',
        'old_active_students',
        'new_active_students',
        'posts',
        'quizzes'
    ];
    private $queryGetReport = <<<SQL
    select o.name,
    c.name as className,
    c.id as classId,
    count(distinct uc.userid) as all_active_students,
COUNT(DISTINCT CASE WHEN users.created < :startDate THEN uc.userid END) as old_active_students,
COUNT(DISTINCT CASE WHEN users.created > :startDate THEN uc.userid END) as new_active_students,
    count(distinct posts.id) as posts,
    count(distinct qs.id) as quizzes
    from organizations o
    join departments d on o.id = d.organizationid
    join courses co on co.departmentid = d.id
    join classes c on c.courseid = co.id
    join units u on u.courseid = co.id
    join pages p on p.unitid = u.id
    join user_classes uc on uc.classid = c.id
    join users on users.id = uc.userid
    left join posts on posts.userid = uc.userid and posts.pageid = p.id
    left join quiz_scores qs on qs.quiz_id = p.id and qs.user_id = uc.userid
    where uc.is_student = 1 and
    (posts.created >= :startDate or qs.submitted >= :startDate) and
    (posts.created <= :endDate or qs.submitted <= :endDate)
    group by o.id,c.id
    order by o.name,c.name
SQL;
    private $queryGetReportBySchool = <<<SQL
    select o.name,
    count(distinct uc.userid) as all_active_students,
COUNT(DISTINCT CASE WHEN users.created < :startDate THEN uc.userid END) as old_active_students,
COUNT(DISTINCT CASE WHEN users.created > :startDate THEN uc.userid END) as new_active_students,
    count(distinct posts.id) as posts,
    count(distinct qs.id) as quizzes
    from organizations o
    join departments d on o.id = d.organizationid
    join courses co on co.departmentid = d.id
    join classes c on c.courseid = co.id
    join units u on u.courseid = co.id
    join pages p on p.unitid = u.id
    join user_classes uc on uc.classid = c.id
    join users on users.id = uc.userid
    left join posts on posts.userid = uc.userid and posts.pageid = p.id
    left join quiz_scores qs on qs.quiz_id = p.id and qs.user_id = uc.userid
    where uc.is_student = 1 and
    (posts.created >= :startDate or qs.submitted >= :startDate) and
    (posts.created <= :endDate or qs.submitted <= :endDate)
    group by o.id
    order by o.name
SQL;
}