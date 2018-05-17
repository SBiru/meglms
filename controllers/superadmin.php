<?php

global $PATHS, $DB;
require_once('usertools/orm.php');

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id = intval($_SESSION['USER']['ID']);
	$user = new PmOrm($_SESSION,$DB);
	if($user->am_i_super_user() or $user->am_i_organization_admin()){

		$customStyles = \English3\Controller\Organization\OrganizationStyleCustomization::fromUserId($_SESSION['USER']['ID']);
		include_once($PATHS->app_path . $PATHS->views_path . '/superadmin.html');
	}
	else{
		include_once($PATHS->app_path . $PATHS->views_path . '/index.html');
	}
} else {
	include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
}

?>