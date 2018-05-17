<?php

require_once'_utils.php';
require_once ('usertools/orm.php');
require_once('sql.php');
global $PATHS, $DB;
$user_id = is_valid_user($_SESSION,true);



class CourseClass {
	public $DB;
	public $user_id;

	function __construct($db,$user_id) {
		$this->DB=$db;
		$this->user_id=$user_id;
	}

	public function get($department_id){
		$DB = $this->DB;
		$data = new \stdClass();
		$data->classes = array();
		if($department_id > 0) {

			$query = "SELECT classes.id, courses.name as 'course_name', classes.name, classes.is_active,
						terms.id as term_id,terms.name as term_name,if(terms.id is null,0,1) as has_term,
						terms.start_date as term_start_date,terms.end_date as term_end_date,
						groups.id as group_id,groups.name as group_name
				FROM classes
				JOIN courses ON (courses.id=classes.courseid)
				 JOIN departments ON departments.id=courses.departmentid
				 LEFT JOIN terms on classes.term_id = terms.id
				 LEFT JOIN groups on groups.classid = classes.id
				WHERE departments.id={$department_id} AND courses.is_active=1 ORDER BY classes.name ASC";


			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					if(!isset($data->classes[$row->id])){
						$data->classes[$row->id] = clone $row;
						$data->classes[$row->id]->groups=array();
					}
					if($row->group_id){
						$data->classes[$row->id]->groups[]=array(
							'id'=>$row->group_id,
							'name'=>$row->group_name,
						);
					}
				}
			}
			$data->classes = array_values($data->classes);
		}
		header('Content-Type: application/json');

		print json_encode($data);

	}
	public function teachers($input){

		$sql = new BaseSQL();
		$courseId = $_REQUEST['courseId'];
		$query = "SELECT users.id,users.fname,users.lname,users.phone,users.email
					FROM user_classes uc
					JOIN classes on uc.classid=classes.id
					LEFT JOIN users on users.id = uc.userid
					WHERE courseid={$courseId} and uc.is_teacher=1";
		$teachers = \English3\Controller\Utility::getInstance()->fetch($query);
		foreach ($teachers as &$teacher){
            $teacher['meta'] = \English3\Controller\UserMetaController::get($teacher['id']);

        }
		jsonResponse(['teachers'=>$teachers]);
	}
	public function terms($input){
		$DB = $this->DB;
		$department_id = $input->departmentId;

		$data = new \stdClass();
		$data->terms = array();

//		$query = "SELECT DISTINCT	terms.id, terms.name, terms.start_date, terms.end_date
// 					FROM terms
// 					JOIN classes on terms.id = classes.term_id
// 					JOIN courses on courses.id = classes.courseid
// 					JOIN departments on departments.id = courses.departmentid
// 					WHERE departments.id = {$department_id}";
		$query = "SELECT terms.id, terms.name, terms.start_date, terms.end_date FROM terms";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows > 0) {
			while($row = $result->fetch_object()) {
				$data->terms[] = clone $row;
			}
		}
		header('Content-Type: application/json');

		print json_encode($data);
	}
}

function main($uri,$user_id){
	global $DB;
	$action = get_action('/courseclass/',$uri);
	$courseClass = new CourseClass($DB,$user_id);

	if(is_numeric($action) && $action > 0){
		$courseClass->get($action);
	}
	else if ($action == 'terms'){
		$courseClass->terms(get_input());
	}
	else if ($action == 'teachers'){
		$courseClass->teachers(get_input());
	}

}


$uri = strtok($_SERVER['REQUEST_URI'], '?');
if (substr($uri,0,12)=='/courseclass'){
	main($uri,$user_id);
}





?>