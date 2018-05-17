<?php

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;



if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id = intval($_SESSION['USER']['ID']);

//	$query = "SELECT user_classes.userid FROM `user_classes` WHERE user_classes.userid={$user_id} AND user_classes.is_teacher=1  LIMIT 1";
//
//	$result = $DB->mysqli->query($query);
	$orm = new PmOrm($_SESSION,$DB);
	if(is_admin_user(0,$DB,false) or $orm->am_i_edit_teacher()) {
		$customStyles = \English3\Controller\Organization\OrganizationStyleCustomization::fromUserId($_SESSION['USER']['ID']);
		include_once($PATHS->app_path . $PATHS->views_path . '/editor.html');
	} else {
		header("Location: http://" . $_SERVER['HTTP_HOST']);
	}
} else {
	include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
}

?>