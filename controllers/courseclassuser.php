<?php

global $PATHS, $DB;


if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/courseclassuser/', '', $uri);

	$uri = strtok($uri, '/');

	$organization_id = intval($uri);

       if($uri=='classusers') {
		$data = new \stdClass();

		$data->users = array();

		$user_id = intval($_SESSION['USER']['ID']);
		
		$query = "SELECT user_admin_super.user_id FROM `user_admin_super` WHERE user_admin_super.user_id={$user_id} LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			if($_SERVER['REQUEST_METHOD'] == 'POST') {
				$json_input = file_get_contents('php://input');

              	       $input = json_decode($json_input);

				$data = new \stdClass();

				$class_id = intval($input->class_id);

				$query = "SELECT users.id, classes.name as 'class_name', classes.id as 'class_id', users.fname, users.lname, users.email, users.is_active, users.created, user_classes.is_student, user_classes.is_teacher FROM users JOIN user_classes ON (user_classes.userid=users.id) JOIN classes ON (user_classes.classid=classes.id)  WHERE classes.id={$class_id} ORDER BY users.lname ASC";
	
				$result = $DB->mysqli->query($query);
	
				if($result && $result->num_rows > 0) {
					while($row = $result->fetch_object()) {
						$temp = clone $row;

						$temp->type = 'Student';

						if($row->is_teacher == 1) {
							$temp->type = 'Teacher';
						}

						$data->users[] = clone $temp;						
					}
				}
			}
		} 

		header('Content-Type: application/json');

		print json_encode($data);

	} else if($organization_id > 0) {
		$data = new \stdClass();

		$data->users = array();

		$user_id = intval($_SESSION['USER']['ID']);
		
		$query = "SELECT user_admin_super.user_id FROM `user_admin_super` WHERE user_admin_super.user_id={$user_id} LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$query = "SELECT users.id, organizations.name as 'organization_name', users.fname, users.lname, users.email, users.is_active, users.created FROM users JOIN organizations ON (organizations.id=users.organizationid) WHERE organizations.id={$organization_id} AND organizations.is_active=1 ORDER BY users.lname ASC";

			$result = $DB->mysqli->query($query);
	
			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$data->users[] = clone $row;
				}
			}
		} 

		header('Content-Type: application/json');

		print json_encode($data);
	}
}

?>