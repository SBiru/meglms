<?php

require_once('editorganizationuser.php');
global $PATHS, $DB, $SECURITY;

use English3\Controller\Utility;
$HARDCODED_ORGANIZATION = 82;
if(isset($_POST['fname'])) {

	if(isset($_POST['fname']) && strlen($_POST['fname']) > 0) {
		if(isset($_POST['lname']) && strlen($_POST['lname']) > 0) {
			if(isset($_POST['email']) && strlen($_POST['email']) > 0 && filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
				$mysql_email = $DB->mysqli->real_escape_string($_POST['email']);

				$query = "SELECT id FROM users WHERE email='{$mysql_email}' LIMIT 1";
				$result = $DB->mysqli->query($query);
				if($result->num_rows == 0) {
					$mysql_fname    = $DB->mysqli->real_escape_string($_POST['fname']);
					$mysql_lname    = $DB->mysqli->real_escape_string($_POST['lname']);
					$mysql_email    = $DB->mysqli->real_escape_string($_POST['email']);
					$mysql_phone    = $DB->mysqli->real_escape_string($_POST['phone']);
					$mysql_address    = $DB->mysqli->real_escape_string($_POST['address']);
					$mysql_city    = $DB->mysqli->real_escape_string($_POST['city']);
					$mysql_state   = $DB->mysqli->real_escape_string($_POST['state']);
					$mysql_country    = 'Guatemala';
					$mysql_salt     = generateSalt(44);
                                   
					$generated_password = '$temp$'.generatePassword(7);

             	    $md5_password = md5($SECURITY->salt . $mysql_salt . $generated_password);
						
					$query = "INSERT INTO users(organizationid, fname, lname, email, phone, password, salt_for_password, is_active,address,city,state,country) VALUES($HARDCODED_ORGANIZATION, '{$mysql_fname}', '{$mysql_lname}', '{$mysql_email}', '{$mysql_phone}', '{$md5_password}', '{$mysql_salt}', 1,'{$mysql_address}','{$mysql_city}','{$mysql_state}','{$mysql_country}')";

					Utility::getInstance()->insert($query);

					if(Utility::getInstance()->reader->lastInsertId()) {
						$user_id = Utility::getInstance()->reader->lastInsertId();

						$query = "INSERT INTO user_preferences(user_id, preference, value) VALUES({$user_id}, 'language', 'es')";

						$DB->mysqli->query($query);

						$query = "SELECT id FROM classes WHERE id = 871";

						$result = $DB->mysqli->query($query);

						if($result && $result->num_rows == 1) {
							$row = $result->fetch_object();

							$query = "INSERT INTO user_classes(userid, classid, is_student) VALUES({$user_id}, {$row->id},  1)";
							$result = $DB->mysqli->query($query);

							$user = new PmOrm($_SESSION, $DB);
							$user->set_me($user_id);
							$translations = $user->get_translations();
							$fromEmailAddress = 'noreply@english3.com';
							$input= new \stdClass();
							$input->email = $mysql_email;
							$input->domain = $_SERVER['HTTP_ORIGIN'];
							$input->fname = $mysql_fname;
							$input->lname = $mysql_lname;
							$to = $mysql_email;
							$subject = isset($translations['user_language']['subject_account_info']) ? $translations['user_language']['subject_account_info'] : $translations['en']['subject_account_info'];
							$mail_password_changed_message = isset($translations['user_language']['mail_registered_message']) ? $translations['user_language']['mail_registered_message'] : $translations['en']['mail_registered_message'];
							$message = mail_message($translations, $input, $generated_password, $mail_password_changed_message);
							$headers = 'MIME-Version: 1.0' . "\r\n";
							$headers .= 'Content-type: text/html;' . "\r\n";
							$headers .= 'From: '.$fromEmailAddress;

							if (mail($to, $subject, $message, $headers,'-f'.$fromEmailAddress)) {
								$mailed = 'Mailed';
							}
							session_start();
							$_SESSION['USER'] = array();
		
							$_SESSION['USER']['LOGGED_IN'] = true;
							$_SESSION['USER']['ID'] = $user_id;
							$_SESSION['USER']['FNAME'] = $_POST['fname'];
							$_SESSION['USER']['LNAME'] = $_POST['lname'];
							$_SESSION['USER']['EMAIL'] = $_POST['email'];

							header("Location: http://" . $_SERVER['HTTP_HOST'] . "/");
							exit();	
						} else {
							header("Location: http://" . $_SERVER['HTTP_HOST'] . "/test/?error=Not_Accepting_Applications_At_This_Time", 303);
							exit();
						}
					} else {
						header("Location: http://" . $_SERVER['HTTP_HOST'] . "/test/?error=Technical_Error", 303);
						exit();
					}
				} else {
					header("Location: http://" . $_SERVER['HTTP_HOST'] . "/test/?error=Email_Already_Been_Used", 303);
					exit();
				}
			} else {
				header("Location: http://" . $_SERVER['HTTP_HOST'] . "/test/?error=Please_Provide_A_Valid_Email", 303);
				exit();
			}	 			
		} else {
			header("Location: http://" . $_SERVER['HTTP_HOST'] . "/test/?error=Please_Provide_LastName", 303);
			exit();
		}
	} else {
		header("Location: http://" . $_SERVER['HTTP_HOST'] . "/test/?error=Please_Provide_FirstName", 303);
		exit();
	}
} 

include_once($PATHS->app_path . $PATHS->views_path . '/test.html');
exit();

?>
