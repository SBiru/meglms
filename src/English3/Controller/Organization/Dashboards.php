<?php
/**
 * Created by IntelliJ IDEA.
 * User: ubuntu
 * Date: 13/12/17
 * Time: 15:06
 */

namespace English3\Controller\Organization;


use English3\Controller\Utility;

class Dashboards
{
    private $orgId;
    public function __construct($orgId)
    {
        $this->orgId = $orgId;
    }

    public function getAvailableDashboards(){
        $orgSettings = OrganizationController::_get($this->orgId);
        $dashboards = [];
        foreach ($this->dashboardsAvailable as $name => $className){
            $dashboard = null;
            $evalString = '$dashboard = new '.$className.'($orgSettings);';
            eval($evalString);
            if($settings = $this->getDashboardSettings($dashboard)){
                $dashboards[$name] = $settings;
            }
        }
        $dashboards['any'] = count($dashboards)>0;
        return $dashboards;
    }
    private function getDashboardSettings(Dashboard $dashboard){
        if($dashboard && $dashboard->checkOrgFlag() && $dashboard->checkRoles())
        {
            return $dashboard->dashboardSettings();
        }
    }
    private $dashboardsAvailable = [
        'compliance' => '\English3\Controller\Organization\ComplianceDashboard',
        'e3pt' => '\English3\Controller\Organization\E3PTDashboard',
        'j1' => '\English3\Controller\Organization\J1Dashboard',
        'reports' => '\English3\Controller\Organization\ReportsDashboard',
        'my_alerts' => '\English3\Controller\Organization\MyAlertsDashboard'
    ];
}
