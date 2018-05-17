<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 9/8/17
 * Time: 12:46 PM
 */

namespace English3\Controller\ProficiencyTest\Exporter;


use English3\Controller\ProficiencyTest\StudentTest;

class CsvExporter
{
    /**
     * @var CSVTestExporter;
     */
    public $exporter;
    public function exportClass($id,$data){
        $this->exporter = new CSVTestExporter($id,$data);
        return $this->exporter->createFile();
    }
}
class CSVTestExporter{
    public $content;
    public $fileName;
    public function __construct($classId,$data=null,$headers = null){
        if($headers !== null) $this->headers = $headers;
        $this->data = $data?:$this->loadDataFromDB();
        $this->classId = $classId;
        $this->fileName = $data['className']."_".$data['studentCount'] . '_' . date('YmdHis').'.csv';
    }
    public function createFile(){
        $csv = new \English3\Controller\CSVExporter();
        $this->prepareTeacherComments();
        return $csv->exportFromDBStyle($this->headers,$this->data['students']);
    }
    private function loadDataFromDB(){
        return [];
        //to do
    }
    private function prepareTeacherComments(){
        $studentTest = new StudentTest(0,0);
        foreach ($this->data['students'] as &$row){
            $commentSections = $studentTest->getAdditionalComments($this->classId,$row[0]);
            $comments = '';
            foreach ($commentSections as $section){
                $comments.= $section['comments'];
            }
            unset($row[0]);
            $row[]=$comments;
        }
    }

    private $classId;
    private $data;
    private $headers = ['Applicant','Date','Score','Email','Teacher Comments'];

}