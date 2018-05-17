<?php

global $PATHS, $DB, $SECURITY;
use English3\Controller\ProficiencyTest\TestAttempts;
use English3\Controller\UserController;
use English3\Controller\Utility;

@session_start();
require_once('sql.php');
$uri = strtok($_SERVER['REQUEST_URI'], '?');
$uri = str_replace('/signin/', '', $uri);
$action = strtok($uri, '/');
if(array_key_exists('HTTP_RAW_POST_DATA', $GLOBALS) && $GLOBALS['HTTP_RAW_POST_DATA']!=''){
	$_POST=json_decode($GLOBALS['HTTP_RAW_POST_DATA'],true);
}
function hardCodedHideSplash($userId){
	$hardCodedPlacementClass = 871;
	$isEnrolledToPlacementClass = boolval(
		Utility::getInstance()->fetchOne(
			"SELECT id FROM user_classes WHERE userid = :userId and classid = :classId",
			[
				'userId'=>$userId,
				'classId'=>$hardCodedPlacementClass
			]
		)
	);
	return $isEnrolledToPlacementClass;
}
function validateLicense($userid){
	$sql = new BaseSQL();
	$query = "SELECT users.expiration_date as expiry_date,type,duration FROM users left JOIN licenses on users.id = licenses.user_id where users.id = {$userid} order by activated desc limit 1";
	$license = $sql->fetch_one($query);
	if($license){
		if($license->type='hours'){
			$totaltime = $sql->fetch_one("SELECT total_time from user_sessions where userid = {$userid}");
			if($totaltime && $totaltime->total_time>$license->duration*3600){
				return 1;
			}
			else{
				return 0;
			}
		}
		if (new DateTime($license->expiry_date) < new DateTime()) {
			return 1;
		}
		else {
			return 0;
		}

	}
	return 2;
}
if($action=='validateLicense'){
	if(isset($_SESSION['TMP_USER'])){
		if(validateLicense($_SESSION['TMP_USER']['ID'])==0){
			$_SESSION['USER']=$_SESSION['TMP_USER'];
			$_SESSION['USER']['LOGGED_IN']=true;
			$_SESSION['CREATED']=time();
			unset($_SESSION['TMP_USER']);
			header('Content-Type: application/json');
			print json_encode(['status'=>'success']);
			exit();
		}
		else{
			header('Content-Type: application/json');
			print json_encode(['status'=>'error']);
			exit();
		}
	}
}
if($action=='isTempPassword'){
	header('Content-Type: application/json');
	$data = new \stdCLass();
	if(isset($_SESSION['TMP_USER'])){
		if(validateLicense($_SESSION['TMP_USER']['ID'])!=0){
			$data->licenseExpired=true;
			$data->userid = $_SESSION['TMP_USER']['ID'];
		}
		else{
			unset($_SESSION['TMP_USER']);
			$data->tempPassword=false;
		}
	}
	else if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true && isset($_SESSION['USER']['TEMP_PWD']) && $_SESSION['USER']['TEMP_PWD']) {
		$data->tempPassword=true;
		if(isset($_SESSION['USER']['PWD_EXPIRED'])){
			$data->pwd_expired=true;
		}
	}
	else{
		$data->tempPassword=false;
	}
	print json_encode($data);
	exit();
}
if($action == 'update'){
	header('Content-Type: application/json');
	/*
	 * error codes:
	 * 0 - Success
	 * 1 - User not logged in
	 * 2 - Temporary password already changed
	 * 3 - Invalid password
	 * 4 - Unexpected
	 */
	$data = new \stdCLass();
	$data->error=4;
	if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {

		if(isset($_SESSION['USER']['TEMP_PWD']) && $_SESSION['USER']['TEMP_PWD']){
			$input = json_decode(file_get_contents('php://input'));
			//$input = json_decode($HTTP_RAW_POST_DATA);
			if(isset($input->password) && strlen($input->password) > 0) {
				$user_id = $_SESSION['USER']['ID'];
				if(isset($_SESSION['USER']['PWD_EXPIRED'])){
					UserController::updatePasswordExpiration($user_id,$input->password);
					unset($_SESSION['USER']['TEMP_PWD']);
					unset($_SESSION['USER']['PWD_EXPIRED']);
					$data->error=0;
				}
				else{
					$query = "SELECT salt_for_password FROM users WHERE id={$user_id} LIMIT 1";

					if($result = $DB->mysqli->query($query)) {

						if ($result->num_rows == 1) {

							$row = $result->fetch_object();
							$new_md5_password = md5($SECURITY->salt . $row->salt_for_password . $input->password);
							$query = "update users set password = '{$new_md5_password}' where id={$user_id}";
							$DB->mysqli->query($query);


							unset($_SESSION['USER']['TEMP_PWD']);

							$data->error=0;
						}
					}
				}


			}
		}
		else{
			$data->error=2;
		}
	}
	else{
		$data->error=1;
	}
	print json_encode($data);
	exit();
}
if(isset($_POST['username']) && strlen($_POST['username']) > 0) {
	$error = "";
	if(isset($_POST['password']) && strlen($_POST['password']) > 0) {
		$mysql_username = $DB->mysqli->real_escape_string($_POST['username']);
		//We may have users using more than one email
		//this regular expression looks for:
		// - email
		// - followed by zero or more white spaces
		// - followed by comma, semicolon, forward slash or end of string
		$emailRegex = "({$mysql_username})[[:space:]]*(,|$|\/|;)";
		$query = "SELECT salt_for_password FROM users WHERE email REGEXP '{$emailRegex}' order by id desc LIMIT 1";

		if($result = $DB->mysqli->query($query)) {
			if($result->num_rows == 1) {
				$row = $result->fetch_object();

				$md5_password = md5($SECURITY->salt . $row->salt_for_password . $_POST['password']);

				$query = "SELECT users.id,users.organizationid, fname, lname, users.is_active,use_license,expiration_date,organizations.use_splash,
							organizations.enable_password_expiration,users.password_expires_on
							FROM users
							 JOIN organizations on users.organizationid = organizations.id
							WHERE users.email REGEXP '{$emailRegex}' AND password='{$md5_password}'
							order by users.id desc
							LIMIT 1";

				if($result = $DB->mysqli->query($query)) {
					if($result->num_rows == 1) {
						$row = $result->fetch_object();

						$_SESSION['USER'] = array();
						$sql = new BaseSQL();
						if($row->is_active) {
							$usePasswordExpiration=boolval(@$row->enable_password_expiration);
							$passwordExpirationDate = new \DateTime(@$row->password_expires_on);
							if(!$row->use_license && $row->expiration_date && new DateTime($row->expiration_date) < new DateTime()){
								header("Location: https://" . $_SERVER['HTTP_HOST'] . "/?error=Your_user_account_has_expired._Please_contact_your_system_administrator." , 303);
								exit();
							}

							if ($row->use_license) {

								$query = "SELECT users.expiration_date as expiry_date,type,duration FROM users left JOIN licenses on users.id = licenses.user_id where users.id = {$row->id} order by activated desc limit 1";
								$license = $sql->fetch_one($query);
								if($license->expiry_date || $license->type ){
									if($license->type=='hours'){
										$totaltime = $sql->fetch_one("SELECT total_time from user_sessions where userid = {$row->id}");
										if($totaltime && $totaltime->total_time>$license->duration*3600){
											$error='license_expired';
											$_SESSION['TMP_USER']['ID'] = $row->id;
											$_SESSION['TMP_USER']['FNAME'] = $row->fname;
											$_SESSION['TMP_USER']['LNAME'] = $row->lname;
											$_SESSION['TMP_USER']['EMAIL'] = $_POST['username'];
											header("Location: https://" . $_SERVER['HTTP_HOST']  , 303);
											exit();
										}
									}
									else if (new DateTime($license->expiry_date) < new DateTime()) {
										$error='license_expired';
										$_SESSION['TMP_USER']['ID'] = $row->id;
										$_SESSION['TMP_USER']['FNAME'] = $row->fname;
										$_SESSION['TMP_USER']['LNAME'] = $row->lname;
										$_SESSION['TMP_USER']['EMAIL'] = $_POST['username'];
										header("Location: https://" . $_SERVER['HTTP_HOST'] , 303);
										exit();
									}
								} else{
									$error = "license_needed";
									$_SESSION['TMP_USER']['ID'] = $row->id;
									$_SESSION['TMP_USER']['FNAME'] = $row->fname;
									$_SESSION['TMP_USER']['LNAME'] = $row->lname;
									$_SESSION['TMP_USER']['EMAIL'] = $_POST['username'];
									header("Location: https://" . $_SERVER['HTTP_HOST'], 303);
									exit();
								}

							}
							if (!$error){
								$_SESSION['USER']['LOGGED_IN'] = true;
								$_SESSION['USER']['ID'] = $row->id;
								$_SESSION['USER']['ORGID'] = $row->organizationid;
								$_SESSION['USER']['FNAME'] = $row->fname;
								$_SESSION['USER']['LNAME'] = $row->lname;
								$_SESSION['USER']['EMAIL'] = $_POST['username'];
								$_SESSION['CREATED']=time();
								\English3\Controller\ProficiencyTest\PaymentReceived::handleNewUserLogin($_SESSION['USER']['ID']);
								\English3\Controller\SessionController::updateSessionStart();

								if(isset($totaltime) && $totaltime){
									$_SESSION['USER']['TOTALTIME']=$totaltime->total_time;
								}

								$query = "UPDATE users SET is_logged_in=1 WHERE id='{$row->id}'";

								$DB->mysqli->query($query);
								/*
								 * DSerejo 2015-01-31
								 * Change temporary password
								 */
								if(!UserController::checkPasswordExpiration($_SESSION['USER']['ID'])){
									$_SESSION['USER']['TEMP_PWD'] = true;
									$_SESSION['USER']['PWD_EXPIRED'] = true;
								}
								if (substr($_POST['password'], 0, 6) == '$temp$') {
									$_SESSION['USER']['TEMP_PWD'] = true;
								}

								if($row->use_splash==1 &&
									!isset($_SESSION['USER']['TEMP_PWD']) &&
									!hardCodedHideSplash($row->id) &&
									!TestAttempts::takeDirectlyToCourseView()
								){
									header("Location: https://" . $_SERVER['HTTP_HOST'] . "/home", 303);
								}else{
									header("Location: https://" . $_SERVER['HTTP_HOST'] . "/", 303);
								}


								exit();
							}
						}
						else{
							$error="Your_account_has_been_locked";
						}
					} else {
						$error = "Invalid_Password";
					}
				} else {
					$error = "Database_Error";
				}
			} else {
				$error = "Invalid_Username";
			}
		} else {
			$error = "Database_Error";
		}
	} else {
		$error = "Please_Provide_Password";
	}

	header("Location: https://" . $_SERVER['HTTP_HOST'] . "/?error=" . $error, 303);
	exit();
} else if(isset($_POST['password']) && strlen($_POST['password']) > 0) {
	header("Location: https://" . $_SERVER['HTTP_HOST'] . "/?error=Please_Provide_Username", 303);
	exit();
}

header("Location: https://" . $_SERVER['HTTP_HOST'] . "/?error=Please_Provide_Username_And_Password", 303);
exit();

?>
