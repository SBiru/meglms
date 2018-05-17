<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/courseadmin/', '', $uri);

	$uri = strtok($uri, '/');

	$department_id = intval($uri);

	if($department_id > 0) {
		$data = new \stdClass();

		$data->courses = array();

		$user_id = intval($_SESSION['USER']['ID']);
		
		$query = "SELECT user_admin_super.user_id FROM `user_admin_super` WHERE user_admin_super.user_id={$user_id} LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$query = "SELECT courses.id, courses.name FROM departments JOIN courses ON (courses.departmentid=departments.id) WHERE departments.id={$department_id} AND departments.is_active=1 ORDER BY courses.name ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->courses[] = clone $row;
				}
			}
		} else {
			$query = "SELECT courses.id, courses.name FROM users JOIN organizations ON (users.organizationid=organizations.id) JOIN departments ON (organizations.id=departments.organizationid) JOIN courses ON (courses.departmentid=departments.id) WHERE users.id={$user_id} AND departments.id={$department_id} AND departments.is_active=1 ORDER BY courses.name ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->courses[] = clone $row;
				}
			}
		}

		header('Content-Type: application/json');

		print json_encode($data);
	}
}

?>