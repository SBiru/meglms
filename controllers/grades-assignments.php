<?php
require_once('usertools/orm.php');
require_once('_utils.php');

function getAssignmentsForClass($input){
    global $DB;
    $user = new PmOrm($_SESSION,$DB);
    if(!(isset($input->class_id) && intval($input->class_id)>0))
        throwError("Invalid value for class_id");
    if(!(isset($input->class_id) && intval($input->user_id)>0))
        throwError("Invalid value for user_id");

    $data = $user->get_assignments_for_class($input->class_id,$input->user_id);

    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

function main($uri){
    global $PATHS, $DB;
    $action = get_action('/grades-assignments/',$uri);
    $input = get_input();
    if($action=='get-assignments-for-class') getAssignmentsForClass($input);
}

$uri = strtok($_SERVER['REQUEST_URI'], '?');
if (substr($uri,0,19)=='/grades-assignments'){
main($uri);
}
?>