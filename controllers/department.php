<?php

global $PATHS, $DB;
require_once('usertools/orm.php');
if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/department/', '', $uri);

	$uri = strtok($uri, '/');

	$organization_id = intval($uri);

	if($organization_id > 0) {

		$data = new \stdClass();

		$data->departments = array();

		$user_id = intval($_SESSION['USER']['ID']);
		
		$query = "SELECT user_admin_super.user_id FROM `user_admin_super` WHERE user_admin_super.user_id={$user_id} LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$query = "SELECT departments.id, departments.name FROM organizations JOIN departments ON (organizations.id=departments.organizationid) WHERE organizations.id={$organization_id} AND organizations.is_active=1 ORDER BY departments.name ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->departments[] = clone $row;
				}
			}
		} else {
			$query = "SELECT departments.id, departments.name FROM users JOIN organizations ON (users.organizationid=organizations.id) JOIN departments ON (organizations.id=departments.organizationid) WHERE users.id={$user_id} AND organizations.id={$organization_id} AND organizations.is_active=1 ORDER BY departments.name ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->departments[] = clone $row;
				}
			}
		}

		header('Content-Type: application/json');

		print json_encode($data);
	}
}

?>