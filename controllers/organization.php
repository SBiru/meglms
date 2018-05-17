<?php

global $PATHS, $DB;
require_once('usertools/orm.php');
if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/organization/', '', $uri);

	$uri = strtok($uri, '/');

	$organization_id = $uri;

	if($organization_id == 'me') {
		$data = new \stdClass();

		$data->organizations = array();

		$user_id = intval($_SESSION['USER']['ID']);
		
		$query = "SELECT user_admin_super.user_id FROM `user_admin_super` WHERE user_admin_super.user_id={$user_id} LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$query = "SELECT organizations.id, organizations.name,organizations.blackouts,organizations.calculate_progress FROM organizations WHERE organizations.is_active=1 ORDER BY organizations.name ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->organizations[] = clone $row;
				}
			}
		} else {
			$query = "SELECT users.organizationid as id, organizations.name,organizations.blackouts,organizations.calculate_progress FROM users JOIN organizations ON (users.organizationid=organizations.id) WHERE users.id={$user_id} AND organizations.is_active=1 ORDER BY organizations.name ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->organizations[] = clone $row;
				}
			}
		}
		foreach($data->organizations as $row){
			$warnings = [];
			if(boolval($row->calculate_progress) && !boolval($row->blackouts)){
				$warnings['calendar'] = true;
			}
			if(count($warnings)){
				$row->show_warning = true;
				$row->warnings = $warnings;
			}

			unset($row->blackouts);
			unset($row->calculate_progress);
		}

		header('Content-Type: application/json');

		print json_encode($data);
	}
}
