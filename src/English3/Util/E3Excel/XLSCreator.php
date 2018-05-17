<?php
namespace English3\Util\E3Excel;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
require_once $_SERVER['DOCUMENT_ROOT'].'/vendor/phpoffice/phpexcel/Classes/PHPExcel.php';
class XLSCreator {
    public $objPHPExcel;
    public function __construct(){
        $this->objPHPExcel = new \PHPExcel();
        $this->objPHPExcel->getProperties()->setCreator("English3");
    }
    public function setContent($table){
        $this->objPHPExcel->setActiveSheetIndex(0);
        foreach($table as $i=>$row){
            foreach($row as $j=>$col){
                $this->setCellValueAndStyle(
                    $j,$i+1,$col['value'],@$col['style']
                );
            }
        }
        $this->objPHPExcel->getActiveSheet()->calculateColumnWidths();
    }
    private function setCellValueAndStyle($col,$row,$value,$style=array()){
        $cell = $this->objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow(
            $col,$row,$value,true
        );
        if($style) $cell->getStyle()->applyFromArray($style);
    }
    public function setAutoSize($colIndexes){
        $activeSheet = $this->objPHPExcel->getActiveSheet();
        foreach ($colIndexes as $idx) {
            $activeSheet->getColumnDimension($idx)->setAutoSize(true);
        }
        $activeSheet->calculateColumnWidths();
    }
    public function getObjWriter(){
        return \PHPExcel_IOFactory::createWriter($this->objPHPExcel, 'Excel5');
    }
    public function buildFileResponse($filename){
        $headers = array(
            'Content-Description'=>'File Transfer',
            'Content-Type'=>'application/vnd.ms-excel',
#            'Content-Disposition'=> 'attachment, filename=S3S.cfg',
            'Cache-Control'=> 'must-revalidate, post-check=0, pre-check=0',
            'Expires'=> '0',
            'Pragma'=> 'public',
        );

        $this->getObjWriter()->save($_SERVER['DOCUMENT_ROOT'].'/exports/output.xls');
        $response = new BinaryFileResponse($_SERVER['DOCUMENT_ROOT'].'/exports/output.xls',200,$headers);
        $d = $response->headers->makeDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $filename
        );
        $response->headers->set('Content-Disposition', $d);
        return $response;
    }

}