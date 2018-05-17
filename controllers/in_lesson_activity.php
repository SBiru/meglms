<?php
/**
 * Created by IntelliJ IDEA.
 * User: vancecagle
 * Date: 5/26/15
 * Time: 12:57 AM
 */

global $PATHS, $DB;

require(__DIR__ . '/_utils.php');

function main($DB){
    if(!is_logged_in($_SESSION)) {
        exit();
    }

    $data = new \stdClass();
    $request_parts = explode('/', $_SERVER['REQUEST_URI']);
    //$data->requestParts = implode($request_parts);

    foreach($request_parts as $index=>$part){
        switch($index){
            case 1:
                // If the first URL part is not "inLessonActivity, something is wrong here"
                if(strcasecmp("inLessonActivity") != 0){
                    exit();
                }
                // Do nothing, index 00 should be "inLessonActivity
                break;
            case 2:
                // The first URL part (index 2) is the email address
                $data->email = $part;
                break;
            case 3:
                // The second URL part (index 3) is the course name
                $data->course_name = $part;
                break;
            case 4:
                // The third UTL part (index 4) is the lesson number
                $data->lesson_number = $part;
                break;
            case 5:
                // The fourth URL part (index 5) is the score
                $data->score = $part;
                break;
        }
    }

    $score = intval($data->score);
    $mysql_email = $DB->mysqli->real_escape_string($data->email);

    $query = "UPDATE nimbleknowledge_lesson SET score = {$score} WHERE email = '{$mysql_email}' AND score IS NULL";

    $DB->mysqli->query($query);

    $data->message = 'successful';
    $data->query = $query;


    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}


main($DB);