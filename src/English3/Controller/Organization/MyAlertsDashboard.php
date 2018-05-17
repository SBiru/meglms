<?php
/**
 * Created by IntelliJ IDEA.
 * User: ubuntu
 * Date: 13/12/17
 * Time: 15:06
 */

namespace English3\Controller\Organization;



use English3\Controller\GradebookController;
use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;



class MyAlertsDashboard extends Dashboard {
    protected $orgFlag = 'use_alert_splash';
    protected $roles = ['teacher','admin'];
    public function dashboardSettings()
    {
        return true;
    }
}