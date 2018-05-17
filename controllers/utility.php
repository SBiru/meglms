<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$user_id = intval($_SESSION['USER']['ID']);

	$data = new \stdClass();

	$data->can_edit = false;

	$query = "SELECT user_classes.userid FROM `user_classes` WHERE user_classes.userid={$user_id} AND user_classes.is_teacher=1  LIMIT 1";

	$result = $DB->mysqli->query($query);

	if($result && $result->num_rows == 1) {
		$data->can_edit = true;
	} 

	header('Content-Type: application/json');
	print json_encode($data);
	exit();
}

?>