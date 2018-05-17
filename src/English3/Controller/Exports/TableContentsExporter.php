<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/28/17
 * Time: 6:19 PM
 */

namespace English3\Controller\Exports;


use Dompdf\Dompdf;
use English3\Controller\CSVExporter;
use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class TableContentsExporter {

    public function writeFile(Request $request){
        Utility::clearPOSTParams($request);

        $courseData = $request->request->get('courseData');
        $header = $this->prepareHeader();
        $rows = array_merge([[$request->request->get('courseName')],["","Due date","Score"]],$this->prepareRows($courseData));
        $csv = new CSVExporter();

        return new JsonResponse(['content'=>$csv->exportFromDBStyle($header,$rows)]);
    }
    private function prepareHeader(){
        return [];
    }
    private function prepareRows($courseData){
        $rows = [];
        foreach ($courseData['units'] as $unit){
            $rows = array_merge($rows,$this->prepareUnitRows($unit)) ;
        }
        return $rows;
    }
    private function prepareUnitRows($unit){
        $rows = [];
        $rows[] = ['Unit '. $unit['name'] . ' - ' . $unit['description']];
        foreach ($unit['pages'] as $page){
            $rows[] = $this->preparePageRow($page);
        }
        $rows[]=[];
        return $rows;
    }
    private function preparePageRow($page){
        $row = [];
        $prefix = '- ';
        if($page['layout'] === 'header'){
            $prefix = '+ ';
        }
        if($page['header_id'] != 0){
            $prefix = '    '.$prefix;
        }
        $row [] = $prefix.$page['label'];
        $row [] = $this->prepareDueDate($page);
        $row [] = $this->prepareScore($page);
        return $row;
    }
    Private function prepareDueDate($page){
        return isset($page['_dueDate'])?$page['_dueDate']:"";
    }
    Private function prepareScore($page){
        return isset($page['_score'])?$page['_score']:"";
    }
}