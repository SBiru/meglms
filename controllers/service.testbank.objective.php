<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id   = intval($_SESSION['USER']['ID']);
	$action    = '';
	$response = new \stdClass();
	
	$request  = array();
	if(preg_match('/\/.+\/([a-z\-]+)\/(\d+)/', $_SERVER['REQUEST_URI'], $request)) {
		$request['action'] = $request[1];
		$request['id']     = intval($request[2]);
	}
	
	$response->user_id   = $user_id;
	$response->action    = $request['action'];
	
	
	
	
	if($request['action'] == 'create-for') {
		
		$course_id = $request['id'];
		
		$POST  = file_get_contents('php://input');
		$data  = json_decode($POST);
		$name = isset($data->name) ? $data->name : '';
		
		$response->course_id = $course_id;
		
		
		if($course_id > 0) {
			
			if(strlen($name) <= 0) {
				
				$response->error = 'Must provide a name';
				
			} else {
				
				$sql_name = $DB->mysqli->real_escape_string($name);
				
				$query = "INSERT INTO `objectives` SET `name`='{$sql_name}', `course_id`={$course_id}, `created_by`={$user_id}";
				
				$DB->mysqli->query($query);
				
				if($DB->mysqli->affected_rows == 1) {
					$response->objective = new \stdClass();
					$response->objective->id         = $DB->mysqli->insert_id;
					$response->objective->course_id  = $course_id;
					$response->objective->name       = $name;
					$response->objective->created_by = $user_id;
					 
				} else {
					$response->error = 'Could not create new Objective. [DB-ERROR]';
				}
			}
			
		} else {
			$response->error = 'Must provide a valid Course id.';
		}
		
		
	} else if($request['action'] == 'rename') {
		
		$objective_id = $request['id'];
		
		$POST  = file_get_contents('php://input');
		$data  = json_decode($POST);
		$name = isset($data->name) ? $data->name : '';
		
		
		if($objective_id > 0) {
			
			if(strlen($name) <= 0) {
				
				$response->error = 'Must provide a name';
				
			} else {
				
				$sql_name = $DB->mysqli->real_escape_string($name);
				
				
				// @TODO: implement security here
				// @TODO: don't allow duplicate names among the same course
				
				$query = "UPDATE `objectives` SET `name`='{$sql_name}' WHERE `id`={$objective_id} LIMIT 1";
				
				$DB->mysqli->query($query);
				
				if($DB->mysqli->affected_rows == 1) {
					$response->objective = new \stdClass();
					$response->objective->id         = $objective_id;
					//$response->objective->course_id  = $course_id;
					$response->objective->name       = $name;
					//$response->objective->created_by = $user_id;
					 
				} else {
					$response->error = 'Could not rename Objective. [DB-ERROR]';
				}
			}
			
		} else {
			$response->error = 'Must provide a valid Objective id.';
		}
		
		
	} else if($request['action'] == 'get-by-course') {
		
		$course_id = $request['id'];
		
		if($course_id > 0) {
		
			// we need to get a list of all the objectives for a particular course
			// @TODO: implement security for this query
			
			$query = "SELECT * FROM `objectives` WHERE `objectives`.`course_id`={$course_id} ORDER BY `objectives`.`name` ASC";
			$result = $DB->mysqli->query($query);
			
			if($result) {
				
				$response->objectives = array();
				
				if($result->num_rows > 0) {
					while($row = $result->fetch_object()) {
						$response->objectives[] = $row;
					}
				}
				
			} else {
				$response->error = 'Could not retrieve the Objectives. [DB-ERROR]';
			}
			
		} else {
			$response->error = 'Must provide a valid Course id.';
		}
	}
	
	
	header('Content-Type: application/json');
	echo json_encode($response);
	
	
} else {

	// @TODO: respond with uniform "must-log-in" or "invalid-access" error
	
}
