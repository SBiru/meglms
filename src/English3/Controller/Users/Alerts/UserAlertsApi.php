<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.6
 * Time: 09:06
 */

namespace English3\Controller\Users\Alerts;


use English3\Controller\AutomatedAlerts\Alerts\AlertExporter;
use English3\Controller\AutomatedAlerts\Alerts\AlertFactory;
use English3\Controller\AutomatedAlerts\Alerts\AlertTypes;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UserAlertsApi {
    public function get(Request $r){
        $userId = $_SESSION['USER']['ID'];
        $db = new UserAlertsDB($userId);
        return new JsonResponse($db->get());
    }
    public function loadAlert(Request $request){
        Utility::clearPOSTParams($request);
        $alertInfo = $request->request->get('alert');

        $alert = AlertFactory::createAlertFromTypeWithParams(AlertTypes::fromString($alertInfo['type']),@$alertInfo['params']?:array());
        $alert->loadAlertFromParams();
        $alertInfo['data'] = array_values($alert->sortBy(@$alertInfo['sortBy']));
        $alertInfo['tableHeader'] = $alert->innerTableInfo();
        return new JsonResponse($alertInfo);
    }

    public function save(Request $request){
        Utility::clearPOSTParams($request);
        $userId = $_SESSION['USER']['ID'];
        $alerts = $request->request->get('alerts');
        $layout = $request->request->get('layout');
        $db = new UserAlertsDB($userId);
        $db->save($alerts,$layout);
        return new JsonResponse('ok');
    }
    public function download(Request $request){
        Utility::clearPOSTParams($request);
        $alertInfo = $request->request->get('alert');
        $alert = AlertFactory::createAlertFromTypeWithParams(AlertTypes::fromString($alertInfo['type']),@$alertInfo['params']?:array());
        $exporter = new AlertExporter($alert);
        $data = $exporter->prepareDataToDownload($alertInfo['data']);
        return new JsonResponse(['content'=>$data]);
    }
    public function logAccess(Request $request){
        $userId = $_SESSION['USER']['ID'];
        $lastAccess = Utility::getInstance()->fetchOne('SELECT meta_value FROM user_meta WHERE userid = :userId and meta_key = "current_alert_access"',['userId'=>$userId]);
        if($lastAccess){
            Utility::getInstance()->insert($this->queryLastAccessLog,['userId'=>$userId,'lastAccess'=>$lastAccess]);
        }
        Utility::getInstance()->insert($this->queryCurrentAccessLog,['userId'=>$userId]);
        return new JsonResponse('ok');
    }
    private $queryCurrentAccessLog = <<<SQL
    INSERT INTO user_meta (userid, meta_key, meta_value) values (:userId,'current_alert_access',now())
     ON DUPLICATE KEY UPDATE meta_value = values(meta_value)
SQL;
    private $queryLastAccessLog = <<<SQL
    INSERT INTO user_meta (userid, meta_key, meta_value) values (:userId,'last_alert_access',:lastAccess)
     ON DUPLICATE KEY UPDATE meta_value = values(meta_value)
SQL;

}