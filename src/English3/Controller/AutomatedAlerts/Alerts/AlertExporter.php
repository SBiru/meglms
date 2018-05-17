<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.1.7
 * Time: 05:35
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\CSVExporter;
use English3\Controller\CSVField;
use English3\Controller\CSVFieldType;
use English3\Controller\CSVRow;

class AlertExporter{
    private $alert;
    private $exporter;
    public function __construct(Alert $alert){
        $this->alert = $alert;
        $this->exporter = new CSVExporter();
    }
    public function prepareDataToDownload($data){
        if($this->alert->useOuterTable()){
            $this->writeOuterTable($data);
        }else{
            $this->writeInnerTable($data);
        }
        return $this->exporter->writeCSV();
    }
    private function writeOuterTable($data){
        foreach($data as $table){
            $this->writeOuterTableHeader($table);
            $this->writeInnerTable($table[$this->alert->outerTableInfo()['dataField']]);
        }
    }
    private function writeOuterTableHeader($table){
        $outerTableInfo = $this->alert->outerTableInfo();
        $title = $table[$outerTableInfo['nameField']];
        $this->exporter->addRow(new CSVRow([],[new CSVField(CSVFieldType::STATIC_TYPE,$title)]));
    }
    private function writeInnerTable($data){
        $this->writeInnerTableHeader();
        $this->writeInnerTableBody($data);
        $this->addEmptyRow();
    }
    private function writeInnerTableHeader(){
        $fields = array();
        foreach ($this->alert->innerTableInfo() as $column) {
            $fields[]= new CSVField(CSVFieldType::STATIC_TYPE,$column['label']);
        }
        $this->exporter->addRow(new CSVRow([],$fields));
    }
    private function writeInnerTableBody($data){
        foreach($data as $row){
            $fields = array();
            foreach ($this->alert->innerTableInfo() as $column) {
                $fields[]= new CSVField(CSVFieldType::DYNAMIC_TYPE,$column['id']);
            }
            $this->exporter->addRow(new CSVRow($row,$fields));
        }
    }
    private function addEmptyRow(){
        $this->exporter->addRow(new CSVRow([]));
    }
}