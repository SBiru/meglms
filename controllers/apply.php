<?php

global $PATHS, $DB, $SECURITY;

function generateSalt($length) {
	$salt = '';

	$tokens = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '&', '*');

	$token_length = count($tokens) - 1;

	for($i = 0; $i < $length; $i++) {
		$salt .= $tokens[mt_rand(0, $token_length)];
	}

	return $salt;
}

function generatePassword($length) {
	$password = '';

	$tokens = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', '3', '4', '5', '6', '7', '9');

	$token_length = count($tokens) - 1;

	for($i = 0; $i < $length; $i++) {
		$password .= $tokens[mt_rand(0, $token_length)];
	}

	return $password;
}

if(isset($_POST['fname'])) {
	if(isset($_POST['fname']) && strlen($_POST['fname']) > 0) {
		if(isset($_POST['lname']) && strlen($_POST['lname']) > 0) {
			if(isset($_POST['email']) && strlen($_POST['email']) > 0 && filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
				$mysql_email = $DB->mysqli->real_escape_string($_POST['email']);

				$query = "SELECT id FROM users WHERE email='{$mysql_email}' LIMIT 1";

				if($result = $DB->mysqli->query($query) && $result->num_rows == 0) {
					$mysql_fname    = $DB->mysqli->real_escape_string($_POST['fname']);
					$mysql_lname    = $DB->mysqli->real_escape_string($_POST['lname']);
					$mysql_email    = $DB->mysqli->real_escape_string($_POST['email']);
					$mysql_phone    = $DB->mysqli->real_escape_string($_POST['phone']);
					$mysql_salt     = generateSalt(44);
                                   
					$generated_password = generatePassword(7);

             	    $md5_password = md5($SECURITY->salt . $mysql_salt . $generated_password);
						
					$query = "INSERT INTO users(organizationid, fname, lname, email, phone, password, salt_for_password, is_active) VALUES(1, '{$mysql_fname}', '{$mysql_lname}', '{$mysql_email}', '{$mysql_phone}', '{$md5_password}', '{$mysql_salt}', 1)";

					$DB->mysqli->query($query);	

					if($DB->mysqli->affected_rows == 1) {
						$user_id = $DB->mysqli->insert_id;
						
						$mysql_city = $DB->mysqli->real_escape_string($_POST['city']);
						$mysql_state = $DB->mysqli->real_escape_string($_POST['state']);
						$mysql_country = $DB->mysqli->real_escape_string($_POST['country']);
						$mysql_education = $DB->mysqli->real_escape_string($_POST['education']);						
						$mysql_native = $DB->mysqli->real_escape_string($_POST['native']);
						$mysql_second = $DB->mysqli->real_escape_string($_POST['second']);
						$mysql_additional = $DB->mysqli->real_escape_string($_POST['additional']);
						$mysql_hours = $DB->mysqli->real_escape_string($_POST['hours']);
						$mysql_hear = $DB->mysqli->real_escape_string($_POST['hear']);
						
						$query = "INSERT INTO interviewees(user_id, city, state, country, education, native_language, second_language, additional_language, hours_expecting, hear_about_us) VALUES({$user_id}, '{$mysql_city}', '{$mysql_state}', '{$mysql_country}', '{$mysql_education}', '{$mysql_native}', '{$mysql_second}', '{$mysql_additional}', '{$mysql_hours}', '{$mysql_hear}')";

						$DB->mysqli->query($query);	

						$query = "INSERT INTO user_preferences(user_id, preference, value) VALUES({$user_id}, 'language', 'en')";

						$DB->mysqli->query($query);	

						$query = "SELECT id FROM classes WHERE name='Tutor Interview' LIMIT 1";

						$result = $DB->mysqli->query($query);

						if($result && $result->num_rows == 1) {
							$row = $result->fetch_object();

							$query = "INSERT INTO user_classes(userid, classid, is_student) VALUES({$user_id}, {$row->id},  1)";

							$DB->mysqli->query($query);	
                            $fromEmailAddress = 'support@meglms.com';
							$to      = $_POST['email'];
							$subject = 'Account Info';
							$message = 'Hi ' . $_POST['fname'] . ' ' . $_POST['lname'] . ',' . "\r\n";
							$message .= 'Login Url: http://meglms.com' . "\r\n";
							$message .= 'User: ' . $_POST['email'] . "\r\n";
							$message .= 'Password: ' . $generated_password . "\r\n";
							$message .= 'Thank You,'. "\r\n";
							$message .= 'MEGLMS Support Staff';

							$headers = 'From: '.$fromEmailAddress;

							mail($to, $subject, $message, $headers,'-f'.$fromEmailAddress);

							$_SESSION['USER'] = array();
		
							$_SESSION['USER']['LOGGED_IN'] = true;
							$_SESSION['USER']['ID'] = $user_id;
							$_SESSION['USER']['FNAME'] = $_POST['fname'];
							$_SESSION['USER']['LNAME'] = $_POST['lname'];
							$_SESSION['USER']['EMAIL'] = $_POST['email'];
						
							include_once($PATHS->app_path . $PATHS->views_path . '/applywelcome.html');
							exit();	
						} else {
							header("Location: http://" . $_SERVER['HTTP_HOST'] . "/apply/?error=Not_Accepting_Applications_At_This_Time", 303);
							exit();
						}
					} else {
						header("Location: http://" . $_SERVER['HTTP_HOST'] . "/apply/?error=Technical_Error", 303);
						exit();
					}
				} else {
					header("Location: http://" . $_SERVER['HTTP_HOST'] . "/apply/?error=Email_Already_Been_Used", 303);
					exit();
				}
			} else {
				header("Location: http://" . $_SERVER['HTTP_HOST'] . "/apply/?error=Please_Provide_A_Valid_Email", 303);
				exit();
			}	 			
		} else {
			header("Location: http://" . $_SERVER['HTTP_HOST'] . "/apply/?error=Please_Provide_LastName", 303);
			exit();
		}
	} else {
		header("Location: http://" . $_SERVER['HTTP_HOST'] . "/apply/?error=Please_Provide_FirstName", 303);
		exit();
	}
} 

include_once($PATHS->app_path . $PATHS->views_path . '/apply.html');
exit();

?>