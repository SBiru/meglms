<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.14.7
 * Time: 15:45
 */

namespace English3\Controller\Reports;


use English3\Controller\AttendanceController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class StudentAttendanceReport {

    public function __construct(){

    }
    public function get(Request $request,$userId){
        $reportCreator = new ReportCreator($userId);
        $startDate = $_REQUEST['startDate'];
        $endDate = $_REQUEST['endDate'];
        if($_REQUEST['export']){
            $reportCreator->createForDateRange($startDate,$endDate);
            $fileName = $reportCreator->reportFileName($startDate,$endDate);
            return new JsonResponse([
                    'content'=>$reportCreator->writeHtmlTable(boolval($_REQUEST['includeProgress']),$startDate,$endDate),
                    'filename'=>$fileName
                ]);
        }else{
            return new JsonResponse($reportCreator->createForDateRange($startDate,$endDate));
        }
    }



}
class ReportCreator {
    private $studentId;
    public $report;
    private $progressReportCreator;
    private $withdrawDate;
    public function __construct($studentId){
        $this->studentId = $studentId;
        $this->progressReportCreator = new StudentProgressReport($this->studentId);
        $this->withdrawDate = Utility::getInstance()->fetchOne("select attendance_withdraw_date from users where id = :id",['id'=>$studentId]);
    }
    public function createForDateRange($startDate,$endDate){
        $this->report = array(
            'progress'=>$this->progressReport(),
            'attendance'=>$this->attendanceHours($startDate,$endDate)
        );
        return $this->report;
    }
    private function progressReport(){
        return $this->progressReportCreator->getProgressForActiveClasses();
    }
    private function attendanceHours($startDate,$endDate){
        $data = AttendanceController::_getForUsers([$this->studentId],$startDate,$endDate);
        if(count($data)){
            $data = $data[$this->studentId];
        }
        return $this->prepareAttendanceHours($data,$startDate,$endDate);
    }
    private function prepareAttendanceHours($data,$startDate,$endDate){
        $weeks = $this->createWeeks($startDate,$endDate);
        $dates = array();
        foreach($data['classes'] as $class){
            foreach($class['dates'] as $date=>$dateData){
                if($dateData['approved']){
                    Utility::addToObjectIfNotExists($date,0,$dates);
                    if(!$dateData['absent']){
                        $dates[$date]+=$dateData['time'];
                    }
                }
            }
        }
        foreach($weeks as &$week){
            foreach($week as &$dateInfo){
                if(@$dateInfo['date'] && @$dates[$dateInfo['date']]){
                    $dateInfo['time']=$dates[$dateInfo['date']]/3600;
                }else{
                    if($this->isBeyondWithdraw($dateInfo['date'])){
                        $dateInfo['time'] = 'withdrawn';
                    }
                }
            }
        }
        return $weeks;
    }
    private function isBeyondWithdraw($date){
        return strtotime($this->withdrawDate) > strtotime('2000-01-01') && strtotime($this->withdrawDate) < strtotime($date);
    }
    private function createWeeks($startDate,$endDate){
        $startTimeStamp = strtotime($startDate);
        $endTimeStamp = strtotime($endDate);
        $startWeek = strtotime('last sunday midnight',$startTimeStamp);
        $endWeeks = strtotime('next saturday midnight',$endTimeStamp);
        $date = $startWeek;
        $weeks = array();
        while($date<=$endWeeks){
            if($this->isSunday($date)){
                $weeks[]=[];
            }
            $week = &$weeks[count($weeks)-1];
            $week[]=$this->addWeekDate($date,$startTimeStamp,$endTimeStamp);
            $date = strtotime('+1 day',$date);
        }
        return $weeks;
    }
    private function isSunday($date){
        return date('w',$date)==0;
    }
    private function addWeekDate($date,$startTimeStamp,$endTimeStamp){
        if($date<=$endTimeStamp && $date>=$startTimeStamp){
            return ['date'=>date('Y-m-d',$date)];
        }
        return [];
    }
    public function writeHtmlTable($includeProgress,$startDate,$endDate){
        $xlsHtmlContent = $includeProgress?ProgressTableCreator::create($this->report['progress']):ProgressTableCreator::studentName($this->report['progress']);
        $xlsHtmlContent.= $this->createAttendanceTable($this->report['attendance'],$startDate,$endDate);
        return $xlsHtmlContent;
    }

    private function createAttendanceTable($data,$startDate,$endDate){
        return AttendanceTableCreator::create($data,$startDate,$endDate);
    }
    public function reportFileName($startDate,$endDate){
        $studentName = $this->report['progress']['lname'].', '.$this->report['progress']['fname'];
        return sprintf("%s_attendance_%s_to_%s.xls",$studentName,$startDate,$endDate);
    }


}
class AttendanceTableCreator{
    public static function create($data,$startDate,$endDate){
        $style = 'font-weight:bold;font-size:20px;';
        $content = HtmlTableCreator::create(array(),[['cols'=>[['value'=>'From:','style'=>$style],['value'=>$startDate,'style'=>$style],['value'=>'to','style'=>$style],['value'=>$endDate,'style'=>$style]]]]);
        $content .= HtmlTableCreator::create(array(),[['cols'=>[['value'=>'Attendance Report','style'=>$style.'text-align:left','attrs'=>['colspan'=>2]]]]]);
        if(count($data)){
            $content.= self::weekDaysTable();
            $content.= self::createTables($data);
        }
        else{
            $content .= HtmlTableCreator::create([['cols'=>[['value'=>'No attendance hours logged.']]]]);
        }
        return $content;
    }
    private static function weekDaysTable(){
        $rows=[['cols'=>[
            ['value'=>'Sunday'],
            ['value'=>'Monday'],
            ['value'=>'Tuesday'],
            ['value'=>'Wednesday'],
            ['value'=>'Thursday'],
            ['value'=>'Friday'],
            ['value'=>'Saturday']
        ]]];
        return HtmlTableCreator::create([],$rows);
    }
    private static function createTables($data){
        $style = 'border: 1px solid #000; text-align: center;';
        $content = '';
        foreach($data as $week){
            $rows = array_fill(0,2,['cols'=>[]]);
            foreach ($week as $dateInfo) {
                $dateCol = ['value'=>'','style'=>$style.'background-color: #F0F0F0;'];
                $timeCol = ['value'=>'','style'=>$style];
                if($dateInfo['date']){
                    $dateCol['value']=$dateInfo['date'];
                    if($dateInfo['time']){
                        $timeCol['value']=$dateInfo['time'];
                    }
                }
                $rows[0]['cols'][]=$dateCol;
                $rows[1]['cols'][]=$timeCol;
            }
            $content.=HtmlTableCreator::create($rows).HtmlTableCreator::createEmptyTable();
        }
        return $content;
    }
}
class ProgressTableCreator{
    public static function create($data){
        $content = self::studentName($data);
        if(count($data['classes'])){
            $preparedTable = self::prepareTable($data);
            $tableHeader = self::tableHeader();
            $content.= HtmlTableCreator::createEmptyTable().HtmlTableCreator::createEmptyTable();
            $content.= HtmlTableCreator::create(array(),[['cols'=>[['value'=>'Progress Report','style'=>'font-weight:bold;font-size:20px;text-align:left','attrs'=>['colspan'=>2]]]]]);
            $content.= HtmlTableCreator::create($preparedTable,$tableHeader,['th']);
        }else{
            $content .= HtmlTableCreator::create([['cols'=>[['value'=>'This student does not have any active MyEdkey courses.','attrs'=>['colspan'=>7]]]]]);
        }

        $content.= HtmlTableCreator::createEmptyTable().HtmlTableCreator::createEmptyTable();
        return $content;
    }
    public static function studentName($data){
        $studentName = $data['lname'].', '.$data['fname'];
        $content = HtmlTableCreator::create(array(),[['cols'=>[['value'=>$studentName,'style'=>'font-weight:bold;font-size:20px;text-align:left;','attrs'=>['colspan'=>7]]]]]);
        $content.= HtmlTableCreator::create(array(),[['cols'=>[
            ['value'=>'Enrollment/Withdrawal Status:','style'=>'border: 1px solid #000;font-weight:bold;font-size:20px;text-align:left;','attrs'=>['colspan'=>3]],
            ['value'=>'','style'=>'border: 1px solid #000;font-weight:bold;font-size:20px;text-align:left;','attrs'=>['colspan'=>4]]
        ]]]);
        return $content;
    }
    private static function prepareTable($data){
        $rows = array();
        $style = 'border: 1px solid #000';
        foreach($data['classes'] as $class){
            $rows[]=array('cols'=>array(
               ['value'=>$class['name'],'style'=>$style,'attrs'=>['colspan'=>2]],
               ['value'=>self::prepareGrade($class),'style'=>$style],
               ['value'=>$class['percCompletedTasks'],'style'=>$style],
               ['value'=>$class['percExpectedTasks'],'style'=>$style],
               ['value'=>$class['expectedEndDate'],'style'=>$style],
               ['value'=>$class['projectedEndDate'],'style'=>$style],
            ));
        }
        return $rows;
    }
    private static function prepareGrade($class){
        return $class['letterExpectedOrCompletedScore'].' ('.$class['percExpectedOrCompletedScore'].'%)';
    }
    private static function tableHeader(){
        $style = 'font-weight:bold; border: 1px solid #000';
        return [array('cols'=>[
           ['value'=>'Class','style'=>$style,'attrs'=>['colspan'=>2]],
           ['value'=>'Grade','style'=>$style],
           ['value'=>'Current course &#13;&#10; progress (%)','style'=>$style],
           ['value'=>'Current expected &#13;&#10; progress (%)','style'=>$style],
           ['value'=>'Expected &#13;&#10; completion date','style'=>$style],
           ['value'=>'Projected &#13;&#10; completion date','style'=>$style],
        ])];
    }
}
class HtmlTableCreator{
    private static $table;
    private static $styles;
    private static $dom;
    public static function create($rows,$headerRows=null,$styles=null){
        self::$dom = new \DOMDocument();
        self::$styles = $styles;
        self::$table = self::$dom->createElement("table");
        if($styles['table']) self::$table->setAttribute('style',$styles['table']);
        if($headerRows) self::createTablePart('thead',$headerRows,'th');
        self::createTablePart('tbody',$rows);
        self::$dom->appendChild(self::$table);
        return self::$dom->saveHTML();
    }
    private static function createTablePart($part,$rows,$colType='td'){
        $html = self::$dom->createElement($part);
        foreach($rows as $row){
            $htmlRow = self::$dom->createElement('tr');
            if($row['style']) $htmlRow->setAttribute('style',$row['style']);
            foreach($row['cols'] as $col){
                $td = self::$dom->createElement($colType);
                $td->nodeValue = $col['value'];
                if($col['style']) $td->setAttribute('style',$col['style']);
                self::setAttributes($td,$col['attrs']);
                $htmlRow->appendChild($td);
            }
            $html->appendChild($htmlRow);
        }
        self::$table->appendChild($html);
    }
    public static function createEmptyTable(){
        return self::create([]);
    }
    private static function setAttributes(\DOMElement $el,$attrs=array()){
        if($attrs){
            foreach($attrs as $name=>$value){
                $el->setAttribute($name,$value);
            }
        }

    }
}
