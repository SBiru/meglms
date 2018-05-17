<?php


namespace English3\Controller\AutomatedAlerts;


use English3\Controller\AutomatedAlerts\AutomatedEmails\AlertEmailException;
use English3\Controller\AutomatedAlerts\AutomatedEmails\BaseAlertEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\BehindInCoursesEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\GradeBelowTargetEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\MissingAttendanceEmail;
use English3\Controller\Utility;
use English3\WebSocket\Message;
use English3\WebSocket\ServerMessager;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\Debug\Exception\FatalErrorException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Debug\ExceptionHandler;
use Symfony\Component\Debug\ErrorHandler;

class AutomatedAlertsAPI extends AutomatedAlertsDB{

    public function queryOrgAlerts(Request $request,$orgId){
        Utility::getInstance()->checkAdmin($orgId);
        return new JsonResponse(parent::queryOrgAlerts($orgId));
    }
    public function remove(Request $request,$alertId){
        $alert = $this->get($alertId);
        Utility::getInstance()->checkAdmin($alert['orgId']);
        $this->delete($alertId);
        try{
            ServerMessager::sendSimpleMessage('/topic/server.alerts',new Message('alertRemoved',['id'=>$alertId]));
        }catch(\Exception $e){

        }

        return new JsonResponse('ok');
    }
    public function update(Request $request,$alertId){
        $alert = $this->get($alertId);
        Utility::getInstance()->checkAdmin($alert['orgId']);
        Utility::clearPOSTParams($request);
        $requestParams = $request->request->all();
        unset($requestParams['lastRun']);
        $alert = array_merge($alert,$requestParams);
        parent::update($alert);
        try {
            ServerMessager::sendSimpleMessage('/topic/server.alerts', new Message('alertChanged', ['id' => $alertId]));
        }
        catch(\Exception $e){

        }
        return new JsonResponse($this->get($alertId));
    }
    public function save(Request $request){
        Utility::clearPOSTParams($request);
        Utility::getInstance()->checkAdmin($request->get('org_id'));
        $alert =$request->request->all();
        $id = parent::create($alert);
        try{
            ServerMessager::sendSimpleMessage('/topic/server.alerts',new Message('alertChanged',['id'=>$id]));
        }
        catch(\Exception $e){

        }
        return new JsonResponse($this->get($id));
    }
    public function runAlert(Request $request,$alertId)
    {
        $preview = boolval(@$_REQUEST['preview']);
        ErrorHandler::register();
        try {
            $alert = $this->get($alertId);
            $alertName = $alert['name'];
            $runAlerts = new RunAutomatedAlerts($alert,$preview);
            $response = $runAlerts->$alertName();
            if($preview){
                return new JsonResponse(['preview'=>$response]);
            }else{
                $alert['last_run'] = date('Y-m-d H:i:s');
                parent::update($alert);
                return $response;
            }
        }
        catch(AlertEmailException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }catch(Exception $e){
            return Utility::buildHTTPError($e->getMessage(),500);
        }
    }

}


