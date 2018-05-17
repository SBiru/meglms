<?php
//namespace English3\imports;
if(isset($PATHS)){
    require_once($PATHS->app_path .'/app.php');
}else{
    require_once('../../../app.php');
}

use Doctrine\DBAL\Connection;
/**
 * processImportJobs short summary.
 *
 * processImportJobs description.
 *
 * @version 1.0
 * @author Gilbert Mena github.com/hibrid
 */
class processImportJobs
{
    
    private $threshold = 50;
    private $minimumInterval = false; //the minimum interval per query default to a third of a second
    private $maximumInterval = 5; //the maximum interval before trying again
    private $minimumQueryLimit = 3000;
    private $useAverage = false;
    
    private $actualBehindTimes = array();
    private $n=0;
    private  $s=0;
    private $db;
    private $currentJob;
    private $currentJobData;
    
    public function __construct(){
    
        global $DB;
		$dsn = "mysql:host=$DB->host;dbname=$DB->database;charset=utf8";
		$pdo = new PDO($dsn, $DB->user, $DB->password);
		$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		$this->db = $pdo;
        $this->selectJob();
        if($this->currentJob!=null){
            $this->processJob();
        }
    }
    
    public function selectJob(){
        global $app;
        $sql = 'select * from import_jobs where completed = 0 order by startedDate ASC limit 1';
        $res = $this->db->query($sql, PDO::FETCH_ASSOC);
        $result = $res->fetch(PDO::FETCH_ASSOC);
        
        if($result){
            $job = new  $result['type']($app['dbs']['mysql_read']);
            $job->setUniqueName($result['uniqueTableName']);
            $job->setOrgID($result['orgID']);
            $job->setMe($result['userid']);
            $this->currentJob = $job;
            $this->currentJobData = $result;
        }
    
    }
    
    public function getServerLoad($windows = false){
        $os=strtolower(PHP_OS);
        if(strpos($os, 'win') === false){
            $load = sys_getloadavg();
            $load = $load[0];

            if(function_exists('shell_exec'))
                $cpu_count = shell_exec('cat /proc/cpuinfo | grep processor | wc -l');        

            return array('load'=>$load, 'procs'=>$cpu_count);
        }elseif($windows){
            if(class_exists('COM')){
                $wmi=new COM('WinMgmts:\\\\.');
                $cpus=$wmi->InstancesOf('Win32_Processor');
                $load=0;
                $cpu_count=0;
                if(version_compare('4.50.0', PHP_VERSION) == 1){
                    while($cpu = $cpus->Next()){
                        $load += $cpu->LoadPercentage;
                        $cpu_count++;
                    }
                }else{
                    foreach($cpus as $cpu){
                        $load += $cpu->LoadPercentage;
                        $cpu_count++;
                    }
                }
                return array('load'=>$load, 'procs'=>$cpu_count);
            }
            return false;
        }
        return false;
    }

    
    public function convertLoadToPercentage(){//convertLoadToPercentage($load,$procs)
        exec('ps -aux', $processes);
        foreach($processes as $process)
        {
            $cols = split(' ', ereg_replace(' +', ' ', $process));
            if (strpos($cols[2], '.') > -1)
            {
                @$cpuUsage += floatval($cols[2]);
            }
        }
        return $cpuUsage;
        
       // return round(($load * 100) / $procs,2);
    
    }
    
    
    public function processJob(){
        $class = $this->currentJobData['type'];
        $steps =  $class::importTemplate();
        //print_r($steps);
        foreach($steps as $stepNumber => $step){
            while(true){
               // $load = $this->getServerLoad();
               // print_r(sys_getloadavg());
                //print_r($load);exit;
                $percent = $this->convertLoadToPercentage();
                $skipThisRound = false;
               // echo $percent."\r\n";
                if ($percent > $this->threshold) {
                    //not using average and this host is too far behind the master
                    echo "Error: CPU above threshold at $percent \n";
                    $this->s=0;
                    ++$this->n;
                    usleep(min(((1 << $this->n) * 1000000 + rand(0, 1000000)),$this->maximumInterval));
                    $skipThisRound = true;
                    
                }
                
                
                
                if($skipThisRound){
                    continue;
                }


                
                $limitQueryBy = $this->minimumQueryLimit;
                if($this->s>0){
                    $limitQueryBy += $this->s*20; //increment the allowed limits by 100 for every success 
                }
                
                
                $method = array_keys($step);
                $method = $method[0];
                $preFlight = @$steps[$stepNumber][$method][0];
                $postFlight = @$steps[$stepNumber][$method][1];
                if(!empty($preFlight)){
                    if ($this->currentJob->$preFlight($limitQueryBy)>0) {
                        $this->currentJob->$method($limitQueryBy);
                        if(!empty($postFlight)){
                            $this->currentJob->$postFlight();
                        }
                        ++$this->s;
                        $this->n=0;
                        if($this->minimumInterval){
                            sleep($this->minimumInterval);
                        }else{
                            usleep(333333);
                        }
                        
                        continue;
                    }else{
                        echo "Task completed. \n";
                        break;
                    }
                }else{
                    $this->currentJob->$method($limitQueryBy);
                    ++$this->s;
                    $this->n=0;
                    if($this->minimumInterval){
                        sleep($this->minimumInterval);
                    }else{
                        usleep(333333);
                    }
                    
                    break;
                }
            }
        }
        $this->currentJob->completeJob($this->currentJobData['id']);
        $this->currentJob->cleanUp();
    }
    
}

$test = new processImportJobs();
