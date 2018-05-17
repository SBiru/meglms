<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 3/28/17
 * Time: 5:28 PM
 */

namespace English3\Controller\Exports;


use English3\Controller\Utility;
use phpseclib\Net\SFTP;
class FTPExporter {
    private $host;
    private $port;
    private $user;
    private $pwd;
    public function __construct($host,$port,$user,$pwd){
        $this->host = $host;
        $this->port = $port;
        $this->user = $user;
        $this->pwd = $pwd;
    }
    public static function __fromOrgExporter($orgId,$exportType){
        $orgExporter = new OrgExporter($orgId,$exportType);
        if(!$orgExporter->error){
            return new self($orgExporter->getHost(),$orgExporter->getPort(),$orgExporter->getUser(),$orgExporter->getPwd());
        }
        return false;
    }
    public function uploadFile($filePath,$remoteFileName,$removeAfterUpload=false){
        $sftp = new SFTP($this->host);

        if(!$sftp->login($this->user,$this->pwd)){
            $this->couldNotConnect();
        }
        if(!$sftp->put($remoteFileName,$filePath,SFTP::SOURCE_LOCAL_FILE)){
            $this->couldNotUpload($remoteFileName);
        }
        if($removeAfterUpload){
            unlink($filePath);
        }
        Logger::log("Exported ".$remoteFileName);
    }

    private function couldNotConnect(){
        Logger::error("Could not connect to ftp server.");
    }
    private function couldNotUpload($remoteFileName){
        Logger::error(sprintf("Could not upload %s to ftp server.",$remoteFileName));
    }

}
class OrgExporter{
    private $host;
    private $port;
    private $user;
    private $pwd;
    public $error = false;
    public function __construct($orgId,$exportType){
        $data = $this->getData($orgId,$exportType);
        $this->prepareData($data);
    }
    private function getData($orgId,$exportType){
        $query = str_replace('__exporttype__',$exportType,$this->queryGetFtpConfig);
        return Utility::getInstance()->fetch($query,['orgId'=>$orgId]);
    }
    private function prepareData($data){
        foreach($data as $row){
            $key = $row['prop'];
            $value = $row['value'];
            if($key=='pwd'){$this->pwd = $value;}
            if($key=='username'){$this->user = $value;}
            if($key=='host'){$this->host = $value;}
            if($key=='port'){$this->port = $value;}
        }
    }
    /**
     * @return mixed
     */
    public function getHost()
    {
        return $this->host;
    }

    /**
     * @return mixed
     */
    public function getPort()
    {
        return $this->port;
    }

    /**
     * @return mixed
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * @return mixed
     */
    public function getPwd()
    {
        return $this->pwd;
    }

    private $queryGetFtpConfig = <<<SQL
    select replace(preference,"__exporttype___ftp_",'') as prop,value from organization_preferences where org_id = :orgId and preference like "__exporttype___ftp%";
SQL;

}