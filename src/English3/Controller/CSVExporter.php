<?php

namespace English3\Controller;

use Exception;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;


class CSVExporter {
    private $rows;
    public function __construct(array $rows = null){
        if($rows)
            $this->rows=$rows;
    }
    public function exportFromDBStyle($headers,$rows){
        $this->addRow(new CSVRow($headers,[],true));
        foreach($rows as $row){
            $this->addRow(new CSVRow($row,[],true));
        }
        return $this->writeCSV();
    }
    public function addRow(CSVRow $row){
        $this->rows[]=$row;
    }
    public function writeCSV(){
        $content = '';
        foreach($this->rows as $row){
            $content.=$row->writeRow();
        }
        return $content;
    }
    public function getAsTable(){
        return array_map(function(CSVRow $row){
            return $row->getRowData();
        },$this->rows);
    }
}
class CSVRow{
    private $rowData;
    private $fields;

    public function __construct($rowData,array $fields = null,$simple=false){
        $this->rowData = $rowData;
        if($fields){
            $this->setFields($fields);
        }
        if($simple){
            $this->fields = [];
            foreach($rowData as $field){
                $this->fields[] = new CSVField(CSVFieldType::STATIC_TYPE,$field);
            }
        }
    }
    public function setFields(array $fields){

        $this->fields = $fields;
    }
    public function writeRow(){
        $row = [];
        if($this->fields){
            foreach($this->fields as $field){
                $row[]='"' . $field->getContent($this->rowData) . '"';
            }
        }

        $row = implode(',',$row);
        $row.= "\r\n";
        return $row;
    }
    public function getRowData(){
        if(!$this->fields){
            $this->fields=[];
        }
        return array_map(function(CSVField $col){
            return [
                'value'=>$col->getContent($this->rowData),
                'style'=>$col->getStyle()
            ];
        },$this->fields);
    }


}
class CSVField{
    private $type;
    private $content;
    private $style=array();
    public function __construct($type,$content,$style=array()){
        $this->checkType($type,$content);
        $this->type=$type;
        $this->content = $content;
        $this->style = $style;

    }
    public function getContent($rowData=null){
        if($this->type==CSVFieldType::DYNAMIC_TYPE){
            if(!$rowData){
                throw new Exception("rowData must be an array");
            }
            if(is_callable($this->content)){
                $dynamicContent = $this->content;
                return $dynamicContent($rowData);
            }else{
                return $rowData[$this->content];
            }
        }else if($this->type==CSVFieldType::STATIC_TYPE){
            return $this->content;
        }
    }
    public function getStyle(){
        return $this->style;
    }


    private function checkType($type,$content){
        if($type==CSVFieldType::DYNAMIC_TYPE){
            if(!is_callable($content) && gettype($content)!=='string'){
                throw new Exception("content must be a function or a string");
            }
        }
    }
}
abstract class CSVFieldType{
    const STATIC_TYPE = 0;
    const DYNAMIC_TYPE = 1;
}