<?php

require_once('_utils.php');
require_once('sql.php');

function getTeacherCourseStats($user_id) {
    global $DB;
    $baseSQL = new BaseSQL();
    $get_total = "
    SELECT COUNT(*)
FROM users usr 
JOIN ps_teachers ps 
  ON (ps.teacherid = usr.external_id OR ps.email = usr.email)
WHERE usr.id = {$user_id}";
    $result = $baseSQL->query($get_total,true);
    $totalCourses = (int) $result[0]["COUNT(*)"];
    $get_flagged = "
    SELECT COUNT(*)
FROM users usr
JOIN ps_teachers ps 
  ON (ps.teacherid = usr.external_id OR ps.email = usr.email)
JOIN is_attendance_only att 
  ON att.sectionid = ps.sectionid 
WHERE usr.id = {$user_id} AND att.attendance_only IS NOT NULL";
    $result = $baseSQL->query($get_flagged,true);
    $numSetCourses = (int) $result[0]["COUNT(*)"];
    $get_flagged_as_false = "
    SELECT COUNT(*)
FROM users usr
JOIN ps_teachers ps 
  ON (ps.teacherid = usr.external_id OR ps.email = usr.email)
JOIN is_attendance_only att 
  ON att.sectionid = ps.sectionid 
WHERE usr.id = {$user_id} AND att.attendance_only = 0";
    $result = $baseSQL->query($get_flagged_as_false,true);
    $numNotAttendanceOnly = (int) $result[0]["COUNT(*)"];
    $get_matched = "
    SELECT COUNT(*)
FROM users usr
JOIN ps_teachers ps 
  ON (ps.teacherid = usr.external_id OR ps.email = usr.email)
JOIN is_attendance_only att 
  ON att.sectionid = ps.sectionid 
JOIN lms_map map 
  ON map.sectionid = ps.sectionid 
WHERE usr.id = {$user_id} AND att.attendance_only = 0 AND lmsid IS NOT NULL";
    $result = $baseSQL->query($get_matched,true);
    $numMatchedCourses = (int) $result[0]["COUNT(*)"];
    $numUnsetCourses = $totalCourses - $numSetCourses;
    $numUnmatchedCourses = $numNotAttendanceOnly - $numMatchedCourses;
    $teacherCourseStats = array(
        "total"=>$totalCourses,
        "set"=>$numSetCourses,
        "unset"=>$numUnsetCourses,
        "matched"=>$numMatchedCourses,
        "unmatched"=>$numUnmatchedCourses
    );
    header('Content-Type: application/json');
    print json_encode($teacherCourseStats);
    exit();
}

function getAdvisors() {
    global $DB;
    $baseSQL = new BaseSQL();
    $get_advisors = "SELECT * FROM advisor_map";
    $advisors = $baseSQL->query($get_advisors);
    $advisors_assoc = array();
    //To allow for a many to one relationship between elms advisors and powerschool advisor names I removed the primary key from the advisor_map table
    //This means there may be multiple entries in the advisor_map table with the same value for "name"
    //In sync.php unrecognized advisors are given a placeholder in the advisor_map table (i.e. name is set, other fields are null)
    //This foreach was added to account for many to one cases (an associative array maps advisor names to an array of advisor objects, the advisor objects correspond to users in elms)
    foreach($advisors as $advisor) {
        $name = $advisor->name;
        $id = $advisor->id;
        if(!isset($advisors_assoc[$name])) $advisors_assoc[$name] = [];
        if($id > 0) {
            $advisor_copy = new \stdClass();
            $advisor_copy->id = $id;
            $advisor_copy->first_name = $advisor->first_name;
            $advisor_copy->last_name = $advisor->last_name;
            $advisor_copy->email = $advisor->email;
            array_push($advisors_assoc[$name], $advisor_copy);
        }
    }
    header('Content-Type: application/json');
    print json_encode($advisors_assoc);
    exit();
}

function linkAdvisorToUser($input) {
    global $DB;
    $baseSQL = new BaseSQL();
    if(defined('STDIN')) {
        $name = "testuser";
        $user = new \stdClass();
        $user->id = 123;
        $user->firstName = "Test";
        $user->lastName = "User";
        $user->email = "testuseremail@fakeaccount.com";
    }
    else {
        $user = $input->user;
        $name = $DB->mysqli->real_escape_string($input->name);
    }
    $external_id = $DB->mysqli->real_escape_string($user->id);
    $first_name = $DB->mysqli->real_escape_string($user->firstName);
    $last_name = $DB->mysqli->real_escape_string($user->lastName);
    $email = $DB->mysqli->real_escape_string($user->email);
    $insertQuery = "INSERT INTO advisor_map (name,id,first_name,last_name,email) VALUES ('{$name}','{$external_id}','{$first_name}','{$last_name}','{$email}') ON DUPLICATE KEY UPDATE name = name";
    $deletePlaceholder = "DELETE FROM advisor_map WHERE name = '{$name}' AND id = 0";
    if($baseSQL->query_noResult($insertQuery)) {
        $response = array("message"=>"Success");
        $baseSQL->query_noResult($deletePlaceholder);
    }
    else {
        $response =  array("message"=>"There was an error");
    }
    header('Content-Type: application/json');
    print json_encode($response);
    exit();
}

function unlinkAdvisorAndUser($input) {
    global $DB;
    $baseSQL = new BaseSQL();
    $external_id = $input->id;
    $name = $input->name;
    $getRows = "SELECT * FROM advisor_map WHERE name = '{$name}'";
    $result = $baseSQL->query($getRows);
    $count = count($result);
    $wasLast = false;
    if($count > 1) {
        $deleteQuery = "DELETE FROM advisor_map WHERE name = '{$name}' AND id = '{$external_id}'";
    }
    else {
        $deleteQuery = "UPDATE advisor_map SET id = 0, first_name = NULL, last_name = NULL, email = NULL WHERE name = '{$name}'";
        $wasLast = true;
    }
    if($baseSQL->query_noResult($deleteQuery)) {
        $response = array("message"=>"Success");
    }
    else {
        $response =  array("message"=>"There was an error");
    }
    header('Content-Type: application/json');
    print json_encode($response);
    exit();
}

function main($uri){
    $user_id = is_valid_user($_SESSION,true);
    $action = get_action('/ps_services/',$uri);
    if($action=='getTeacherCourseStats') getTeacherCourseStats($user_id);
    if($action=='getAdvisors') getAdvisors();
    if($action=='linkAdvisorToUser') linkAdvisorToUser(get_input());
    if($action=='unlinkAdvisorAndUser') unlinkAdvisorAndUser(get_input());
}
$uri = defined('STDIN') ? "/ps_services/".$argv[1] : strtok($_SERVER['REQUEST_URI'], '?');

if (substr($uri,0,13)=='/ps_services/'){

main($uri);
}