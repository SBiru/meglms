<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.12
 * Time: 11:50
 */

namespace English3\WebSocket\Channels\AutomatedAlerts;


use English3\Controller\AutomatedAlerts\AutomatedAlertsDB;
use English3\Controller\Utility;
use English3\WebSocket\AdvisoryTopics\ConsumerQueue;
use English3\WebSocket\BrokerServer;
use English3\WebSocket\Channels\ChannelBase;
use English3\WebSocket\Message;

class Manager extends ChannelBase {
    protected $clientTopic = '/queue/client.alerts';
    protected $serverTopic = '/topic/server.alerts';
    protected $alerts = array();
    protected $scheduler;
    protected $sql;
    public function __construct(\React\Stomp\Client $client){
        parent::__construct($client);
        $this->advisoryQueue = new ConsumerQueue($client,'client.alerts');
        $this->scheduler = new Scheduler(BrokerServer::$loop);
//        Alert::loadAllFromDB($this->alerts);
//        Logger::setClient($client);
//        foreach($this->alerts as $alert) {
//            $alert->setOnFinished([$this,'alertHasFinished']);
//            if($alert->isEnabled()){
//                $this->scheduler->scheduleNextRun($alert);
//            }
//        }
    }
    public function alertHasFinished(Alert $alert){
        Logger::DEBUG($alert->getId().' has finished');
        $this->scheduler->scheduleNextRun($alert);
    }
    public function on($event, Message $message)
    {
        call_user_func(array($this,$event),$message);
    }
    public function alertRemoved(Message $message){
        $id = $message->data->id;
        if($alert = $this->alerts[$id]){
            $alert->clearTimer();
            unset($this->alerts[$id]);
            Logger::DEBUG("Alert removed " . $id);
        }
    }
    public function alertChanged(Message $message){
        $id = $message->data->id;
        Utility::addToObjectIfNotExists($id,new Alert(AutomatedAlertsDB::_get($id)),$this->alerts);
        $this->updateAlert($this->alerts[$id]);
        Logger::DEBUG("Alert changed " . $id);
    }
    private function updateAlert(Alert $alert){
        $alert->clearTimer();
        $alert->update();
        $this->scheduler->scheduleNextRun($alert);
    }

}