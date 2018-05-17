<?php
require_once('usertools/orm.php');
require_once('sql.php');
require_once('_utils.php');

function page_entered($input){
    global $DB;
    $user = new PmOrm($_SESSION,$DB);
    $historySQL = new HistorySQL();
    validate_id($input->page_id,"Invalid page_id");
    $historySQL->page_entered($input->page_id,$user->user_id);
    exit();
}
function page_leaved($input){
    global $DB;
    $user = new PmOrm($_SESSION,$DB);
    $historySQL = new HistorySQL();
    validate_id($input->page_id,"Invalid page_id");
    $h_id = $historySQL->last_access($input->page_id,$user->user_id);
    $historySQL->page_leaved($h_id->id);
    exit();
}
function convertTimeCode($code){
    $date = new DateTime();
    $date->sub(new DateInterval('P'.$code));
    return " AND ##column## > '". $date->format('Y-m-d') ."'";
}
function convertTimeRange($start,$end){
    return " AND ##column## >= '". $start ."'" . " AND ##column## <= '". $end ." 23:59:00'";
}
function getStudentClasses($id,$classSQL){
    $classes = $classSQL->get_for_student_v2($id);
    $ids = array();
    foreach($classes as $class){
        $ids[]=$class->id;
    }
    return $ids;

}
function connectToDB_() {
    global $DB;

    $mysqli = new mysqli($DB->host, $DB->user, $DB->password, $DB->database);

    if ($mysqli->connect_errno) {
        errorTechnical("Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error);
        exit();
    }

    /* change character set to utf8 */
    if (!$mysqli->set_charset("utf8")) {
        errorTechnical("Failed to connect to MySQL: " . $mysqli->error);
        exit();
    }

    return $mysqli;
}
function cmp($a, $b)
{
    return strcmp($a->time_in, $b->time_in);
}



function classHistoryForUser($input,$echo=true){
    global $DB;
    if(!isset($DB->mysqli)){
        $DB->mysqli=connectToDB_();
    }
    $historySQL = new HistorySQL();
    $classSQL = new ClassSQL();
    if($input->user_id=='me') $input->user_id = $_SESSION['USER']['ID'];

    validate_id($input->user_id,"Invalid user_id");

    if($input->class_id>0){
        $classes = array($input->class_id);
    }
    else{
        $classes = getStudentClasses($input->user_id,$classSQL);
    }
    $data = new \stdClass();
    $data->classes = array();
    $granTotal=0;
    foreach($classes as $class_id){
        $filter = "";
        if(isset($input->time) and $input->time != 'all') $filter = convertTimeCode($input->time);
        if(isset($input->range)) {
            $filter = convertTimeRange($input->range->start,$input->range->end);
        }

        $history = $historySQL->classHistoryForUser($input->user_id,$class_id,$filter);
        $post_history = $historySQL->classPostHistoryForUser($input->user_id,$class_id,$filter);
        $grade_history = $historySQL->classGradeHistoryForUser($input->user_id,$class_id,$filter);
        $quiz_history = $historySQL->classQuizHistoryForUser($input->user_id,$class_id,$filter);

        $classInfo = $classSQL->get_by_id($class_id);
        $class = array(
            'name'=>$classInfo->name,
            'id'=>$classInfo->id,
            'history'=> array_merge($history,$post_history,$grade_history,$quiz_history)
        );
        usort($class['history'],"cmp");
        $total = 0;
        foreach($history as $row){
            $total+=intval($row->timeSpent);
        }
        $class['totalTime']=$total;
        $granTotal+=$total;
        $data->classes[]=$class;
    }
    $data->totalTime=$granTotal;
    if($echo){
        returnData($data);
    }
    else{
        return $data;
    }
}
function main($uri){
    global $PATHS, $DB;
    $action = get_action('/history/',$uri);
    $input = get_input();
    if($action=='page-entered') page_entered($input);
    if($action=='page-leaved') page_leaved($input);
    if($action=='user-class-history') classHistoryForUser($input);
}

$uri = strtok($_SERVER['REQUEST_URI'], '?');
if (substr($uri,0,8)=='/history') {
    main($uri);
}
?>