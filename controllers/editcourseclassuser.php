<?php
require_once('_utils.php');
require_once('sql.php');
require_once('usertools/orm.php');
use English3\Controller\GradebookController;
use English3\Controller\PowerSchoolController;
use English3\Controller\SiteController;
use English3\Controller\UserController;
use English3\Controller\Utility;
global $PATHS, $DB;
$util = new Utility();

$uri = strtok($_SERVER['REQUEST_URI'], '?');

$uri = str_replace('/editcourseclassuser/', '', $uri);

$action = strtok($uri, '/');

if($action == 'save') {
	$user_id = is_valid_user($_SESSION,true);


	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$data = new \stdClass();
			$users=array();

			if(isset($input->users) ){
				$users=$input->users;
			}else{
				$users[]=$input;
			}
			foreach($users as $user){
				$class_id = intval($user->class_id);
				$util->checkTeacher($class_id);
				$user_id = intval($user->user_id);

				$query = "SELECT organizations.id FROM classes JOIN courses ON (classes.courseid=courses.id) JOIN departments ON (departments.id=courses.departmentid) JOIN organizations ON (organizations.id=departments.organizationid) JOIN users ON (users.organizationid=organizations.id) WHERE classes.id={$class_id} AND users.id={$user_id} AND users.is_active=1";

				$result = $DB->mysqli->query($query);

				$data->query = $query;
				//allowing cross org enrollment
				if (true) {
//				if ($result && $result->num_rows == 1) {
//						$is_student = 1;
//						$is_teacher = 0;
//
//						if ($user->type == 'teacher') {
//							$is_student = 0;
//							$is_teacher = 1;
//						}
//						$is_edit_teacher = 0;
//						if ($input->is_content_editor) {
//							$is_edit_teacher = 1;
//						}
					$is_teacher=0;
					$is_student=0;
					$is_edit_teacher=0;
					$is_observer=0;
					if(isset($user->is_student)){
						$is_student = $user->is_student?'1':0;
					}
					if(isset($user->is_observer)){
						$is_observer = $user->is_observer?'1':0;
					}
					if(isset($user->is_teacher)){
						$is_teacher = $user->is_teacher?'1':0;
					}
					if(isset($user->is_edit_teacher)){
						$is_edit_teacher = $user->is_edit_teacher?'1':0;
					}

					$group_id = $user->group_id?$user->group_id:'null';



					$query = "INSERT INTO user_classes(userid, classid, is_student, is_teacher, is_edit_teacher,is_observer,groupid)
						VALUES
						({$user_id}, {$class_id},  {$is_student}, {$is_teacher} , {$is_edit_teacher},{$is_observer},{$group_id})";

					$DB->mysqli->query($query);

					$data->message = 'successful';
					$data->query = $query;
				}
			}
			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}

}
else if ($action == 'getavailableusers') {
	$user_id = is_valid_user($_SESSION,true);


	$data = new \stdClass();

	if($_SERVER['REQUEST_METHOD'] == 'POST') {

			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$class_id = intval($input->class_id);
			$util->checkTeacher($class_id);
			$group_id = intval(@$input->group_id);

			$data->users = array();

			#$query = "SELECT users.id FROM users JOIN user_classes ON (users.id=user_classes.userid) WHERE user_classes.classid={$class_id}";
			$orm = new PmOrm($_SESSION,$DB);
			if($orm->am_i_super_user()&&isset($input->all_users)){
				$query= "SELECT classes.name, users.id, users.fname, users.lname, users.email,organizations.name as org_name,organizations.id as org_id,
						is_student,is_teacher,is_edit_teacher,is_observer,groupid  FROM classes
						JOIN courses ON (classes.courseid=courses.id)
						JOIN departments ON (courses.departmentid=departments.id)
                        LEFT JOIN users ON (1=1)
						JOIN organizations ON (organizations.id=users.organizationid)
						LEFT JOIN user_classes ON (users.id = user_classes.userid and user_classes.classid=classes.id)
						WHERE classes.id={$class_id} AND users.is_active=1

				";
			}
			else{
				$query = "SELECT classes.name, users.id, users.fname, users.lname, users.email,
						is_student,is_teacher,is_edit_teacher,is_observer,groupid  FROM classes
						JOIN courses ON (classes.courseid=courses.id)
						JOIN departments ON (courses.departmentid=departments.id)
						JOIN organizations ON (organizations.id=departments.organizationid)
						left JOIN users ON (1=1)
						LEFT JOIN user_classes ON (users.id = user_classes.userid and user_classes.classid=classes.id)
						WHERE classes.id={$class_id} AND users.is_active=1 and (users.organizationid=departments.organizationid or user_classes.id is not null)";
			}

			$result = $DB->mysqli->query($query);
			if($result && $result->num_rows > 0) {
				$data->query = $query;
				while($row = $result->fetch_object()) {
					if($group_id){
						$row->is_enrolled=($row->groupid==$group_id) && ($row->is_teacher||$row->is_edit_teacher||$row->is_student||$row->is_observer);
					}
					else{
						$row->is_enrolled=$row->is_teacher||$row->is_edit_teacher||$row->is_student||$row->is_observer;
					}
					if(!isset($data->users[$row->id]) || $row->is_enrolled)
						$data->users[$row->id] = clone $row;
				}
			}
			$data->users = array_values($data->users);
//				if($result && $result->num_rows > 0) {
//					$user_ids = array();
//
//					while($row = $result->fetch_object()) {
//						$user_ids[] = $row->id;
//					}
//
//					$user_str_id = implode(',', $user_ids);
//
//					$user_str_id = '(' . $user_str_id . ')';
//
//
//					$query = "SELECT classes.name, users.id, users.fname, users.lname, users.email FROM classes JOIN courses ON (classes.courseid=courses.id) JOIN departments ON (courses.departmentid=departments.id) JOIN organizations ON (organizations.id=departments.organizationid) JOIN users ON (users.organizationid=organizations.id) WHERE classes.id={$class_id} AND users.is_active=1 AND users.id NOT IN $user_str_id";
//
//					$result = $DB->mysqli->query($query);
//
//					$data->query = $query;
//
//					if($result && $result->num_rows > 0) {
//						while($row = $result->fetch_object()) {
//							$data->users[] = clone $row;
//						}
//					}
// 				} else {
//					$query = "SELECT classes.name, users.id, users.fname, users.lname, users.email FROM classes JOIN courses ON (classes.courseid=courses.id) JOIN departments ON (courses.departmentid=departments.id) JOIN organizations ON (organizations.id=departments.organizationid) JOIN users ON (users.organizationid=organizations.id) WHERE classes.id={$class_id} AND users.is_active=1";
//
//					$result = $DB->mysqli->query($query);
//
//					$data->query = $query;
//
//					if($result && $result->num_rows > 0) {
//						while($row = $result->fetch_object()) {
//							$data->users[] = clone $row;
//						}
//					}
//				}
		}

	header('Content-Type: application/json');
	print json_encode($data);
	exit();

}
else if ($action == 'userinformation') {
	$user_id = is_valid_user($_SESSION,true);


	$data = new \stdClass();
	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

			$input = json_decode($json_input);

			$class_id = intval($input->class_id);
			$util->checkTeacher($class_id);
			$user_id = intval($input->user_id);

			$group_id = (isset($input->group_id) && $input->group_id)?$input->group_id:'null';

			$query = "SELECT users.id,users.fname,users.lname,users.email,users.gender,
							user_classes.is_student,user_classes.is_teacher,user_classes.is_edit_teacher,is_observer,
							user_classes.created as startDate, user_classes.date_left as endDate,
							user_classes.manual_end_date,user_classes.manual_start_date,user_classes.manual_attendance_start_date,user_classes.manual_expected_end_date,
							user_classes.finished_the_class AS finished_class, classes.id,classes.name,user_classes.final_score

							FROM users
							JOIN user_classes ON (users.id=user_classes.userid)
							 JOIN classes on classes.id=user_classes.classid

						WHERE user_classes.classid={$class_id} and users.id={$user_id}";

			if($group_id!='null'){
				$query.= " and user_classes.groupid=$group_id";
			}

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows > 0) {
				$row = $result->fetch_object();
				$util = new Utility();
				$data->user = new \stdClass();



				$row->finished_class=boolval($row->finished_class);
				$data->user=clone $row;
				$data->user->expectedEndDate = \English3\Controller\ClassesController::_getExpectedDate($user_id,$class_id,true);
				//getSite
				$siteId = SiteController::_getUserSite($user_id);
				if($siteId){
					$data->user->site = SiteController::_get($util->reader,$siteId);
				}

					$advisors = UserController::_getAdvisors($user_id);
				if(count($advisors)){
					$data->user->advisors = $advisors;
				}
			}
		}

	header('Content-Type: application/json');
	print json_encode($data);
	exit();

}
else if($action == 'update') {
	$user_id = is_valid_user($_SESSION,true);


	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$data = new \stdClass();


			$class_id = intval($input->class_id);
			$util->checkTeacher($class_id);
			$user_id = intval($input->user_id);

			$query = "SELECT organizations.id FROM classes JOIN courses ON (classes.courseid=courses.id) JOIN departments ON (departments.id=courses.departmentid) JOIN organizations ON (organizations.id=departments.organizationid) JOIN users ON (users.organizationid=organizations.id) WHERE classes.id={$class_id} AND users.id={$user_id} AND users.is_active=1";

			$result = $DB->mysqli->query($query);

			$data->query = $query;
 			//allow cross org enrollment
			if (true){
			//if ($result && $result->num_rows == 1) {

				$is_teacher=0;
				$is_student=0;
				$is_edit_teacher=0;
				$is_suspended=0;
				$is_finished=0;
				$is_observer=0;
				if(isset($input->is_student)){
					$is_student = $input->is_student? 1:0;
				}
				if(isset($input->is_observer)){
					$is_observer = $input->is_observer? 1:0;
				}
				if(isset($input->is_teacher)){
					$is_teacher = $input->is_teacher? 1 : 0;
				}
				if(isset($input->is_edit_teacher)){
					$is_edit_teacher = $input->is_edit_teacher? 1 : 0;
				}
				if(isset($input->is_suspended)){
					$is_suspended = $input->is_suspended? 1 : 0;
				}
				if(isset($input->manual_start_date)){
					$manual_start_date = $input->manual_start_date? "'".$input->manual_start_date."'" : 'null';
				}else{
					$manual_start_date = 'null';
				}
				if(isset($input->manual_expected_end_date)){
					$manual_expected_end_date = $input->manual_expected_end_date? "'".$input->manual_expected_end_date."'" : 'null';
				}else{
					$manual_expected_end_date = 'null';
				}

				if(isset($input->is_finished)){
					$is_finished = $input->is_finished? 1 : 0;
				}
				if(isset($input->unset_final_score)){
					$final_score = $input->unset_final_score? 'null' : ($input->final_score?$input->final_score:'null');
				}

				$group_id = (isset($input->group_id) && $input->group_id)? $input->group_id : 'null';

				if($is_student==0 && $is_teacher==0 && $is_edit_teacher==0 && $is_observer==0){
					\English3\Controller\Classes\UserClassHistory::addToUserClassHistory($user_id,$class_id);
					$query = "DELETE FROM user_classes WHERE userid={$user_id} and classid={$class_id} ";
				}
				else{
					$query= "UPDATE user_classes " .
						"SET is_student={$is_student}, " .
							"is_edit_teacher={$is_edit_teacher}, " .
							"is_teacher={$is_teacher}, " .
							"is_observer={$is_observer}, " .
							"is_suspended={$is_suspended}, " .
							"groupid={$group_id}, " .
							"manual_start_date={$manual_start_date}, " .
							"manual_expected_end_date={$manual_expected_end_date}, " .
							"finished_the_class={$is_finished} ";
					if(isset($final_score)){
						$query.=",final_score={$final_score} ";
					}
					$query.= "WHERE userid={$user_id} and classid={$class_id}";
				}
				if($group_id != 'null'){
					$query.=" and groupid={$group_id}";
				}

				$DB->mysqli->query($query);
				if($DB->mysqli->affected_rows > 0){
					$data->message = 'successful';
					GradebookController::_setRecalculateDueDates($class_id,$user_id);
				}
				else{
					$data->message = 'No changes were made';
				}
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
}
else if($action == 'enrollplacement') {
	if ($_SERVER['REQUEST_METHOD'] == 'POST') {
		$json_input = file_get_contents('php://input');
		$input = json_decode($json_input);
		$user = new PmOrm($_SESSION,$DB);
		$user->set_me($input->userId);
		$util = new Utility();


		if(!isset($input->classes) || count($input->classes)==0){
			$orgId = $user->my_org(false)['id'];
			$class_id = $util->fetchOne("SELECT placement_class_id FROM organizations WHERE id = :orgId",['orgId'=>$orgId]);
			$class = new \stdClass();
			$class->classId = $class_id;
			$classes = [$class];
		}else{
			$classes = $input->classes;
		}

		foreach($classes as $class){
			$class_id = $class->classId;
			$group_id = $class->groupId;
			$entry = $util->fetchOne("SELECT * FROM user_classes where classid={$class_id} and userid={$user->user_id}");
			if(!$entry){
				$util->reader->insert('user_classes',
					[
						'classid'=>$class_id,
						'groupid'=>$group_id,
						'userid'=>$user->user_id,
						'is_student'=>1
					]
			);
			}
			else{
				$util->reader->update('user_classes',
					[
						'is_student'=>1,
						'is_teacher'=>0,
						'is_edit_teacher'=>0,
						'is_observer'=>0,
					],
					[
						'classid'=>$class_id,
						'groupid'=>$group_id,
						'userid'=>$user->user_id
					]
				);
			}
		}
		jsonResponse(['status'=>'success']);
	}
}
else if($action == 'delete') {
	$user_id = is_valid_user($_SESSION,true);
	is_admin_user(0,$DB,true);

	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');
			$input = json_decode($json_input);

			$data = new \stdClass();

			$user_id = intval($input->user_id);
			$class_id = intval($input->class_id);
			\English3\Controller\Classes\UserClassHistory::addToUserClassHistory($user_id,$class_id);
			$query= "delete from  user_classes
							WHERE userid={$user_id} and classid={$class_id}
							";
			$DB->mysqli->query($query);
			if($DB->mysqli->affected_rows>0){
				$data->message='successful';
			}
			else{
				$data->message='User was not enrolled in this class';
			}


			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
}
else if($action == 'upload'){
	$user_id = is_valid_user($_SESSION,true);


	$tmpName = $_FILES['file']['tmp_name'];
    $csvAsArray = array_map('str_getcsv', file($tmpName));

    header('Content-Type: application/json');
    print json_encode($csvAsArray);
    exit();

}
else if(is_numeric($action) && $action > 0) {
	$user_id = is_valid_user($_SESSION,true);


	$action = intval($action);

	$query = "SELECT departments.id, departments.name, departments.subdomain FROM departments WHERE departments.id={$action} LIMIT 1";

	$result = $DB->mysqli->query($query);

	if($result && $result->num_rows == 1) {
		$row = $result->fetch_object();

		$data = new \stdClass();

		$data->department = new \stdClass();

		$data->department = clone $row;

		header('Content-Type: application/json');
		print json_encode($data);
		exit();
	} else {
		$data = new \stdClass();

		header('Content-Type: application/json');
		print json_encode($data);
		exit();
	}
}


?>