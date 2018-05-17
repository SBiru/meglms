<?php


namespace English3\Controller\AutomatedAlerts;

use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class AutomatedAlertsDB extends AutomatedAlertsSQL{
    public function queryOrgAlerts($orgId){
        return array_map(function($alert){
            return AutomatedAlertsDB::buildAlert($alert);
        },parent::getOrgAlerts($orgId));
    }
    public function getAllAlerts(){
        return array_map(function($alert){
            return AutomatedAlertsDB::buildAlert($alert);
        },parent::getAllAlerts());
    }
    public function delete($alertId){
        Utility::getInstance()->reader->delete('automated_alerts',['id'=>$alertId]);
    }
    public function get($alertId){
        $alert = parent::get($alertId);
        return AutomatedAlertsDB::buildAlert($alert);
    }
    public static function _get($alertId,$prepareTime = true){
        $alert = parent::_get($alertId);
        return AutomatedAlertsDB::buildAlert($alert,$prepareTime);
    }
    public static function updateLastRun($id){
        Utility::getInstance()->reader->update(
            'automated_alerts',
            [
                'last_run'=>date('Y-m-d H:i:s')
            ],['id'=>$id]
        );
    }
    public function update($alert){
        $alert['frequency']['time']=date("H:i", strtotime($alert['frequency']['time']));
        Utility::getInstance()->reader->update(
            'automated_alerts',
            [
                'name'=>$alert['name'],
                'description'=>$alert['description'],
                'enabled'=>intval($alert['enabled']),
                'test_version'=>intval($alert['isTestVersion']),
                'addressees'=>json_encode($alert['addressees']),
                'frequency'=>json_encode($alert['frequency']),
                'options'=>json_encode($alert['options']),
                'last_run'=>$alert['lastRun'],
                'modified_on'=>date('Y-m-d H:i:s'),
                'modified_by'=>$_SESSION['USER']['ID'],
            ],
            ['id'=>$alert['id']]
        );
    }
    public function create($alert){
        Utility::getInstance()->reader->insert(
            'automated_alerts',
            [
                'name'=>$alert['name'],
                'org_id'=>$alert['org_id'],
                'description'=>$alert['description'],
                'enabled'=>intval($alert['enabled']),
                'test_version'=>intval($alert['isTestVersion']),
                'options'=>json_encode($alert['options']),
                'modified_on'=>date('Y-m-d H:i:s'),
                'modified_by'=>$_SESSION['USER']['ID'],
            ]
        );
        return Utility::getInstance()->reader->lastInsertId();
    }
    public static function buildAlert($alert,$prepareTime = true){
        $alert = [
            'id'=>$alert['id'],
            'orgId'=>$alert['org_id'],
            'name'=>$alert['name'],
            'description'=>$alert['description'],
            'enabled'=>boolval($alert['enabled']),
            'isTestVersion'=>boolval($alert['test_version']),
            'addressees'=>json_decode($alert['addressees'],true),
            'frequency'=>json_decode($alert['frequency'],true),
            'options'=>json_decode($alert['options'],true),
            'lastRun'=>$alert['last_run'],
            'modifiedOn'=>$alert['modified_on'],
            'modifiedBy'=>$alert['modified_by'],
        ];
        if(@$alert['frequency']['time'] && $prepareTime){
            $timeParts = explode(':',$alert['frequency']['time']);
            $hour = $timeParts[0];
            $min = $timeParts[1];
            $alert['frequency']['time'] = (new \DateTime())->setTime($hour,$min)->format('Y-m-d H:i:s');
        }
        return $alert;
    }
}
class AutomatedAlertsSQL{
    protected function getOrgAlerts($orgId){
        return Utility::getInstance()->fetch($this->queryGetOrgAlerts,['orgId'=>$orgId]);
    }
    protected function getAllAlerts(){
        return Utility::getInstance()->fetch($this->queryGetAlllerts);
    }
    protected function get($alertId){
        return Utility::getInstance()->fetchRow(self::$queryGetAlert,['alertId'=>$alertId]);
    }
    protected static function _get($alertId){
        return Utility::getInstance()->fetchRow(self::$queryGetAlert,['alertId'=>$alertId]);
    }
    protected $queryGetAlllerts = <<<SQL
    select * from automated_alerts
SQL;
    protected $queryGetOrgAlerts = <<<SQL
    select * from automated_alerts where org_id = :orgId
SQL;
    protected static $queryGetAlert = <<<SQL
    select * from automated_alerts where id = :alertId
SQL;

}