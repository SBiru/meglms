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

    $json_input = file_get_contents('php://input');

    $input = json_decode($json_input);

    $data = new \stdClass();
    $request_parts = explode('/', $_SERVER['REQUEST_URI']);
    //$data->requestParts = implode($request_parts);

    $mysql_email = $DB->mysqli->real_escape_string($input->email);
    $page_id = intval($input->page_id);

    foreach($request_parts as $index=>$part){
        switch($index){
            case 1:
                // If the first URL part is not "nimbleknowledge_lesson, something is wrong here"
                if(strcasecmp("nimbleknowledge_lesson") != 0){
                    exit();
                }
                // Do nothing, index 00 should be "inLessonActivity
                break;
        }
    }

    $query = "INSERT INTO nimbleknowledge_lesson (email, pageid, date_created) VALUES ('{$mysql_email}',{$page_id}, now())";

    $DB->mysqli->query($query);

    $data->message = 'successful';
    $data->query = $query;

    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}


main($DB);