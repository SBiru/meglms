<?php
namespace English3\Bin\ImportBinLog;


use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ImportBinLog {
    private $binlog_imports_path;
    private $errorsFile;
    public function __construct(){
        global $PATHS;
        $this->binlog_imports_path = $PATHS->app_path.'/binlog_imports';
        $this->errorsFile = $PATHS->app_path.'/binlog_imports/errors.log';
    }

    public function import(Request $request)
    {
        Utility::clearPOSTParams($request);
        $this->checkSecret($request->request->get('secret'));
        $filesToImport = $this->checkFilesToImport();
        foreach($filesToImport as $fileInfo){
            $database = $this->getDatabaseFromFileName($fileInfo['file']);
            $error = $this->runMysqlImport($fileInfo['file'],$database);
            if($error){
                return $error;
            }
        }
        return 'ok';
    }
    private function checkSecret($secret){
        global $SECURITY;
        if(md5($SECURITY->binlogSalt,$secret) != md5($SECURITY->binlogSalt,$SECURITY->binlogSecret)){
            throw new Exception('Invalid secret');
        }
    }
    private function checkFilesToImport(){
        $currentImportStatus = $this->_getStatus();
        $files = array_merge($currentImportStatus['non_imported'],$currentImportStatus['error']);
        sort($files);
        return $files;
    }
    private function getDatabaseFromFileName($fullPath){
        $fileName = $this->fileNameFromPath($fullPath);
        return explode('-',$fileName)[0];
    }
    private function fileNameFromPath($fullPath){
        $filePath =explode('/',$fullPath);
        return $filePath[count($filePath)-1];
    }
    private function runMysqlImport($fullPathFileName,$database){
        global $DB;
        $cmd = sprintf("mysql -u%s -p%s %s < %s 2>&1",$DB->rootuser,$DB->rootpassword,$database,$fullPathFileName);
        $error = shell_exec($cmd);

        if($error && substr($error,0,7)!='Warning'){
            $errorMessage = sprintf("%s - %s - %s",date('Y-m-d H:i:s'),$this->fileNameFromPath($fullPathFileName),$error);
            file_put_contents($this->errorsFile,$errorMessage , FILE_APPEND);
            $this->rename($fullPathFileName,$fullPathFileName.'error');
            return Utility::buildHTTPError($error,500,['error'=>$error]);
        }else{
            $this->rename($fullPathFileName,$fullPathFileName.'ok');
        }
    }
    private function rename($source,$dest){
        if(copy($source,$dest)){
            unlink($source);
        }
    }
    public function getStatus(Request $request){

        return new JsonResponse($this->_getStatus());
    }
    private function _getStatus(){
        $files = glob($this->binlog_imports_path.'/*.sql*');
        $fileStatus = array(
            'success'=>array(),
            'error'=>array(),
            'non_imported'=>array()
        );
        foreach($files as $file){
            $modifiedOn = date('Y-m-d H:i:s',filemtime($file));
            if($this->endsWith($file,'ok')){$fileStatus['success'][]=['file'=>$file,'modified_on'=>$modifiedOn];}
            else if($this->endsWith($file,'error')){$fileStatus['error'][]=['file'=>$file,'modified_on'=>$modifiedOn];}
            else{$fileStatus['non_imported'][]=['file'=>$file,'modified_on'=>$modifiedOn];}
        }
        return $fileStatus;
    }
    private function endsWith($haystack, $needle)
    {
        $length = strlen($needle);
        if ($length == 0) {
            return true;
        }

        return (substr($haystack, -$length) === $needle);
    }

}