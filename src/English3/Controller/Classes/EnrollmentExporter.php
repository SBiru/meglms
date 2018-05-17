<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.4.4
 * Time: 21:50
 */

namespace English3\Controller\Classes;


use English3\Controller\CSVExporter;
use English3\Controller\CSVField;
use English3\Controller\CSVFieldType;
use English3\Controller\CSVRow;
use English3\Controller\Utility;
use Phinx\Migration\Util;

class EnrollmentExporter {

    private $csvExporter;
    public function __construct(CSVExporter $csvExporter){
        $this->csvExporter = $csvExporter;
    }
    public function export($classId){
        $data = $this->getClassData($classId);
        return $this->prepareDataToFormat($data,'csv');
    }
    private function getClassData($classId){
        return Utility::getInstance()->fetch($this->queryGetClassData,['classId'=>$classId]);
    }
    private function prepareDataToFormat($data,$format){
        switch($format){
            case 'csv':
                return $this->prepareDataToCsv($data);
        }
    }
    private function prepareDataToCsv($data){
        $this->buildCsvHeader();
        foreach($data as $row){
            $this->buildCsvRow($row);
        }
        return $this->csvExporter->writeCSV();
    }
    private function buildCsvHeader(){
        $header = new CSVRow([],
            [
                new CSVField(CSVFieldType::STATIC_TYPE,'Name'),
                new CSVField(CSVFieldType::STATIC_TYPE,'Email'),
                new CSVField(CSVFieldType::STATIC_TYPE,'Phone'),
                new CSVField(CSVFieldType::STATIC_TYPE,'Address'),
                new CSVField(CSVFieldType::STATIC_TYPE,'City'),
                new CSVField(CSVFieldType::STATIC_TYPE,'State')
            ]
        );
        $this->csvExporter->addRow($header);
    }
    private function buildCsvRow($row){
        $csvRow = new CSVRow($row,
            [
                new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['name'];}),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['email'];}),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['phone'];}),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['address'];}),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['city'];}),
                new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['state'];})
            ]
        );
        $this->csvExporter->addRow($csvRow);
    }
    private $queryGetClassData = <<<SQL
    SELECT uc.*,
          concat(u.lname,', ', u.fname) as name,
          u.email,
          u.phone,
          u.address,
          u.city,
          u.state
      FROM user_classes uc
      JOIN users u on u.id = uc.userid
      WHERE uc.classid = :classId
SQL;

}