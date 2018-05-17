<?php

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;



if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id = intval($_SESSION['USER']['ID']);
	$orm = new PmOrm($_SESSION,$DB);
	include_once($PATHS->app_path . $PATHS->views_path . '/singlepage/index.html');

}

?>