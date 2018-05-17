<?php
/**
 * Created by PhpStorm.
 * User: SoftSuave
 * Date: 2/2/2017
 * Time: 6:13 PM
 */

global $PATHS, $DB,$app;
require_once('sql.php');
require_once('usertools/orm.php');
require_once('usertools/bitwise_permissions.php');

function is_logged_in($user) {
    return isset($user['LOGGED_IN']) &&
        isset($user['ID']) &&
        $user['ID'] > 0 &&
        $user['LOGGED_IN'] == true;
}

if (isset($_SESSION['USER']) && is_logged_in($_SESSION['USER'])) {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    $uri = str_replace('/studentactivity/', '', $uri);
    $action = strtok($uri, '/');

    $json_input = file_get_contents('php://input');
    $input = json_decode($json_input);

    $user_id = intval($_SESSION['USER']['ID']);

    $courseId = intval($input->courseId);
    $activityId = intval($input->activityId);
    $mysql_course_id = $courseId;
    $mysql_activity_id = $activityId;
    $mysql_student_id = $user_id;

    if ($action == 'save') {

        $mysql_number_of_attempts = 1;
        $query = "SELECT * FROM student_activity_track WHERE course_id='$mysql_course_id' AND activity_id='$mysql_activity_id' AND student_id='$mysql_student_id' ";
        $result = $DB->mysqli->query($query);

        if($result->num_rows == 1 ) {
            // already activity tracked
        }else{
            $query = "INSERT INTO student_activity_track
                            (course_id,activity_id,student_id,number_of_attempts
                            )
                            VALUES(
                            '{$mysql_course_id}','{$mysql_activity_id}','{$mysql_student_id}','{$mysql_number_of_attempts}')";

            $DB->mysqli->query($query);
        }
    }
}






?>