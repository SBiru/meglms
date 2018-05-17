<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.12
 * Time: 11:49
 */

namespace English3\WebSocket\Channels\AutomatedAlerts;


use English3\Controller\Utility;
use React\EventLoop\LoopInterface;
use React\EventLoop\Timer\Timer;

class Scheduler {
    /*
     * @var \React\EventLoop\LoopInterface
     */
    protected $loop;

    public function __construct(LoopInterface $loop){
        $this->loop = $loop;
    }
    public function scheduleNextRun(Alert $alert){
        if(!$alert->isEnabled()) return;
        $lastRun = strtotime($alert->getLastRun());
        $nextRun =  PeriodCalculator::calculate($lastRun,$alert->getFrequency());
        $secondsToNextRun = max(0,$nextRun-time());
        Logger::DEBUG(sprintf("Setting schedule %s to %s UTC",$alert->getId(),gmdate('Y-m-d H:i:s',$nextRun)));
        $alert->setTimer($this->loop->addTimer($secondsToNextRun,array($alert,'run')));
    }
}
class PeriodCalculator{
    public static function calculate($lastRun,$frequency){
        $next = self::calculateServerTime($lastRun,$frequency);
        $offset = array_key_exists('offset',$frequency)?$frequency['offset']:0;
        return self::convertTimezone($next,$offset*(-1));
    }
    private static function calculateServerTime($lastRun,$frequency){
        $now =  new \DateTime();
        $myOffset = $now->getOffset()/3600;
        if($frequency['period']=='daily'){
            return self::nextDay($lastRun,$frequency['time'],$myOffset,Utility::getElementFromArray('offset',$frequency,0));
        }
        if($frequency['period']=='weekly'){
            return self::nextWeek($lastRun,$frequency['day'],date('H:i:s',strtotime($frequency['time'])),$myOffset,Utility::getElementFromArray('offset',$frequency,0));
        }
        if($frequency['period']=='monthly'){
            return self::nextMonth($lastRun,$frequency['day'],date('H:i:s',strtotime($frequency['time'])),$myOffset,Utility::getElementFromArray('offset',$frequency,0));
        }
    }
    private static function convertTimezone($date,$offset=0){
        $offset = $offset?:0;
        $runDate = new \DateTime('now',new \DateTimeZone("UTC"));
        $runDate->setTimestamp($date);
        return $date + $offset*3600;
    }

    private static function nextDay($lastRun,$time,$offset,$utcOffset){
        $currentDayRunTime = strtotime('today '.$time) + $offset*3600 - $utcOffset*3600;
        return $lastRun<$currentDayRunTime?$currentDayRunTime + $offset*3600:strtotime('tomorrow '.$time,$lastRun) + $offset*3600;
    }
    private static function nextWeek($lastRun,$dayOfWeek,$time,$offset,$utcOffset){
        if(self::isCurrentDayOfWeek($dayOfWeek)){
            $currentDayRunTime = strtotime('today '.$time) + $offset*3600 - $utcOffset*3600;
            if($lastRun<$currentDayRunTime){
                return strtotime('today '.$time) + $offset*3600;
            }
        }
        return strtotime('+'.($dayOfWeek-1).' days' ,strtotime('next monday '.$time,$lastRun)) + $offset*3600;
    }
    private static function isCurrentDayOfWeek($dayOfWeek){
        return $dayOfWeek==date('w');
    }
    private static function nextMonth($lastRun,$dayOfMonth,$time,$offset,$utcOffset){
        return strtotime('+'.($dayOfMonth-1).' days' ,strtotime('first day of next month '.$time,$lastRun)) + $offset*3600;
    }

}