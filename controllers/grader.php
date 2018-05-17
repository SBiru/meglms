<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id = intval($_SESSION['USER']['ID']);

	$query = "SELECT user_classes.userid FROM `user_classes` WHERE user_classes.userid={$user_id} AND user_classes.is_teacher=1 or user_classes.is_observer=1  LIMIT 1";

	$result = $DB->mysqli->query($query);

	if($result && $result->num_rows == 1) {
		$menu = \English3\Controller\UserController::getGraderMenuPreference($_SESSION['USER']['ID']);
		$menuTemplate = $menu=='top'?"/partials/grader/grader-topbar.html":"/partials/grader-sidebar.html";
		$customStyles = \English3\Controller\Organization\OrganizationStyleCustomization::fromUserId($_SESSION['USER']['ID']);
		include_once($PATHS->app_path . $PATHS->views_path . '/grader.html');
	} else {
        header( 'Location: /grades/' );
    }
} else {
	include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
}

?>
