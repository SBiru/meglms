<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/28/17
 * Time: 3:53 PM
 */

namespace English3\Controller\Exports;
global $PATHS;


use English3\Controller\CSVExporter;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

abstract class ExporterBase {
    public function download(Request $request){
        if(boolval($request->get('forceDownload')) && $classId = $request->get('classid')){
            return $this->downloadCorruptedEntries($classId,'sectionid');
        }
        if(boolval($request->get('forceDownload')) && $studentId = $request->get('studentid')){
            return $this->downloadCorruptedEntries($studentId,'studentid_number');
        }
        $filename = $request->get('filename');
        $this->checkAdminRights($filename);
        return Utility::buildFileResponse($this->createFileFromFilename($filename),$filename.'.csv');
    }
    protected function downloadCorruptedEntries($id,$type=null){return new Response();}
    protected function checkAdminRights($filename){
        $orgId = Utility::getInstance()->fetchOne($this->queryGetOrgFromFilename,['filename'=>$filename]);
        Utility::getInstance()->checkAdmin($orgId);
    }
    protected function createFileFromFilename($filename){
        $entries = Utility::getInstance()->fetch($this->queryGetFilenameEntries,['filename'=>$filename]);
        return $this->createFileFromEntries($entries);
    }
    protected function createNewExportFile($orgId){
        $entries = Utility::getInstance()->fetch($this->queryGetNewEntries ,['orgId'=>$orgId] );
        return $this->createFileFromEntries($entries);
    }
    protected function createFileFromEntries($entries){
        $csv = new CSVExporter();
        return $csv->exportFromDBStyle($this->exportHeader(),$entries);
    }
    protected abstract function exportHeader();
    public function history(Request $request,$orgId){
        Utility::getInstance()->checkAdmin($orgId);
        return new JsonResponse(Utility::getInstance()->fetch($this->queryGetHistory,['orgId'=>$orgId]));
    }
    public function pending(Request $request,$orgId){
        Utility::getInstance()->checkAdmin($orgId);
        $pending = intval(Utility::getInstance()->fetchOne($this->queryGetPending,['orgId'=>$orgId]));
        $corrupted = $this->getCorruptedEntries($orgId);
        return new JsonResponse(['pending'=>$pending,'corrupted'=>$corrupted->toObject()]);
    }

    /**
     * @return CorruptedEntries
     */
    protected function getCorruptedEntries($orgId){return new CorruptedEntries();}

    public function export(Request $request,$orgId){
        Utility::getInstance()->checkAdmin($orgId);
        $this->orgId = $orgId;
        $fileContent = $this->createNewExportFile($orgId);
        $fileName = $this->createFileName();
        $this->uploadFile($fileContent,$fileName.'.csv');
        Utility::getInstance()->execute($this->queryMarkEntriesAsExported,['filename'=>$fileName]);
        return new JsonResponse('ok');
    }
    private function uploadFile($content,$fileName){
        $tmpFile = new TMPFile($content,$fileName);
        $ftpExporter = FTPExporter::__fromOrgExporter($this->orgId,$this->exportType);
        $ftpExporter->uploadFile($tmpFile->fileName,$fileName);
    }

    protected  abstract function createFileName();

    protected $orgId;
    protected $exportType;
    protected $queryGetHistory;
    protected $queryGetPending;
    protected $queryGetOrgFromFilename;
    protected $queryGetFilenameEntries;
    protected $queryGetNewEntries;
    protected $queryMarkEntriesAsExported;
}
Class CorruptedEntries {
    private $object = [];
    public function toObject(){
        return $this->object;
    }
    public function addReason($reasonId,$reasonDescription,$entries,$details = null){
        $this->object[$reasonId]=[
            'reason'=>$reasonDescription,
            'entries'=>$entries,
            'details'=>$details
        ];
    }
}