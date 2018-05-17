<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id = intval($_SESSION['USER']['ID']);
	$response = new \stdClass();
	//$response->time = time();
	
	
	$course_id = 0;
	
	$vars = array();
	if(preg_match('/\/.+\/(\d+)/', $_SERVER['REQUEST_URI'], $vars)) {
		$course_id = intval($vars[1]);
	}
	
	$response->course_id = $course_id;
	
	
	if($course_id > 0) {
		
		// we need to get a list of all the quizzes for a particular course
		// @TODO: implement security for this query
		//$query = "SELECT * FROM `quizzes` WHERE `course_id`={$course_id}";
		$query = "SELECT `quizzes`.*, COUNT(`quiz_questions`.`id`) AS 'count'
					FROM `quizzes`
					LEFT JOIN `quiz_questions` ON(`quiz_questions`.`quiz_id`=`quizzes`.`id`)
					WHERE `quizzes`.`course_id`={$course_id}
					GROUP BY `quizzes`.`id` ORDER BY `quizzes`.`title` ASC";
		
		$result = $DB->mysqli->query($query);
		
		if($result) {
			
			$response->items = array();
			
			if($result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					if(!is_null($row->title)) {
						$response->items[] = $row;
					}
				}
			}
			
		}
	}
	
	header('Content-Type: application/json');
	echo json_encode($response);
	
	
} else {

	// @TODO: respond with uniform "must-log-in" or "invalid-access" error
	
}