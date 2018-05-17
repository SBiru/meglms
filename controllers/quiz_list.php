<?php
require_once('_utils.php');
require_once('usertools/orm.php');
require_once('sql.php');

$user_id = is_valid_user($_SESSION,true);

function get_quiz_list($search){
    $data = new \stdClass();
    $testSQL = new TestSQL();
    $list = $testSQL->get_tests_list($search);
    $data->quizzes = $list;
    returnData($data);
}
function already_taken($page_id,$user_id){
    $data = new \stdClass();
    $testSQL = new TestSQL();
    $data->alreadyTaken = $testSQL->quiz_already_taken($page_id,$user_id);
    $data->alreadyTaken = $data->alreadyTaken?$data->alreadyTaken->id:false;
    returnData($data);
}
function main($uri,$user_id){
    global $PATHS, $DB;
    $action = get_action('/quizlist/',$uri);
    $input = get_input();
    if($action=='list') get_quiz_list($input->search);
    if($action=='already-taken') already_taken($input->page_id,$user_id);
}

$uri = strtok($_SERVER['REQUEST_URI'], '?');
if (substr($uri,0,9)=='/quizlist') {
    main($uri,$user_id);
}
?>