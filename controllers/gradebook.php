<?php

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;



if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id = intval($_SESSION['USER']['ID']);
	$orm = new PmOrm($_SESSION,$DB);
	if($orm->am_i_super_user() || $orm->am_i_organization_admin() || $orm->am_i_teacher()) {
		$customStyles = \English3\Controller\Organization\OrganizationStyleCustomization::fromUserId($_SESSION['USER']['ID']);
		include_once($PATHS->app_path . $PATHS->views_path . '/gradebook.html');
	} else {
		header("Location: http://" . $_SERVER['HTTP_HOST']);
	}
} else {
	include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
}

?>