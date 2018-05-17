<?php

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;

is_valid_user($_SESSION,true);
$user_id = is_admin_user(0,$DB);

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/editorganization/', '', $uri);

	$action = strtok($uri, '/');

	if($action == 'save') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
			$orm = new PmOrm($_SESSION,$DB);
			if(!$orm->am_i_super_user())
			{
				throwError("You don't have permission to add organizations");
			}
				$json_input = file_get_contents('php://input');

              	       $input = json_decode($json_input);

				$data = new \stdClass();

				$mysql_name   = $DB->mysqli->real_escape_string($input->name);
				$mysql_domain = $DB->mysqli->real_escape_string($input->domain);
				$mysql_email  = $DB->mysqli->real_escape_string($input->email);
				$mysql_phone  = $DB->mysqli->real_escape_string($input->phone);
	
				if(strlen($mysql_name) > 0) {
					$query = "INSERT INTO organizations(name, domain, email, phone, is_active) VALUES('{$mysql_name}', '{$mysql_domain}', '{$mysql_email}', '{$mysql_phone}', 1)";

					$DB->mysqli->query($query);	

					$data->message = 'successful';
	                     	$data->query = $query;
				} else {
					$data->message = 'Organization Name Must Not Be Empty';
				}

				header('Content-Type: application/json');
				print json_encode($data);
				exit();
			}
	} else if($action == 'update') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
				$json_input = file_get_contents('php://input');

              	       $input = json_decode($json_input);

				$data = new \stdClass();

				$organization_id = intval($input->id);
				$mysql_name   = $DB->mysqli->real_escape_string($input->name);
				$mysql_domain = $DB->mysqli->real_escape_string($input->domain);
				$mysql_email  = $DB->mysqli->real_escape_string($input->email);
				$mysql_phone  = $DB->mysqli->real_escape_string($input->phone);
				$mysql_page_type_permissions = intval($input->page_type_permissions);

				$mysql_placement_class_id = isset($input->placement_class_id)?intval($input->placement_class_id):'null';
				$mysql_white_label = intval($input->white_label)?intval($input->white_label):'null';
				$mysql_use_splash = intval($input->use_splash)?intval($input->use_splash):'null';
				$mysql_session_time = intval($input->session_time)?intval($input->session_time):'20';
				$mysql_logo = isset($input->logo)?"'{$input->logo}'":'null';


				if(strlen($mysql_name) > 0) {
					$query = "UPDATE organizations SET name='{$mysql_name}',
								domain='{$mysql_domain}',
								email='{$mysql_email}',
								phone='{$mysql_phone}',
								page_type_permissions = {$mysql_page_type_permissions},
								placement_class_id={$mysql_placement_class_id},
								logo={$mysql_logo},
								white_label={$mysql_white_label},
								use_splash={$mysql_use_splash},
								session_time={$mysql_session_time}
								WHERE id={$organization_id}";

					$DB->mysqli->query($query);

			
					$data->message = 'successful';
		                     $data->query = $query;
				} else {
					$data->message = 'Organization Name Must Not Be Empty';
		                     $data->query = $query;
				}

				header('Content-Type: application/json');
				print json_encode($data);
				exit();
			}
	} else if($action == 'delete') {
		if($_SERVER['REQUEST_METHOD'] == 'POST') {
				$json_input = file_get_contents('php://input');

              	       $input = json_decode($json_input);

				$data = new \stdClass();

				$organization_id = intval($input->id);

				$query = "SELECT departments.id FROM departments WHERE organizationid={$organization_id} LIMIT 1";

				$result = $DB->mysqli->query($query);

				if($result && $result->num_rows == 0) {
					$query = "DELETE FROM organizations WHERE id={$organization_id}";

					$DB->mysqli->query($query);

					$data->message = 'successful';
					$data->query = $query;
				} else {
					$data->message = 'Could Not Delete Organization. There Are Departments Associated With This Organization. Please Delete The Departments Before Deleting The Organization.';
				}
				

				header('Content-Type: application/json');
				print json_encode($data);
				exit();
			}
	} else if(is_numeric($action) && $action > 0) {
		$action = intval($action);
		$user_id = intval($_SESSION['USER']['ID']);

		$query = "SELECT organizations.id, organizations.name, organizations.domain, organizations.email, organizations.phone,
					organizations.page_type_permissions,organizations.placement_class_id,organizations.logo,
					 organizations.white_label,organizations.use_splash,organizations.session_time,organizations.sort_users_by
					FROM organizations
					WHERE organizations.id={$action} LIMIT 1";

		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {
			$row = $result->fetch_object();

			$data = new \stdClass();

			$data->organization = new \stdClass();

			$data->organization = clone $row;

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

}

?>