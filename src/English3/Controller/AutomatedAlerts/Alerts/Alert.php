<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.6
 * Time: 08:27
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


abstract class Alert {
    public $params;
    protected  function __construct($params){
        $this->params = $params;
    }
    public abstract function loadAlertFromParams();
    public abstract function sortBy($by);
    public function innerTableInfo(){return null;}
    public function outerTableInfo(){return null;}
    public function useOuterTable(){return false;}
}
