<?php

global $PATHS, $DB;
require_once("sql.php");
function make_objectives($courses){
	$objectiveSQL = new ObjectiveSQL();
	$result = $objectiveSQL->get_all_by_course_id($courses);

	if($result && count($result) > 0) {

		foreach($result as $row) {
			if(isset($courses[$row->course_id])) {
				$courses[$row->course_id]->objectives[] = $row;
			}
		}
	}
}
function make_banks($courses){
	$banksSQL = new BankSQL();
	$result = $banksSQL->get_all_by_course_id($courses);

	if($result && count($result) > 0) {

		foreach($result as $row) {
			if(isset($courses[$row->course_id])) {
				$courses[$row->course_id]->banks[] = $row;
			}
		}
	}
}


function make_allbanks(){
	$banksSQL = new BankSQL();
	$result = $banksSQL->get_all_banks();
	$allbanks = array();

	if($result && count($result) > 0) {
		foreach($result as $row) {
			$allbanks[] = $row;
		}
	}
	return $allbanks;
}

function make_tests($courses){
	$testSQL = new TestSQL();
	$result = $testSQL->get_all_by_course_id($courses);

	if($result && count($result) > 0) {
		foreach($result as $row) {
			if(isset($courses[$row->course_id])) {
				$courses[$row->course_id]->tests[] = $row;
			}
		}
	}
}

function make_alltests(){
	$testSQL = new TestSQL();
	$result = $testSQL->get_all_tests();
	$allTests =  array();
	if($result && count($result) > 0) {
		foreach($result as $row) {
		$allTests[] = $row;
		}
	}
	return $allTests;
}


if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$user_id  = intval($_SESSION['USER']['ID']);
	$action   = '';
	$response = new \stdClass();
	
	$request  = array();
	if(preg_match('/\/.+\/([a-z\-]+)\/(\d+)/', $_SERVER['REQUEST_URI'], $request)) {
		$request['action'] = $request[1];
		$request['id']     = intval($request[2]);
	}
	
	$response->user_id   = $user_id;
	$response->action    = $request['action'];

	if($request['action'] == 'me') {
		$userSQL = new UserSQL();
		$result = $userSQL->get_courses_by_id($user_id);
		
		if($result && count($result)) {
			
			$courses = array();
			
			foreach($result as $row) {
				$courses[$row->id] = $row;
				$courses[$row->id]->objectives = array();
				$courses[$row->id]->banks      = array();
				$courses[$row->id]->tests      = array();
			}
			
			
			// objectives
			make_objectives($courses);

			// banks
			make_banks($courses);

			// tests
			make_tests($courses);
			
		$response->courses = array_values($courses);
		$response->allBanks = make_allbanks();//Golabs
		$response->allTests = make_alltests();//Golabs
		}
		
	}
	header('Content-Type: application/json');
	echo json_encode($response);
	
	
} else {

	// @TODO: respond with uniform "must-log-in" or "invalid-access" error
	
}