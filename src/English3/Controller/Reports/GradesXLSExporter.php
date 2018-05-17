<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.23.11
 * Time: 13:08
 */

namespace English3\Controller\Reports;
require_once $_SERVER['DOCUMENT_ROOT'].'/vendor/phpoffice/phpexcel/Classes/PHPExcel.php';
use English3\Controller\Utility;
use English3\Util\E3Excel\XLSCreator;

use English3\Util\E3Excel\XLSTest;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class GradesXLSExporter {
    public function get(Request $request){
        Utility::clearPOSTParams($request);
        $csvCreator = new GradebookGradesStyleExporter($request);
        $csvCreator->createCsv();
        ob_get_clean();
        $xlsCreator = new XLSCreator();
        $xlsCreator->setContent($csvCreator->getAsTable());
        $xlsCreator->setAutoSize(['C','D','E','F']);
        $xlsCreator->objPHPExcel->getActiveSheet()->getColumnDimension('A')->setWidth('20');
        $this->mergeProgressReport($xlsCreator);
        $filename = $request->request->get('className').'_'.$request->request->get('studentName').'_grades_'.date('Ymdhis').'.xls';

        return $xlsCreator->buildFileResponse($filename);

    }
    private function mergeProgressReport(XLSCreator $xlsCreator){
        $aSheet = $xlsCreator->objPHPExcel->getActiveSheet();
        $startRow = 4;
        $endRow=11;
        $colNum=3;
        while($startRow<=$endRow){
            $aSheet->mergeCellsByColumnAndRow(0,$startRow,$colNum,$startRow);
            $startRow++;
        }

    }
}