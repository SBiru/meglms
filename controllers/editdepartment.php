<?php

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;

is_valid_user($_SESSION,true);
$user_id = is_admin_user(0,$DB,true);

$uri = strtok($_SERVER['REQUEST_URI'], '?');

$uri = str_replace('/editdepartment/', '', $uri);

$action = strtok($uri, '/');

if($action == 'save') {
	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$data = new \stdClass();

			$organization_id = intval($input->organization_id);

			$query = "SELECT id FROM organizations WHERE id={$organization_id}";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows == 1) {
				$mysql_name   = $DB->mysqli->real_escape_string($input->name);
				$mysql_domain = $DB->mysqli->real_escape_string($input->domain);

				if(strlen($mysql_name) > 0) {
					$query = "INSERT INTO departments(organizationid, name, subdomain, is_active) VALUES($organization_id, '{$mysql_name}', '{$mysql_domain}', 1)";

					$DB->mysqli->query($query);

					$data->message = 'successful';
							$data->query = $query;
				} else {
					$data->message = 'Department Name Must Not Be Empty';
				}

				header('Content-Type: application/json');
				print json_encode($data);
				exit();
			}
		}
}
else if($action == 'update') {
	if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$data = new \stdClass();

			$department_id = intval($input->id);
			$mysql_name   = $DB->mysqli->real_escape_string($input->name);
			$mysql_domain = $DB->mysqli->real_escape_string($input->domain);

			if(strlen($mysql_name) > 0) {
				$query = "UPDATE departments SET name='{$mysql_name}', subdomain='{$mysql_domain}' WHERE id={$department_id}";

				$DB->mysqli->query($query);

				$data->message = 'successful';
						 $data->query = $query;
			} else {
				$data->message = 'Department Name Must Not Be Empty';
						 $data->query = $query;
			}

			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
}
else if($action == 'delete') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$json_input = file_get_contents('php://input');

				   $input = json_decode($json_input);

			$data = new \stdClass();

			$department_id = intval($input->id);

			$query = "SELECT courses.id FROM courses WHERE departmentid={$department_id} LIMIT 1";

			$result = $DB->mysqli->query($query);

			if($result && $result->num_rows == 0) {
				$query = "DELETE FROM departments WHERE id={$department_id}";

				$DB->mysqli->query($query);

				$data->message = 'successful';
				$data->query = $query;
			} else {
				$data->message = 'Could Not Delete Department. There Are Courses Associated With This Department. Please Delete The Courses Before Deleting The Department.';
			}


			header('Content-Type: application/json');
			print json_encode($data);
			exit();
		}
}

else if(is_numeric($action) && $action > 0) {
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