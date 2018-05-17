<?php

global $PATHS, $DB;

use English3\Controller\ProficiencyTest\TestAttempts;

require __DIR__ . "/usertools/orm.php";

$orm = new PmOrm($_SESSION, $DB);

if (!$orm->logged_in || $orm->has_temp_password() || $orm->license_expired()) {
	include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
    exit();
}
if(boolval(\English3\Controller\ProficiencyTest\TestSchoolsAdmins::schoolAdmin($_SESSION['USER']['ID']))  && !($orm->am_i_organization_admin() || $orm->am_i_super_user()|| $orm->am_i_teacher())){
    header("Location: /home");
    exit();
}
if ($orm->am_i_just_parent() && !($orm->am_i_organization_admin() || $orm->am_i_super_user())) {
    header("Location: /grades/");
    exit();
}
$menu = \English3\Controller\UserController::getMenuPreference($_SESSION['USER']['ID']);
$customStyles = \English3\Controller\Organization\OrganizationStyleCustomization::fromUserId($_SESSION['USER']['ID']);
include_once($PATHS->app_path . $PATHS->views_path . '/index.html');

?>
