<?php

global $PATHS, $DB;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {

	$action = 'fetch';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
		$action = 'update';
	}
	
	
	$user_id = intval($_SESSION['USER']['ID']);
	preg_match('/\/flashit\/(?P<vocabID>\d*)$/', $_SERVER['REQUEST_URI'], $matches);
	$vocabID = $matches['vocabID'];
	
	if($action=='update'){
		$json_input = file_get_contents('php://input');
		$input = json_decode($json_input);

		
		$correct = intval($input->correct);
		$incorrect = intval($input->incorrect);
		$remaining = intval($input->remaining);
		

		$q = "INSERT INTO `flash_it_right_id` (`correct`, `incorrect`, `remaining`, `user_id`, `vocabulary_id`) VALUES( {$correct}, {$incorrect}, {$remaining}, {$user_id}, {$vocabID}) ON DUPLICATE KEY UPDATE correct=VALUES(correct), incorrect=VALUES(incorrect), remaining=VALUES(remaining)";
		$DB->mysqli->query($q);
		$data = new \stdClass();
		$data->success = true;
		//$data->query = $q;
		header('Content-Type: application/json');
		echo json_encode($data);
	}
	
	if($action=='fetch'){
		$q = "SELECT `correct`, `incorrect`, `remaining`  FROM `flash_it_right_id` WHERE `user_id` = {$user_id} and `vocabulary_id` = {$vocabID} limit 1";
		
		$result = $DB->mysqli->query($q);
		
		while($row = $result->fetch_assoc()){
			$response = new \stdClass();
			$response->correctAnswers = $row['correct'];
			$response->incorrectAnswers = $row['incorrect'];
			$response->remainingQuestions = $row['remaining'];
			echo json_encode($response);
			exit();
		}
		
		$response = new \stdClass();
		$response->correctAnswers = 0;
		$response->incorrectAnswers = 0;
		$response->remainingQuestions = 0;
		echo json_encode($response);
		exit();
		
	}
    exit();


}