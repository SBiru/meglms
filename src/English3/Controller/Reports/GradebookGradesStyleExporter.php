<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.23.11
 * Time: 13:09
 */

namespace English3\Controller\Reports;


use English3\Controller\CSVExporter;
use English3\Controller\CSVField;
use English3\Controller\CSVFieldType;
use English3\Controller\CSVRow;
use English3\Controller\GradebookController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\Request;

class GradebookGradesStyleExporter {
    private $request;
    private $csv;
    private $csvExporter;
    public function __construct(Request $request){
        $this->request = $request;
        $this->csvExporter = new CSVExporter();
        $this->csv = '';
    }
    public function getAsTable(){
        return $this->csvExporter->getAsTable();
    }
    public function createCsv(){
        $data = $this->request->get('data');
        $gbController = new GradebookController();
        $gradebook = $gbController->_getGradebookForUser($this->request->get('studentId'),$this->request->get('classId'));
        $data = array_merge(array_shift($gradebook['classes']),$data);
        $this->buildClassAndStudentInfo($this->request->get('studentName'),$this->request->get('className'),$this->request->get('studentId'));
        $this->buildProgressSummary($data);
        $this->buildUnits($data['units']);

        return $this->csvExporter->writeCSV();

    }
    private function buildClassAndStudentInfo($studentName,$className,$studentId){
        $classRow = new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,$className,['font'=>['bold'=>true]])]);
        $studentRow = new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,$studentName,['font'=>['bold'=>true]])]);
        $this->csvExporter->addRow($classRow);
        $this->csvExporter->addRow($studentRow);
        $this->addStudentEmailIfNecessary($studentId);
        $this->addEmptyRow();
    }
    private function addStudentEmailIfNecessary($studentId){
        list ($email,$org) = $this->getStudentEmailAndOrg($studentId);
        if($org!=10){//hard code excluding edkey
            $this->csvExporter->addRow(new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,$email)]));
        }
    }
    private function getStudentEmailAndOrg($studentId){
        $data =Utility::getInstance()->fetchRow('SELECT organizationid,email FROM users WHERE id = :id',['id'=>$studentId]);
        return [$data['email'],$data['organizationid']];
    }
    private function buildProgressSummary($data){
        $this->csvExporter->addRow($this->totalTimeSpentRow($data));
        $this->csvExporter->addRow($this->enrollmentDateRow($data));
        $this->csvExporter->addRow($this->currentGradeRow($data));
        $this->csvExporter->addRow($this->gradeCompletedWorkRow($data));
        $this->csvExporter->addRow($this->expectedByTodayRow($data));
        $this->csvExporter->addRow($this->completedSoFarRow($data));
        $this->csvExporter->addRow($this->expectedEndDateRow($data));
        $this->csvExporter->addRow($this->projectedEndDateRow($data));
        $this->addEmptyRow();
    }
    private function totalTimeSpentRow($data){
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,sprintf("Total time spent: %s",$data['totalTimeSpent']))]);
    }
    private function enrollmentDateRow($data){
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,sprintf("Enrollment date: %s",$data['enrollmentDate']))]);
    }
    private function currentGradeRow($data){
        $currentGrade = $data['percExpectedOrCompletedScore'].'%'.sprintf(" %s %s out of %s",$data['letterExpectedOrCompletedScore'],$data['totalScore'],$data['totalExpectedOrCompletedScore']);
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,sprintf("Current grade: %s",$currentGrade))]);
    }
    private function gradeCompletedWorkRow($data){
        $currentGrade = $data['percCompletedScore'].'%'.sprintf(" %s %s out of %s",$data['letterCompletedScore'],$data['totalScore'],$data['totalWorkedScore']);
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,sprintf("Grade on completed work: %s",$currentGrade))]);
    }
    private function expectedByTodayRow($data){
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,"Expected by today: ".$data['percExpectedTasks']."% of the assignments")]);
    }
    private function completedSoFarRow($data){
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,"Completed so far: ".$data['percCompletedTasks']."% of the assignments")]);
    }
    private function expectedEndDateRow($data){
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,sprintf("Expected end date: %s",$data['expectedEndDate']))]);
    }
    private function projectedEndDateRow($data){
        return new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,sprintf("Projected end date: %s",$data['projectedEndDate']))]);
    }
    private function buildUnits($units){
        foreach($units as $unit){
            $this->buildUnitTable($unit);
        }
        return $this->csvExporter->writeCSV();
    }
    private function buildUnitTable($unit){
        $this->addUnitHeader($unit);
        $this->addTableHeader();
        foreach($unit['pagegroups'] as $pagegroup){
            foreach($pagegroup['pages'] as $page){
                $this->addPageRow($page);
            }
        }
        $this->addEmptyRow();

    }
    private function addUnitHeader($unit){
        $header = new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,$unit['description'],[
            'font'=>[
                'size'=>13,
                'bold'=>true
            ]
        ])]);
        $this->csvExporter->addRow($header);
    }
    private function addTableHeader(){
        $style = [
            'font'=>[
                'bold'=>true
            ],
            'borders'=>[
                'bottom'=>[
                    'style'=>true
                ]
            ],
            'alignment'=>[
                'vertical'=>'top'
            ]
        ];
        $header = new CSVRow([],[
            new CSVField(CSVFieldType::STATIC_TYPE,'Activity',$style),
            new CSVField(CSVFieldType::STATIC_TYPE,'Score',$style),
            new CSVField(CSVFieldType::STATIC_TYPE,'Max Score',$style),
            new CSVField(CSVFieldType::STATIC_TYPE,'Due date',$style),
            new CSVField(CSVFieldType::STATIC_TYPE,'Completed on',$style),
            new CSVField(CSVFieldType::STATIC_TYPE,'Teacher feedback',$style),
        ]);
        $this->csvExporter->addRow($header);
    }
    private function addPageRow($page){
        $row = new CSVRow($page,[
                new CSVField(CSVFieldType::DYNAMIC_TYPE,'name',['alignment'=>['wrap'=>true]]),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,'score'),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,'maxScore'),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,'due_date'),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,'submittedOn'),
                new CSVField(CSVFieldType::STATIC_TYPE,$this->getTeacherFeedback($page)),
            ]
        );
        $this->csvExporter->addRow($row);

    }
    private function getTeacherFeedback($page){
        global $PATHS;
        if($page['postFeedbackId']){
            include_once($PATHS->app_path .'/lib/simple_html_dom.php');
            $htmlMessage = Utility::getInstance()->fetchOne('SELECT message from grade_posts gp join posts p on p.id = gp.teacher_post_id where gp.id=:id',['id'=>$page['postFeedbackId']]);
            $html = str_get_html($htmlMessage);
            return @$html->plaintext;
        }
        return '';
    }
    private function addEmptyRow(){
        $row = new CSVRow([],[]);
        $this->csvExporter->addRow($row);
    }

}