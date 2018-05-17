<?php

// get courses for a user
session_write_close();
global $PATHS, $DB;

require __DIR__ . "/usertools/orm.php";
require "_utils.php";
$orm = new PmOrm($_SESSION, $DB);

if (!$orm->logged_in) {
    exit();
}

$uri = strtok($_SERVER['REQUEST_URI'], '?');

$uri = str_replace('/course/', '', $uri);

$uri = strtok($uri, '/');

$user_id = $uri;


if($user_id == 'taught'){ // Get a list of courses that the current user teaches
    $user_id = intval($_SESSION['USER']['ID']);
    $data = new \stdClass();
    $includeGroups = array_key_exists('includeGroups', $_REQUEST)? ($_REQUEST['includeGroups']==1?true:false) : false;
    $includeStudents = array_key_exists('includeStudents', $_REQUEST)?
        ($_REQUEST['includeStudents']=='true'?true:false) :
        false;
    //1 for editor, 2 for normal teacher
    $taughtType= $includeGroups || array_key_exists('asTeacher', $_REQUEST)?2:1;
    $includeInactive = array_key_exists('includeInactive', $_REQUEST)? ($_REQUEST['includeInactive']==1?true:false) : false;
    $data->courses = $orm->get_classes_for($user_id, $taughtType,false,$includeGroups,$includeInactive,$includeStudents);

} else if($user_id == 'student'){
    $user = $_REQUEST['id']=='me'|| !isset( $_REQUEST['id'])?$orm->user_id:$_REQUEST['id'];
    $data = new \stdClass();
    $data->courses = $orm->get_classes_for($user, false,true,true);
    header('Content-Type: application/json');
    print json_encode($data->courses);
    exit;
}
else {
    
    if ($user_id == 'me') {
        $user_id = $orm->user_id;
    } else {
        if (!$user_id) {
            // http_response_code(400);
            echo "Unknown user";
            exit();
        }
        $user_id = intval($user_id);
        if (!$user_id) {
            // http_response_code(400);
            echo "Unknown user";
            exit();
        }
        if (!$orm->am_admin_for($user_id)) {
            // http_reponse_code(401);
            echo "You are not authorized to view classes for this user";
            exit();
        }
    }

    $data = new \stdClass();
    if($orm->am_i_organization_admin()||$orm->am_i_super_user()){
        $data->courses = $orm->get_classes_for($user_id, true,false,true);
    }
    else{
        $data->courses = $orm->get_classes_for($user_id, false,false,true);
    }

}

header('Content-Type: application/json');

print json_encode($data);
