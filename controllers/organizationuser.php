<?php

use English3\Controller\Utility;

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;

$user_id = is_valid_user($_SESSION,true);
$util = new Utility();

$uri = strtok($_SERVER['REQUEST_URI'], '?');

$uri = str_replace('/organizationuser/', '', $uri);

$uri = strtok($uri, '/');

$organization_id = intval($uri);

if($uri=='classusers') {
	$data = new \stdClass();

	$data->users = array();

	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$data = new \stdClass();

			$class_id = intval($input->class_id);
			$util->checkTeacher($class_id);
			if (isset($input->group_id)){
			$group_id = intval($input->group_id);
				$groupFilter="groupid={$group_id}";
			}
			else{
				$groupFilter="1";
			}

			$query = "SELECT users.id, classes.name as 'class_name',groups.id as group_id,groups.name as 'group_name', classes.id as 'class_id', users.fname, users.lname, users.email, users.is_active, users.created, user_classes.is_student, user_classes.is_teacher,user_classes.is_edit_teacher,user_classes.is_suspended,finished_the_class,is_observer FROM users JOIN user_classes ON (user_classes.userid=users.id) 
                JOIN classes ON (user_classes.classid=classes.id)
                left join groups on user_classes.groupid = groups.id
 				WHERE classes.id={$class_id} and (is_student or is_teacher or is_edit_teacher or is_observer) and {$groupFilter}
 				 ORDER BY users.lname ASC";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows > 0) {
				while($row = $result->fetch_object()) {
					$temp = clone $row;
					$temp->is_suspended=$temp->is_suspended==1;
					$temp->is_finished=$temp->finished_the_class==1;
					$temp->type = 'Student';

					if($row->is_teacher == 1) {
						$temp->type = 'Teacher';
					}

					$data->users[] = clone $temp;
				}
			}
		}

	header('Content-Type: application/json');

	print json_encode($data);

} else if($organization_id > 0) {
	$data = new \stdClass();

	$util->checkAdmin($organization_id);
	$data->users = array();

	$query = "SELECT users.id, organizations.name as 'organization_name', users.fname, users.lname, users.email, users.is_active, users.created FROM users JOIN organizations ON (organizations.id=users.organizationid) WHERE organizations.id={$organization_id} AND organizations.is_active=1 ORDER BY users.lname ASC";

	$result = $DB->mysqli->query($query);

	if($result && $result->num_rows > 0) {
		while($row = $result->fetch_object()) {
			$data->users[] = clone $row;
		}
	}

	header('Content-Type: application/json');

	print json_encode($data);
}


?>