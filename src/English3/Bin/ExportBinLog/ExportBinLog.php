<?php
namespace English3\Bin\ExportBinLog;

use Exception;
use PDO;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class ExportBinLog {
    private $db;
    private $binlog_exports_path;
    private $binlog_imports_path;
    private $externalServerUrl;
    private $externalHost;
    private $options;
    private $rsync;
    public function __construct($externalServerUrl = null,$externalHost = null,$externalServerKey=null,$options=array()){
        global $PATHS;
        $this->configDB();
        $this->configRSync($externalHost,$externalServerKey);
        $this->binlog_exports_path = $PATHS->app_path.'/binlog_exports';
        $this->binlog_imports_path = $PATHS->app_path.'/binlog_imports';
        $this->externalServerUrl = $externalServerUrl;
        $this->externalHost = $externalHost;
        $this->options= $options;

    }
    private function configDB(){
        $this->db = new DBWrapper();
    }
    private function configRSync($externalServerUrl,$externalServerKey){
        $this->rsync = new RSyncHandler('ec2-user',$externalServerUrl,$externalServerKey);
    }
    public function exportAllSinceLastSync(){
        $lastExportedStatus = $this->lastExportedStatus();
        $dumpFilename = $this->createDumpFile($lastExportedStatus);
        $this->uploadToOtherServer($dumpFilename,$lastExportedStatus['database']);
    }
    
    private function currentMasterStatus(){
        $status = $this->db->fetch_row('SHOW MASTER STATUS');
        $serverId = $this->db->fetch_row('SELECT serverId() as id')['id'];
        return ['file'=>explode('.',$status['File'])[1],'position'=>$status['Position'],'database'=>$status['Binlog_Do_DB'],'serverId'=>$serverId];
    }
    private function lastExportedStatus(){
        GLOBAL $PATHS;
        $files = scandir($this->binlog_exports_path,SCANDIR_SORT_DESCENDING);
        if(!count($files)){
            return false;
        }

        return $this->statusFromFilename($files[0]);
    }
    private function statusFromFilename($filename){
        $this->printDebugMessage("Last file ".$filename.PHP_EOL);
        $filename = explode('.',$filename)[0];
        $statusParts = explode('-',$filename);
        $status = ['database'=>$statusParts[0],'file'=>'mysql-bin.'.$statusParts[1],'position'=>$statusParts[2],'serverId'=>$statusParts[3]];
        $this->printDebugMessage("Status from last file",$status);
        return $status;
    }
    private function createDumpFile($lastExportedStatus){
        $filesToBeExported = $this->allBinLogsSinceLastSync($lastExportedStatus);
        $this->printDebugMessage("Files to be exported: ",$filesToBeExported);
        list($cmd,$newFileName) = $this->shellExecCommands($lastExportedStatus,$filesToBeExported);
        $this->printDebugMessage("Mysql command: ".$cmd.PHP_EOL);
        shell_exec($cmd);
        $this->printDebugMessage("New file name: ". $newFileName.PHP_EOL);
        $this->changeFileOwner($newFileName);
        return $newFileName;
    }
    private function changeFileOwner($newFileName){
        shell_exec("chown ec2-user:ec2-user ".$newFileName);
    }
    private function allBinLogsSinceLastSync($lastExportedStatus){
        GLOBAL $PATHS;
        $files = glob($PATHS->binlog.'/mysql-bin.[0-9]*');
        $filtered = array_filter($files,function($file) use($lastExportedStatus){
            $binLogFile = intval(explode('.',$file)[1]);
            return $binLogFile >= intval(explode('.',$lastExportedStatus['file'])[1]);
        });
        $resp = array();
        foreach ( $filtered as $file) {
            $resp[]=$file;
        }
        return $resp;
    }
    private function shellExecCommands($lastExportedStatus,$filesToBeExported){
        global $DB;
        shell_exec(sprintf('mysql -u%s -p%s -e "FLUSH TABLES WITH READ LOCK"',$DB->rootuser,$DB->rootpassword));
        $currentMasterStatus = $this->currentMasterStatus();
        $newFileName = sprintf('%s/%s-%s-%s-%s.sql',$this->binlog_exports_path,$currentMasterStatus['database'],$currentMasterStatus['file'],$currentMasterStatus['position'],$currentMasterStatus['serverId']);
        $cmd = sprintf('mysqlbinlog --start-position=%s %s > %s',$lastExportedStatus['position'],$filesToBeExported[0],$newFileName);
        array_shift($filesToBeExported);
        if(count($filesToBeExported)>0){
            foreach($filesToBeExported as $file)
            $cmd .= sprintf("; mysqlbinlog %s >> %s",$file,$newFileName);
        }
        $cmd.= sprintf('; mysql -u%s -p%s -e "UNLOCK TABLES"',$DB->rootuser,$DB->rootpassword);
        return [$cmd,$newFileName];
    }

    private function uploadToOtherServer($dumpFilename,$database){
        $this->printDebugMessage("Start sending file to ".$this->externalServerUrl." ...".PHP_EOL);
        $this->rsync->run($dumpFilename,$this->binlog_imports_path);
        $this->printDebugMessage("Finished sending file to ".$this->externalServerUrl." ...".PHP_EOL);
        $this->printDebugMessage("Requesting server to import the dump".PHP_EOL);
        $res = CurlHandler::post($this->externalServerUrl.'/api/import/binlog');
        $this->printDebugMessage("Server response after importing: ", $res);
        rename($dumpFilename,$dumpFilename.($res=='ok'?'ok':'error'));
    }

    public function getStatus(Request $request){
        $files = glob($this->binlog_exports_path.'/*.sql*');
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
        return new JsonResponse($fileStatus);
    }
    private function endsWith($haystack, $needle)
    {
        $length = strlen($needle);
        if ($length == 0) {
            return true;
        }

        return (substr($haystack, -$length) === $needle);
    }
    private function printDebugMessage($message,$print_r_variable=null){
        if($this->options['debugModeOn']){
            echo $message;
            if($print_r_variable){
                print_r($print_r_variable);
            }
        }
    }
}
class CurlHandler{
    public static function sendFile($url,$fileName,$database){
        global $SECURITY;
        $request = curl_init($url);

        curl_setopt($request, CURLOPT_POST, true);
        curl_setopt(
            $request,
            CURLOPT_POSTFIELDS,
            array(
                'binlog' => '@' . $fileName,
                'database'=>$database,
                'secret'=>$SECURITY->binlogSecret
            ));

        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        return self::sendRequest($request);
    }
    public static function post($url){
        global $SECURITY;
        $request = curl_init($url);
        curl_setopt($request, CURLOPT_POST, true);
        curl_setopt(
            $request,
            CURLOPT_POSTFIELDS,
            array(
                'secret'=>$SECURITY->binlogSecret
            ));
        curl_setopt($request, CURLOPT_RETURNTRANSFER, true);
        return self::sendRequest($request);
    }
    private static function sendRequest($request){
        $response = curl_exec($request);
        curl_close($request);
        try{
            $jsonResponse = json_decode($response);
            return $response=='ok'?'ok':($jsonResponse?:$response);
        }catch(\Symfony\Component\Config\Definition\Exception\Exception $e){
            return $response;
        }
    }
}
class RSyncHandler{
    private $excludePaths;
    private $flag;
    private $remoteUser;
    private $remoteHost;
    private $externalServerKey;
    public function __construct($remoteUser = '',$remoteHost='',$externalServerKey = '',$excludePaths = array()){
        $this->externalServerKey = $externalServerKey;
        $this->excludePaths = $excludePaths;
        $this->remoteHost = $remoteHost;
        $this->remoteUser = $remoteUser;
    }
    public function run($source,$dest){
        $cmd = $this->shell_command($source,$dest);
        echo "Trying to run ".$cmd.PHP_EOL;
        passthru($cmd);
    }
    private function shell_command($source,$dest){
        global $PATHS;
        $excludePathsOption = $this->excludePathsOption();
        $dest = $PATHS->local_only?$dest:$this->remoteUser.'@'.$this->remoteHost.':'.$dest;

        return sprintf('rsync -rltgoDvzc -e "ssh -i %s -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" --progress  %s %s %s',
            $this->externalServerKey,$excludePathsOption,$source,$dest);
    }
    private function excludePathsOption(){
        $option = '';
        foreach($this->excludePaths as $pattern){
            $option.=sprintf(" --exclude='%s'",$pattern);
        }
        return $option;
    }
}
class DBWrapper {
    private $db;
    public function __construct(){
        global $DB;
        $dsn = "mysql:host=$DB->host;dbname=$DB->database;charset=utf8";
        $pdo = new PDO($dsn, $DB->rootuser, $DB->rootpassword);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db = $pdo;
    }
    public function query($query) {
        $result = $this->queryResult($query);
        return $result->fetchAll(PDO::FETCH_ASSOC);
    }
    private function queryResult($query){
        $result = $this->db->query($query);

        if (!$result) {
            throw new Exception("Qatabase query failed with error: " . $this->db->error . ".\n\nQuery: " .$query);
        }
        return $result;
    }
    public function query_no_result($query){
        $this->db->query($query);
        if ($this->db->errno!==0) {
            throw new Exception("Qatabase query failed with error: " . $this->db->error . ".\n\nQuery: " .$query);
        }
        return true;
    }
    public function fetch_row($query) {
        $result = $this->queryResult($query);
        return $result->fetch(PDO::FETCH_ASSOC);
    }

}



?>

