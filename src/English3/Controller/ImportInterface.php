<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\Request;
/**
 * ImportInterface short summary.
 *
 * ImportInterface description.
 *
 * @version 1.0
 * @author Gilbert Mena github.com/hibrid
 */
abstract class ImportInterface
{
    
    protected $reader;
	protected $util;
	protected $errors;
    protected $import_path;
    protected $me;
    protected $requiredFiles;
    protected $importTemplate;
    protected $uniqueIdentifier;
    protected $type;
    protected $jobRegistered = false;
    protected $processID;
    protected $orgId;
    
    public function __construct(Connection $reader){
        global $PATHS;
        $this->setProcessID();
        $this->me = UserController::me($reader);
		$this->util = new Utility($reader);
        $this->imports_path = $PATHS->app_path . '/imported'; // e.g. /var/www/imported
        $this->errors = array();
		$this->reader = $reader;
        $this->setRequiredFiles();
        $this->generateUniqueName();
        $this->setType();
        
    }
    
    protected final function setProcessID(){
        $this->processID = getmypid();
    }
    
    protected final function setType(){
        $this->type = get_called_class();
        return $this->type;
    }
    
    public final function setMe($id){
        $this->me = UserController::byId($this->reader,$id);
    }
    
    protected final function registerNewJob(){
        if(! $this->jobRegistered){
            $createJob = <<<SQL
		INSERT INTO import_jobs (userid, type, orgID, uniqueTableName)
		VALUES (:userId, :type,  :orgID, :uniqueTableName);
SQL;
            $this->util->insert(
                    $createJob,
                    array(
                        'userId' => $this->me->user->getUserId(),
                        'type' => $this->setType(),
                        'orgID'=> $this->orgId,
                        'uniqueTableName' => $this->uniqueIdentifier
                    )
                );
            $this->jobRegistered = true;
        }
        
    }
    
    public final function completeJob($id){
            $updateJob = <<<SQL
		UPDATE import_jobs SET completed = 1, endedDate = CURDATE( )
		WHERE id = :id;
SQL;
            $this->util->executeUpdate(
                    $updateJob,
                    array(
                        'id' => intval($id)
                    )
                );
    }
    
    public final function setUniqueName($uniqueTableName){
        $this->uniqueIdentifier = $uniqueTableName;
    }
    
    public final function setOrgID($orgID){
        $this->orgId = $orgID;
    }
    
    protected function generateUniqueName(){
        $this->uniqueIdentifier = uniqid();
    }
    
    abstract public function import(Request $request);
    abstract protected function mapOriginalFiles($folderPath);
    abstract protected function mapCSV($filePath, $queryCreate);
    abstract public function importUsers();
    abstract public function importClasses($limit);
    abstract public function assignStudentsToClasses($limit);
    abstract protected function setRequiredFiles();
    abstract public static function importTemplate();
    
    
}
