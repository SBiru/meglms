<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.6
 * Time: 09:07
 */

namespace English3\Controller\Users\Alerts;

use English3\Controller\Utility;
use Exception;

class UserAlerts {

}
class UserAlertsDB{
    private $userId;
    public function __construct($userId){
        $this->userId = $userId;
    }
    public function get(){
        $this->checkUserId();
        $info = Utility::getInstance()->fetchRow('SELECT alerts_json,layout FROM user_alerts where userid = :userId',['userId'=>$this->userId]);
        return $info?['alerts'=>json_decode($info['alerts_json']),'layout'=>json_decode($info['layout'])]:array('alerts'=>array());
    }
    public function save($alerts,$layout){
        Utility::getInstance()->insert($this->queryInsertOrUpdate,['userId'=>$this->userId,'alerts_json'=>json_encode($alerts),'layout'=>json_encode($layout)]);
    }

    private function checkUserId(){
        if(!$this->userId){
            throw new UserAlertsException(UserAlertsException::$MISSING_USERID);
        }
    }
    private $queryInsertOrUpdate = <<<SQL
    INSERT INTO user_alerts (userid,alerts_json,layout) values (:userId,:alerts_json,:layout)
    ON DUPLICATE KEY UPDATE alerts_json = :alerts_json , layout = :layout
SQL;

}
class UserAlertsException extends Exception{
    public static $MISSING_USERID = 'Invalid userid';
}