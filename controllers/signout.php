<?php

global $PATHS, $DB;
require_once('usertools/session.php');
if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$user_id = intval($_SESSION['USER']['ID']);	

	$query = "UPDATE users SET is_logged_in=0 WHERE id='{$user_id}'";

	$DB->mysqli->query($query);
}
@session_start();
$_SESSION['USER'] = array();

$_SESSION = array();
session_write_close();
$redirect = $_REQUEST['redirect']? $_REQUEST['redirect']:"http://" . $_SERVER['HTTP_HOST'] . "/";
header("Location: {$redirect}", 303);
exit();

?>