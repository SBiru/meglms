<?php

global $PATHS, $DB;

use English3\Controller\Utility;

require __DIR__ . "/usertools/orm.php";

$orm = new PmOrm($_SESSION, $DB);

if (!$orm->logged_in || $orm->has_temp_password() || $orm->license_expired()) {
    include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
    exit();
}
$customStyles = \English3\Controller\Organization\OrganizationStyleCustomization::fromUserId($_SESSION['USER']['ID']);
//if($_SESSION['USER']['ID']==14913200089943420 || $_SESSION['USER']['ID']==14908849263337760){
//    header("Location: http://" . $_SERVER['HTTP_HOST'] . "/j1-dashboard/#/home/1/j1-dashboard/1080", 303);
//    exit();
//}
//if(($_SESSION['USER']['ID']==79825 || $_SESSION['USER']['ID']==14948626868967170 ||
//$_SESSION['USER']['ID']==14975006984815550)
//&& $uri !=='/j1-dashboard/'){
//    header("Location: http://" . $_SERVER['HTTP_HOST'] . "/j1-dashboard/#/", 303);
//    exit();
//}
include_once ($PATHS->app_path .'/src/English3/Controller/ProficiencyTest/TestApi.php');
$userInstance = new \English3\Controller\UserController(Utility::getInstance()->reader);
$dashCtrl = new \English3\Controller\Organization\Dashboards($_SESSION['USER']['ORGID']);
$dashboards = $dashCtrl->getAvailableDashboards();
$dashboardStatus = new \English3\Controller\ProficiencyTest\TestStatus($_SESSION['USER']['ID']);
$status = $dashboardStatus->check();
$status['isOnlyStudent'] = \English3\Controller\Classes\UserClass::isOnlyStudent($_SESSION['USER']['ID']);
$status['onlyProficiencyClasses'] = $userInstance->hasOnlyProficiencyClasses();
$status['bothAvailable'] = $status['j1-available'] && $status['e3pt-available'];
$dashboards['proficiency'] = $status;

include_once($PATHS->app_path . $PATHS->views_path . '/splash/index-test.html');


?>
