<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.6
 * Time: 08:15
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


class AlertFactory {
    public static function createAlertFromTypeWithParams(AlertTypes $type, array $params){
        $alert = null;
        $evalStringFormat = "\$alert = new %s(\$params);";
        $class = $type->getAlertClass();
        eval(sprintf($evalStringFormat,$class));
        return $alert;
    }


}