<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$data = new \stdClass();
	$data->navs = new \stdClass(); 

	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/preference/', '', $uri);

	$uri = strtok($uri, '/');

	if($uri == 'me') {
		$user_id = INTVAL($_SESSION['USER']['ID']);

		$query = 	"select navs.id, navs.key, localize_navs.translation, localize_navs.language, user_preferences.user_id from navs JOIN localize_navs ON (navs.key=localize_navs.nav_key) JOIN user_preferences ON (user_preferences.value=localize_navs.language) JOIN users ON (users.id=user_preferences.user_id) WHERE user_id={$user_id} AND user_preferences.preference='language'";

		$data->query = $query;

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows > 0) {
			while($row = $result->fetch_object()) {
				$data->navs->{$row->key} = $row;
			}	
		}

		// Query for if pages for this user should be displayed in right-to-left text alignment based on the user's
		// language preference.
		$rtlQuery = "SELECT languages.rtl_support FROM languages JOIN user_preferences ON (user_preferences.value=languages.language_id) WHERE user_preferences.user_id={$user_id}";

		$data->rtlQuery = $rtlQuery;

		$rtlResult = $DB->mysqli->query($rtlQuery);

		if($rtlResult && $rtlResult->num_rows == 1){
			$rtlRow = $rtlResult->fetch_object();
			// This value will be 1 if RTL support should be enabled, 0 otherwise
			$data->rtl = $rtlRow->rtl_support;
		}
	} else {
	}

	header('Content-Type: application/json');

	print json_encode($data);

	exit();
} 

?>