<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.12
 * Time: 11:50
 */

namespace English3\WebSocket\Channels\AutomatedAlerts;


use English3\Controller\AutomatedAlerts\AutomatedAlertsDB;
use English3\Controller\AutomatedAlerts\RunAutomatedAlerts;
use English3\Controller\Utility;
use English3\WebSocket\BrokerServer;
use React\EventLoop\Timer\TimerInterface;

class Alert {
    private $params;

    /**
     * @var \React\EventLoop\Timer\TimerInterface
     */
    private $timer;
    /**
     * @var callable
     */

    /**
     * @var bool
     */
    private $isRunning = false;


    private $onFinished;

    public function __construct(array $params){
        $this->params = $params;
    }
    public static function loadAllFromDB(array &$cachedAlerts){
        $sql = new AutomatedAlertsDB();
        $alerts =  $sql->getAllAlerts();
        foreach($alerts as $alert){
            Utility::addToObjectIfNotExists($alert['id'],new Alert($alert),$cachedAlerts);
        }
    }
    public function getId(){
        return $this->params['id'];
    }
    public function getFrequency(){
        return $this->params['frequency'];
    }
    public function getLastRun(){
        return $this->params['lastRun']?:date('Y-m-d H:i:s');
    }
    public function isEnabled(){
        return boolval($this->params['enabled']);
    }
    public function setTimer(TimerInterface $timer){
        $this->clearTimer();
        $this->timer = $timer;
    }
    public function clearTimer(){
        if($this->timer){
            $this->timer->cancel();
        }
    }
    public function run(){
        if($this->isRunning) return;
        $this->isRunning = true;
        Logger::DEBUG('starting '.$this->params['id']);
        BrokerServer::$loop->addTimer(0,function(){
            $runAlerts = new RunAutomatedAlerts($this->params);
            $runTask  = $this->params['name'];
            if(!method_exists($runAlerts,$runTask)){
                return;
            }
            try{
                $runAlerts->$runTask();
                $this->setLastRunTime();
                $this->isRunning = false;
                call_user_func($this->onFinished,$this);
            }catch(\Exception $e){
                $this->isRunning = false;
            }
        });


    }
    private function setLastRunTime(){
        AutomatedAlertsDB::updateLastRun($this->getId());
        $this->update();
    }
    public function update(){
        $this->params = AutomatedAlertsDB::_get($this->getId(),false);
    }
    public function setOnFinished(callable $callback){
        $this->onFinished = $callback;
    }

}