<?php

global $PATHS, $DB, $SECURITY;
use English3\Controller\GroupController;
use English3\Controller\Mailer\E3Mailer;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;

require_once('usertools/orm.php');
require_once('_utils.php');
require_once('sql.php');


function mail_message($translations, $input, $generated_password, $mail_message)
{

    $html = file_get_contents($_SERVER['DOCUMENT_ROOT'] . '/controllers/email-template.php');


    $hi = isset($translations['user_language']['hi']) ? $translations['user_language']['hi'] : $translations['en']['hi'];
    $user = isset($translations['user_language']['user']) ? $translations['user_language']['user'] : $translations['en']['user'];

    $password = isset($translations['user_language']['password']) ? $translations['user_language']['password'] : $translations['en']['password'];
    $mail_signature = isset($translations['user_language']['mail_signature']) ? $translations['user_language']['mail_signature'] : $translations['en']['mail_signature'];
    $sign_in = isset($translations['user_language']['sign_in']) ? $translations['user_language']['sign_in'] : $translations['en']['sign_in'];
    $do_not_reply = isset($translations['user_language']['do_not_reply']) ? $translations['user_language']['do_not_reply'] : $translations['en']['do_not_reply'];
    $click_here = isset($translations['user_language']['click_here']) ? $translations['user_language']['click_here'] : $translations['en']['click_here'];
    $to_contact_us = isset($translations['user_language']['to_contact_us']) ? $translations['user_language']['to_contact_us'] : $translations['en']['to_contact_us'];
    $rights = isset($translations['user_language']['rights']) ? $translations['user_language']['rights'] : $translations['en']['rights'];
    $account_info = isset($translations['user_language']['subject_account_info']) ? $translations['user_language']['subject_account_info'] : $translations['en']['subject_account_info'];

    $html = str_replace("##hi##", $hi, $html);
    $html = str_replace("##fname##", $input->fname, $html);
    $html = str_replace("##lname##", $input->lname, $html);
    $html = str_replace("##mail_message##", $mail_message, $html);
    $html = str_replace("##account_info##", $account_info, $html);
    $html = str_replace("##user##", $user, $html);
    $html = str_replace("##username##", $input->email, $html);
    $html = str_replace("##password##", $password, $html);
    $html = str_replace("##userpassword##", $generated_password, $html);
    $html = str_replace("##domain##", $input->domain, $html);
    $html = str_replace("##sign_in##", $sign_in, $html);
    $html = str_replace("##support_staff##", $mail_signature, $html);
    $html = str_replace("##do_not_reply##", $do_not_reply, $html);
    $html = str_replace("##to_contact_us##", $to_contact_us, $html);
    $html = str_replace("##click_here##", $click_here, $html);
    $html = str_replace("##rights##", $rights, $html);
    if($translations['language']=='ar'){
        $html = str_replace("##rtl_style##", "direction: rtl;text-align: right;", $html);
    }
    else{
        $html = str_replace("##rtl_style##", '', $html);
    }

    return $html;
}

function generateSalt($length)
{
    $salt = '';

    $tokens = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '&', '*');

    $token_length = count($tokens) - 1;

    for ($i = 0; $i < $length; $i++) {
        $salt .= $tokens[mt_rand(0, $token_length)];
    }

    return $salt;
}

function generatePassword($length)
{
    $password = '';

    $tokens = array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', '3', '4', '5', '6', '7', '9');

    $token_length = count($tokens) - 1;

    for ($i = 0; $i < $length; $i++) {
        $password .= $tokens[mt_rand(0, $token_length)];
    }

    return $password;
}

/**
 * addUserToClasses() will enroll the user with the provided ID into all the classes provided in the $classesArray.
 * The $classesArray can be an array of class IDs or an array of class external IDs.
 *
 * @param $userId The ID of the user that is to be enrolled
 * @param $classesArray An Array of strings with either class IDs or external IDs
 * @return error message or blank string
 */
function addUserToClasses($userId, $classesArray,$group)
{
    global $DB;

    // Set some default values
    $returnVal = "";
    $is_student = '1';
    $is_teacher = '0';
    $is_edit_teacher = '0';

    // Handle adding the user to every class specified in the classes input
    foreach ($classesArray as $classId) {

        $addUser = false;
        $mysql_classid = 0;

        // If a numeric classID was provided, we check if the provided ID is a valid
        // class ID. If it is not a valid class ID then we check if it is a valid
        // external ID.
        if (is_numeric($classId)) {
            $mysql_classid = intval($classId);
            // First we check if a class with the provided ID exists
            $queryForExistingClassById = "SELECT name FROM classes WHERE id=$mysql_classid";
            $resultForExistingClassById = $DB->mysqli->query($queryForExistingClassById);

            // If a class with the provided ID exists, add the user to it
            if ($resultForExistingClassById && $resultForExistingClassById->num_rows > 0) {
                $addUser = true;
            } else {
                // Next we check if that class ID that was specified is actually a external id
                $queryForExistingClassByExternalId = "SELECT id FROM classes WHERE external_id=$classId";
                $resultForExistingClassByExternalId = $DB->mysqli->query($queryForExistingClassByExternalId);
                if ($resultForExistingClassByExternalId && $resultForExistingClassByExternalId->num_rows > 0) {
                    $classRow = $resultForExistingClassByExternalId->fetch_object();
                    $mysql_classid = intval($classRow->id);
                    $addUser = true;
                }
            }
        } else {
            // Next we check if that class ID that was specified is actually a external id
            $queryForExistingClassByExternalId = "SELECT id FROM classes WHERE external_id='{$classId}'";
            $resultForExistingClassByExternalId = $DB->mysqli->query($queryForExistingClassByExternalId);
            if ($resultForExistingClassByExternalId && $resultForExistingClassByExternalId->num_rows > 0) {
                $classRow = $resultForExistingClassByExternalId->fetch_object();
                $mysql_classid = intval($classRow->id);
                $addUser = true;
            }

        }
        $groupId = 'null';
        $util = new Utility();
        if($group){
            if(is_numeric($group)){
                $groupExists = $util->fetchOne(GroupController::$queryGetClassGroup,
                    ['groupId'=>$group,'classId'=>$mysql_classid]);
                if($groupExists){
                    $groupId=$group;
                }
            }else{
                $groupExists = $util->fetchOne(GroupController::$queryGetClassGroupByName,
                    ['groupName'=>$group,'classId'=>$mysql_classid]);
                if($groupExists){
                    $groupId=$groupExists;
                }
            }
        }
        // If we have found an existing class with the provided ID, add the user to that class.
        // Otherwise, give an error.
        if ($addUser) {
            $newEnrollmentQuery = "INSERT INTO user_classes (userid, classid,groupid, is_student, is_teacher, is_edit_teacher) VALUES
											({$userId},{$mysql_classid},{$groupId},{$is_student},{$is_teacher},{$is_edit_teacher})";
            $DB->mysqli->query($newEnrollmentQuery);
        } else {
            $returnVal .= " - Invalid class ID " . $classId . " provided - ";
        }
    }
    return $returnVal;
}
function checkEmail($email){
    $sql = new BaseSQL();
    if($sql->fetch_one("select id from users where email = '{$email}'")){
        jsonResponse(
            [
                "message"=>"This email is already in use",
                "error"=>"This email is already in use"
            ]
        );
    }
    else{
        return true;
    }
}

function canLogInAsOthers($logInAsUserId,$classId){
    global $DB;
    $user = new PmOrm($_SESSION, $DB);
    $orgDetails = OrganizationController::_get($user->my_org(false)["id"]);
    if($user->am_i_super_user()){
       return true;
    }else if($orgDetails['allow_users_to_log_in_as_others']){
        $adminAccess = ($user->am_i_organization_admin() or $user->am_i_site_admin()) && $orgDetails['allowedUsersToLogInAsOthers']['allow_organization_and_site_admins_to_log_in_as_others'];
        $teacherAccess = $classId == null ? false : ($user->am_i_teacher_of($logInAsUserId,$classId) && $orgDetails['allowedUsersToLogInAsOthers']['allow_teachers_to_log_in_as_others']);
        return ($adminAccess or $teacherAccess);
    }else{
        return false;
    }
}
class TemplateResetPassword extends E3Mailer{

    private $translations;
    private $input;
    private $generated_password;
    private $mail_registered_message;

    public function __construct(User $receiver,$translations, $input, $generated_password, $mail_registered_message){
        parent::__construct($receiver);
        $this->headerText = 'Password Reset';
        $this->translations = $translations;
        $this->input = $input;
        $this->generated_password = $generated_password;
        $this->mail_registered_message = $mail_registered_message;


    }
    protected function emailBodyTemplate()
    {

        return mail_message($this->translations, $this->input, $this->generated_password, $this->mail_registered_message);;
    }

    protected function emailSubject()
    {
        return "Password reset";
    }
}
if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {
    global $DB;
    $userORM = new PmOrm($_SESSION, $DB);
    if ($userORM->am_i_teacher()) {
        $user_id = $userORM->user_id;
    } else {
        $user_id = is_admin_user(0, $DB, true);
    }
    $uri = strtok($_SERVER['REQUEST_URI'], '?');

    $uri = str_replace('/editorganizationuser/', '', $uri);

    $action = strtok($uri, '/');
    /*
     * See /public/services.js EditOrganizationUser
     */

    if ($action == 'save') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');

            $input = json_decode($json_input);

            $data = new \stdClass();

            $organization_id = intval($input->organization_id);

            // Query for if the organization exists
            $query = "SELECT id FROM organizations WHERE id={$organization_id}";

            $result = $DB->mysqli->query($query);

            // If the organization exists
            if ($result && $result->num_rows == 1) {
                $data->message = "";
                $mysql_fname = $DB->mysqli->real_escape_string($input->fname);
                $mysql_lname = $DB->mysqli->real_escape_string($input->lname);
                $mysql_email = $DB->mysqli->real_escape_string($input->email);
                $use_license = $input->use_license?'1':'0';
                $imported_userid = 0;
                // If a user ID was provided and it is numeric
                if (isset($input->userid) && is_numeric($input->userid)) {
                    $imported_userid = intval($input->userid);
                }
                $mysql_external_id = $DB->mysqli->real_escape_string("");
                // If an external ID was provided , we look up if this external ID is already associated with a user.
                // If the external ID is associated with a user, we set $imported_userid to this user's ID
                if (isset($input->external_id)) {
                    $mysql_external_id = $DB->mysqli->real_escape_string($input->external_id);

                    // If the user is specified by external ID, we look up the user's ID for the  E3 system
                    if ($input->external_id && strlen($input->external_id) > 0) {
                        $queryForUserId = "SELECT id FROM users WHERE external_id='{$DB->mysqli->real_escape_string($input->external_id)}' LIMIT 1";
                        $userResult = $DB->mysqli->query($queryForUserId);
                        if ($userResult && $userResult->num_rows == 1) {
                            $userRow = $userResult->fetch_object();
                            $imported_userid = intval($userRow->id);
                        }
                    }

                }
                $mysql_salt = generateSalt(44);

                if (strlen($mysql_email) > 0 && strlen($mysql_fname) > 0 && strlen($mysql_lname) > 0 && (strlen($input->password) > 0 || $input->generate_password == 1)) {
                    $generated_password = '$temp$' . generatePassword(7);

                    if ($input->generate_password == 1) {
                        $md5_password = md5($SECURITY->salt . $mysql_salt . $generated_password);
                    } else {
                        $md5_password = md5($SECURITY->salt . $mysql_salt . $input->password);
                    }

                    if ($imported_userid > 0) {
                        $query = "UPDATE users SET organizationid = $organization_id, fname = '{$mysql_fname}', lname = '{$mysql_lname}', email = '{$mysql_email}', password = '{$md5_password}', salt_for_password = '{$mysql_salt}', is_active = 1, external_id='{$mysql_external_id}',use_license='{$use_license}' WHERE id = $imported_userid";
                    } else {
                        checkEmail($mysql_email);
                        $me = $_SESSION['USER']['ID'];
                        $expirationDate = UserController::updatePasswordExpiration(null,'',$organization_id,false);
                        $now = date('Y-m-d');
                        if($expirationDate){
                            $mysql_password_expiration_date ="'".$expirationDate."'";
                        }else{
                            $mysql_password_expiration_date='null';
                        }
                        $mysql_email = strtolower(trim($mysql_email));
                        $query = "INSERT INTO users(organizationid, fname, lname, email, password, salt_for_password, is_active,phone,external_id,use_license,created_by,password_set_on,password_expires_on) VALUES($organization_id, '{$mysql_fname}', '{$mysql_lname}', '{$mysql_email}', '{$md5_password}', '{$mysql_salt}', 1,'','{$mysql_external_id}','{$use_license}',{$me},'{$now}',{$mysql_password_expiration_date})";
                    }

                    $DB->mysqli->query($query);

                    // If a new user has been added.
                    if ($DB->mysqli->insert_id) {
                        $imported_userid = $DB->mysqli->insert_id;
                        $data->user_id = $imported_userid;
                        $preferred_language = 'en';
                        if (isset($input->preferred_language)) {
                            $preferred_language = $input->preferred_language;
                        }
                        $query = "INSERT INTO user_preferences(user_id, preference, value) VALUES({$imported_userid}, 'language', '{$preferred_language}')";

                        $DB->mysqli->query($query);

                        $user = new PmOrm($_SESSION, $DB);
                        $user->set_me($imported_userid);
                        $translations = $user->get_translations();

                        $mailed = 'No Need To Mail';
                        $orgDetails = OrganizationController::_get($organization_id,false);
                        if ($input->generate_password == 1 && !$orgDetails['disable_account_emails']) {
                            $fromEmailAddress = 'noreply@english3.com';
                            $to = $input->email;
                            $input->domain = $_SERVER['HTTP_ORIGIN'];
                            $subject = isset($translations['user_language']['subject_account_info']) ? $translations['user_language']['subject_account_info'] : $translations['en']['subject_account_info'];
                            $mail_password_changed_message = isset($translations['user_language']['mail_registered_message']) ? $translations['user_language']['mail_registered_message'] : $translations['en']['mail_registered_message'];
                            $message = mail_message($translations, $input, $generated_password, $mail_password_changed_message);
                            $headers = 'MIME-Version: 1.0' . "\r\n";
                            $headers .= 'Content-type: text/html;' . "\r\n";
                            $headers .= 'From: '.$fromEmailAddress;

                            if (mail($to, $subject, $message, $headers,'-f'.$fromEmailAddress)) {
                                $mailed = 'Mailed';
                            }
                        }

                        if ((isset($input->is_super_admin) && $input->is_super_admin) || (isset($input->can_add_super_admin) && $input->can_add_super_admin)) {
                            $can_add_super_admin = $input->can_add_super_admin ? '1' : '0';
                            $query = "INSERT INTO user_admin_super (user_id, can_create_super_users)
											VALUES
											({$imported_userid},{$can_add_super_admin})";
                            $DB->mysqli->query($query);

                        }
                        if ((isset($input->is_organization_admin) && $input->is_organization_admin) || (isset($input->can_add_organization_admin) && $input->can_add_organization_admin) || (isset($input->can_add_user) && $input->can_add_user) || (isset($input->can_edit_course) && $input->can_edit_course)) {
                            $can_add_organization_admin = $input->can_add_organization_admin ? '1' : '0';
                            $can_add_user = $input->can_add_user ? '1' : '0';
                            $can_edit_course = $input->can_edit_course ? '1' : '0';
                            $query = "INSERT INTO user_admin_organizations (userid,organizationid,can_add_admin_users,can_add_users,can_edit_courses)
											VALUES
											({$imported_userid},{$organization_id},{$can_add_organization_admin},{$can_add_user},{$can_edit_course})";
                            $DB->mysqli->query($query);
                        }

                        // If there is some entry for the classes array, we enroll this user in the classes specified
                        // in that array.
                        if (!empty($input->classes)) {
                            $data->message .= addUserToClasses($imported_userid, $input->classes);
                        }

                        $data->message .= ' - Successful - ';
                        $data->status='successful';
                        $data->password = $generated_password;
                        $data->mailed = $mailed;
                    } // Else the user already existed so we update the user's attributes.
                    else {
                        if (isset($input->preferred_language)) {
                            $preferred_language = $input->preferred_language;
                            $userPreferencesQuery = "UPDATE user_preferences SET value='{$preferred_language}' WHERE user_id = $imported_userid";
                            $DB->mysqli->query($userPreferencesQuery);

                        }

                        $user = new PmOrm($_SESSION, $DB);
                        $user->set_me($user_id);
                        $translations = $user->get_translations();

                        $mailed = 'No Need To Mail';

                        // If the is_super_admin flag has been specified and it has been set to true, then add the
                        // user to the user_admin_super table, unless the user has already been added to this list.
                        if (isset($input->is_super_admin) && $input->is_super_admin) {
                            $queryForExistingCanAddSuperAdmin = "SELECT can_create_super_users FROM user_admin_super WHERE user_id = $imported_userid";
                            $existingCanAddSuperAdminResult = $DB->mysqli->query($queryForExistingCanAddSuperAdmin);
                            if (!$existingCanAddSuperAdminResult || $existingCanAddSuperAdminResult->num_rows == 0) {
                                $can_add_super_admin = '0';
                                if (isset($can_add_super_admin)) {
                                    $can_add_super_admin = $input->can_add_super_admin ? '1' : '0';
                                }
                                $query = "INSERT INTO user_admin_super (user_id, can_create_super_users)
											VALUES
											({$user_id},{$can_add_super_admin})";
                                $DB->mysqli->query($query);
                            }
                        }

                        // If any of the boolean values contained in the the user_admin_organizations table have been
                        // specified, update this table for the user.
                        if (isset($input->is_organization_admin) || isset($input->can_add_organization_admin) || isset($input->can_add_user) || isset($input->can_edit_course)) {
                            $queryForExistingCanAddOrganizationAdmin = "SELECT can_add_admin_users FROM user_admin_organizations WHERE userid = $imported_userid";
                            $existingCanAddOrganizationAdmin = $DB->mysqli->query($queryForExistingCanAddOrganizationAdmin);
                            if (!$existingCanAddOrganizationAdmin || $existingCanAddOrganizationAdmin->num_rows == 0) {

                                $can_add_organization_admin = '0';
                                if (isset($input->can_add_organization_admin)) {
                                    if ($input->can_add_organization_admin) {
                                        $can_add_organization_admin = '1';
                                    }
                                };

                                $can_add_user = '0';
                                if (isset($input->can_add_user)) {
                                    if ($input->can_add_user) {
                                        $can_add_user = '1';
                                    }
                                };

                                $can_edit_course = '0';
                                if (isset($input->can_edit_course)) {
                                    if ($input->can_edit_course) {
                                        $can_edit_course = '1';
                                    }
                                };
                                $query = "INSERT INTO user_admin_organizations (userid,organizationid,can_add_admin_users,can_add_users,can_edit_courses)
											VALUES
											({$user_id},{$organization_id},{$can_add_organization_admin},{$can_add_user},{$can_edit_course})";
                                $DB->mysqli->query($query);
                            } else {
                                // TODO:
                            }
                        }

                        // If there is some entry for the classes array, we enroll this user in the classes specified
                        // in that array.
                        if (!empty($input->classes)) {
                            $data->message .= addUserToClasses($imported_userid, $input->classes,$input->group);
                        }

                        $data->message .= ' - Successful - ';
                        $data->status='successful';
                        $data->password = $generated_password;
                        $data->mailed = $mailed;
                    }
                }
                else {
                    $data->message .= ' - Please Fill In Empty Fields - ';
                }

                header('Content-Type: application/json');
                print json_encode($data);
                exit();
            }
        }
    } /*
	 * See /public/services.js EditOrganizationUser
	 */
        else if ($action == 'update') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');

            $input = json_decode($json_input);

            $data = new \stdClass();

            $mysql_fname = $DB->mysqli->real_escape_string($input->fname);
            $mysql_lname = $DB->mysqli->real_escape_string($input->lname);
            $mysql_email = $DB->mysqli->real_escape_string($input->email);
            $use_license = $input->use_license?'1':'0';
            $is_active = $input->is_active?'1':'0';
            $teacher_supervisor = $input->teacher_supervisor?'1':'0';
            $user_id = $input->user_id;
            $mysql_external_id = $DB->mysqli->real_escape_string("");
            if (isset($input->external_id)) {
                $mysql_external_id = $DB->mysqli->real_escape_string($input->external_id);
            }
            $mysql_phone = isset($input->phone) ? $DB->mysqli->real_escape_string($input->phone) : '';
            $mysql_expiration_date = isset($input->expiration_date)&&$input->expiration_date!="" ? (new DateTime($input->expiration_date))->format("Y-m-d H:i:s") : false;

            if($mysql_expiration_date){
                $u = Utility::getInstance();
                $user = \English3\Controller\UserController::byId($u->reader,$user_id);
                if(boolval($user->user->getUseLicense())){
                    $licenseId = $u->fetchOne(\English3\Controller\LicensesController::$queryUserLicense,['userId'=>$user_id],'id');
                    if($licenseId){
                        $u->reader->update(
                            'licenses',
                            ['expiry_date'=>$mysql_expiration_date],
                            ['id'=>$licenseId]
                        );
                    }
                }
            }

            $mysql_expiration_date=$mysql_expiration_date?"'{$mysql_expiration_date}'":'null';

            $query = "SELECT id,organizationid,salt_for_password FROM `users` WHERE users.id='{$user_id}' LIMIT 1";
            $result = $DB->mysqli->query($query);

            if ($result && $result->num_rows == 1) {
                $row = $result->fetch_object();
                $user_id = $row->id;
                $organization_id = isset($input->organization_id) ? intval($input->organization_id) : $row->organizationid;
                $mysql_salt = $row->salt_for_password;
            } else {
                $data->message = 'User not found';
                header('Content-Type: application/json');
                print json_encode($data);
                exit();
            }
            $md5_password = '';
            if (isset($input->password) || isset($input->generate_password)) {
                if ($input->password != '' || $input->generate_password != 0) {
                    $generated_password = '';
                    if ($input->generate_password == 1) {
                        $generated_password = '$temp$' . generatePassword(7);
                        $md5_password = md5($SECURITY->salt . $mysql_salt . $generated_password);
                    } else {
                        $md5_password = md5($SECURITY->salt . $mysql_salt . $input->password);
                    }
                }
            }


            $phoneStr = $mysql_phone != "" ? ",phone='{$mysql_phone}'" : '';
            if ($md5_password == "") {
                $query = "UPDATE users set fname='{$mysql_fname}',lname='{$mysql_lname}',email='{$mysql_email}',external_id = '{$mysql_external_id}',is_active='{$is_active}',use_license='{$use_license}',expiration_date={$mysql_expiration_date},teacher_supervisor={$teacher_supervisor} {$phoneStr} WHERE users.id='{$user_id}' ";
            } else {
                $expirationDate = UserController::updatePasswordExpiration(null,'',$organization_id,false);
                $now = date('Y-m-d');
                if($expirationDate){
                    $mysql_password_expiration_date ="'".$expirationDate."'";
                }else{
                    $mysql_password_expiration_date='null';
                }
                $query = "UPDATE users set password_set_on='{$now}', password_expires_on={$mysql_password_expiration_date}, password='{$md5_password}', fname='{$mysql_fname}',lname='{$mysql_lname}',email='{$mysql_email}',external_id = '{$mysql_external_id}',is_active='{$is_active}',use_license='{$use_license}',expiration_date={$mysql_expiration_date},teacher_supervisor={$teacher_supervisor} {$phoneStr} WHERE users.id='{$user_id}' ";
            }
            $user = new PmOrm($_SESSION, $DB);
            $user->set_me($user_id);
            $translations = $user->get_translations();
            $orgDetails = OrganizationController::_get($organization_id,false);
            if (isset($input->generate_password) && $input->generate_password == 1 && !$orgDetails['disable_account_emails']) {
                $fromEmailAddress = 'noreply@english3.com';
                $to = $input->email;

                $subject = isset($translations['user_language']['subject_password_changed']) ? $translations['user_language']['subject_password_changed'] : $translations['en']['subject_password_changed'];
                $mail_password_changed_message = isset($translations['user_language']['mail_password_changed_message']) ? $translations['user_language']['mail_password_changed_message'] : $translations['en']['mail_password_changed_message'];
                $input->domain = $_SERVER['HTTP_ORIGIN'];
                $message = mail_message($translations, $input, $generated_password, $mail_password_changed_message);

                $headers = 'MIME-Version: 1.0' . "\r\n";
                $headers .= 'Content-type: text/html;' . "\r\n";
                $headers .= 'From: '.$fromEmailAddress;

                //send_mail_locally($subject,$input,$message);

                if (mail($to, $subject, $message, $headers,'-f'.$fromEmailAddress)) {
                    $mailed = 'Mailed';
                }
            }

            $result = $DB->mysqli->query($query);
            if (isset($input->is_super_admin) || isset($input->can_add_super_admin)) {
                if ($input->is_super_admin || $input->can_add_super_admin) {
                    $can_add_super_admin = $input->can_add_super_admin ? '1' : '0';

                    $query = "SELECT user_id from user_admin_super where user_id={$user_id} LIMIT 1";
                    $result = $DB->mysqli->query($query);
                    if ($result && $result->num_rows == 1) {
                        $query = "UPDATE user_admin_super SET can_create_super_users={$can_add_super_admin} where user_id={$user_id}";
                        $DB->mysqli->query($query);
                    } else {
                        $query = "INSERT INTO user_admin_super (user_id, can_create_super_users)
											VALUES
											({$user_id},{$can_add_super_admin})";
                        $DB->mysqli->query($query);
                    }

                } else {
                    $query = "DELETE FROM user_admin_super where user_id={$user_id}";
                    $DB->mysqli->query($query);
                }
            }


            if (isset($input->is_organization_admin) ||
                isset($input->can_add_organization_admin) ||
                isset($input->can_add_user) ||
                isset($input->can_edit_course)
            ) {
                if ($input->is_organization_admin || $input->can_add_organization_admin || $input->can_add_user || $input->can_edit_course) {
                    $can_add_organization_admin = $input->can_add_organization_admin ? '1' : '0';
                    $can_add_user = $input->can_add_user ? '1' : '0';
                    $can_edit_course = $input->can_edit_course ? '1' : '0';
                    $query = "SELECT userid from user_admin_organizations where userid={$user_id} LIMIT 1";
                    $result = $DB->mysqli->query($query);

                    if ($result && $result->num_rows == 1) {

                        $query = "UPDATE user_admin_organizations SET can_add_users={$can_add_user}, can_edit_courses={$can_edit_course}, can_add_admin_users={$can_add_organization_admin} where userid={$user_id}";
                        $DB->mysqli->query($query);

                    } else {
                        $query = "INSERT INTO user_admin_organizations (userid,organizationid,can_add_admin_users,can_add_users,can_edit_courses)
												VALUES
												({$user_id},{$organization_id},{$can_add_organization_admin},{$can_add_user},{$can_edit_course})";
                        $DB->mysqli->query($query);
                    }
                } else {
                    $query = "DELETE FROM user_admin_organizations where userid={$user_id}";
                    $DB->mysqli->query($query);
                }
            }


            $preferred_language = 'en';
            if (isset($input->preferred_language)) {
                $preferred_language = $input->preferred_language;
                $query = "UPDATE user_preferences SET value='{$preferred_language}' where user_id={$user_id} and preference='language'";
                $DB->mysqli->query($query);
            }
            if (isset($input->is_private_student)){
                $sql = new BaseSQL();
                if($input->is_private_student){
                    if(!$sql->fetch_one("SELECT id from where user_id={$user_id} and preference='is_private_student'")){
                        $query = "INSERT INTO user_preferences SET preference='is_private_student', value='1',user_id={$user_id} ";
                        $sql->query_noResult($query);
                    }
                }else{
                    $query = "DELETE FROM user_preferences  where user_id={$user_id} and preference='is_private_student'";
                    $sql->query_noResult($query);
                }
            }


            $data->message = 'successful';
            header('Content-Type: application/json');
            print json_encode($data);
            exit();
        }
    }
    /*
	 * See /public/services.js EditOrganizationUser
	 */
    else if ($action == 'delete') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $sql = new BaseSQL();
            $json_input = file_get_contents('php://input');

            $input = json_decode($json_input);

            $userid =intval($input->user_id);
            \English3\Controller\Utility::moveToHistory('users','users_history',$userid);
            $sql->query_noResult("DELETE from user_classes where userid = {$userid}");
            $sql->query_noResult("DELETE from user_admin_super where user_id = {$userid}");
            $sql->query_noResult("DELETE from user_preferences where user_id = {$userid}");
            $sql->query_noResult("DELETE from user_admin_organizations where userid = {$userid}");

            jsonResponse(['status'=>'success']);
            exit();
        }
    }


    /*
     * See /public/services.js EditOrganizationUser
     */
    else if ($action == 'userguardians') {
        $user = new PmOrm($_SESSION, $DB);
        $input = get_input();
        $user->set_me($input->user_id);


        $data = new \stdClass();
        $data->all_users = $user->students_in_my_org(false);
        $data->children = $user->get_children();
        $data->guardians = $user->get_guardians();

        $data->children = $data->children == false ? array() : $data->children;
        $data->guardians = $data->guardians == false ? array() : $data->guardians;


        header('Content-Type: application/json');
        print json_encode($data);
        exit();

    }
    else if ($action == 'login-as') {
        $input = get_input();
        $user = new PmOrm($_SESSION, $DB);
        if(!isset($input->id)){
            throw new Exception("User id is required",400);
        }
        $classId = (isset($input->classId) && $input->classId)?$input->classId:null;
        if(!canLogInAsOthers($input->id,$classId)){
            throw new Exception("Permission denied. Invalid user id?",403);
        }
        if($input->id == $_SESSION['USER']['ID']){
            throw new Exception("You already logged in as this user",400);
        }
        if(isset($_SESSION['USER']['ADMIN_AS_USER']) && $_SESSION['USER']['ADMIN_AS_USER'] == true){
            throw new Exception("You already logged in as other user",400);
        }
        $targetid = $input->id;
        $targetuser = $user->fetch_one("SELECT id,fname,lname,email FROM users WHERE id={$targetid}");
        if($targetuser){
            $_SESSION['USER']['MY_USER_ID'] = $_SESSION['USER']['ID'];
            $_SESSION['USER']['ADMIN_AS_USER'] = true;
            $_SESSION['USER']['LOGGED_IN'] = true;
            $_SESSION['USER']['ID'] = $targetuser['id'];
            $_SESSION['USER']['FNAME'] = $targetuser['fname'];
            $_SESSION['USER']['LNAME'] = $targetuser['lname'];
            $_SESSION['USER']['EMAIL'] = $targetuser['email'];
            jsonResponse(['status'=>'success']);
        }else{
            throw new Exception("An error has ocurred. Invalid user id?",500);
        }
    }
    else if ($action == 'disable') {
        $input = get_input();
        $sql = new BaseSQL();
        $user = new PmOrm($_SESSION, $DB);

        if(($user->am_i_super_user() or $user->am_i_organization_admin()) and  isset($input->is_active)){
            $user_id=$input->user_id;
            $is_active=$input->is_active?'1':'0';
            $sql->query_noResult("UPDATE users set is_active={$is_active} where id={$user_id}");
        }
        exit();
    }
    else if ($action == 'updateguardianuser') {

        $input = get_input();
        if (!(isset($input->guardian_id) && isset($input->dependent_id)))
            throwError("No guardian or dependent user");

        $guardian = new PmOrm($_SESSION, $DB);
        $child = new PmOrm($_SESSION, $DB);


        $is_valid = $guardian->set_me($input->guardian_id);
        if (!$is_valid) throwError("Guardian id is not valid");

        $is_valid = $child->set_me($input->dependent_id);
        if (!$is_valid) throwError("Dependent id is not valid");
        $query = '';
        if ($guardian->am_i_parent_of($input->dependent_id)) {

            $query = "DELETE FROM user_guardians WHERE userid = {$input->guardian_id} and userchildid = {$input->dependent_id}";
        } else {
            $query = "INSERT INTO user_guardians (userid,userchildid)
						VALUES ({$input->guardian_id},{$input->dependent_id})";
        }
        $guardian->query_no_result($query);

        throwError("successful");
    } else if (is_numeric($action) && $action > 0) {
        $action = intval($action);
        $user_id = intval($_SESSION['USER']['ID']);
        $sql = new BaseSQL();
        $query = "SELECT users.organizationid,users.id as userId, users.fname,users.lname,users.email,users.is_logged_in,users.phone,users.external_id,users.is_active,users.use_license,users.expiration_date,users.teacher_supervisor,
						if(user_admin_super.user_id is null,false,true) as is_super_admin,user_admin_super.can_create_super_users,
						if(user_admin_sites.userid is null,false,true) as is_sites_admin,
						if(user_admin_organizations.userid is null,false,true) as is_organization_admin, user_admin_organizations.can_add_admin_users,user_admin_organizations.can_add_users, user_admin_organizations.can_edit_courses,
						user_preferences.value as preferred_language,
						users.password_set_on,users.password_expires_on
				FROM users
					LEFT JOIN user_admin_super on users.id=user_admin_super.user_id
					LEFT JOIN user_admin_organizations on users.id=user_admin_organizations.userid and user_admin_organizations.organizationid=users.organizationid
					LEFT JOIN user_admin_sites on users.id=user_admin_sites.userid
					LEFT JOIN user_preferences on users.id = user_preferences.user_id

				WHERE users.id={$action} and user_preferences.preference = 'language' LIMIT 1";

        $result = $DB->mysqli->query($query);

        if ($result && $result->num_rows == 1) {


            $row = $result->fetch_object();

            $data = new \stdClass();

            $data->user = clone $row;
            $data->user->is_sites_admin = boolval($data->user->is_sites_admin);
            $data->classes = array();

            $user_preferences = $sql->query("select * from user_preferences where user_id = {$action} and preference<>'language'");
            foreach($user_preferences as $preference){
                $key = $preference->preference;
                $data->user->$key = $preference->value;
            }

            $query = "SELECT classes.name,classes.id,is_edit_teacher,is_student,is_teacher,is_observer,if(is_edit_teacher or is_student or is_teacher or is_observer,'1','0') as is_enrolled,groups.name as group_name,groups.id as group_id
					FROM classes
						LEFT JOIN courses on courses.id=classes.courseid
						LEFT JOIN departments on departments.id=courses.departmentid
						LEFT JOIN organizations on organizations.id=departments.organizationid
						LEFT JOIN users on users.organizationid = organizations.id
						LEFT JOIN groups on groups.classid=classes.id
						LEFT JOIN user_classes on user_classes.userid = users.id and user_classes.classid = classes.id and (groups.id is null or user_classes.groupid = groups.id)

					WHERE users.id={$action}";
            $result = $DB->mysqli->query($query);

            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_object()) {
                    if($row->group_id){
                        $row->name = $row->name.' - '.$row->group_name;
                    }
                    $data->classes[] = clone $row;

                }
            }
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
} /*
 * See /public/services.js EditOrganizationUser
*/
else {
    ##########################################
    ##          Reseting Password          ##
    #########################################
    /*
    DSerejo 2015-01-31
    */

    $uri = strtok($_SERVER['REQUEST_URI'], '?');

    $uri = str_replace('/editorganizationuser/', '', $uri);

    $action = strtok($uri, '/');
    if ($action == 'save') {
        $input = get_input();
        $sql = new BaseSQL();

        $mysql_fname = $DB->mysqli->real_escape_string($input->fname);
        $mysql_lname = $DB->mysqli->real_escape_string($input->lname);
        $mysql_email = $DB->mysqli->real_escape_string($input->email);
        $mysql_external_id = isset($input->external_id)?$DB->mysqli->real_escape_string($input->external_id):'';
        $organization_id=intval($input->org_id);
        $password = $DB->mysqli->real_escape_string($input->password);
        $use_license = $input->use_license?'1':'0';
        $created_by = $input->created_by?$input->created_by:false;
        $mysql_salt = generateSalt(44);
        $md5_password = md5($SECURITY->salt . $mysql_salt . $input->password);
        if($organization_id==0){
            jsonResponse(['error'=>'Invalid organization']);
        }
        checkEmail($mysql_email);
        if($created_by){
            $me=$created_by;
        }else{
            $me = isset($_SESSION['USER'])?$_SESSION['USER']['ID']:0;
        }

        $expirationDate = UserController::updatePasswordExpiration(null,'',$organization_id,false);
        $now = date('Y-m-d');
        if($expirationDate){
            $mysql_password_expiration_date ="'".$expirationDate."'";
        }else{
            $mysql_password_expiration_date='null';
        }
        $mysql_email = strtolower(trim($mysql_email));
        $query = "INSERT INTO users(organizationid, fname, lname, email, password, salt_for_password, is_active,phone,external_id,use_license,created_by,password_set_on,password_expires_on) VALUES($organization_id, '{$mysql_fname}', '{$mysql_lname}', '{$mysql_email}', '{$md5_password}', '{$mysql_salt}', 1,'','{$mysql_external_id}','{$use_license}','{$me}','{$now}',{$mysql_password_expiration_date})";

        $user_id = $sql->query_ReturnId($query);

        if($user_id){
            $user = new PmOrm($_SESSION, $DB);



            $preferred_language = 'en';
            if (isset($input->preferred_language)) {
                $preferred_language = $input->preferred_language;
            }
            $query = "INSERT INTO user_preferences(user_id, preference, value) VALUES({$user_id}, 'language', '{$preferred_language}')";
            $sql->query_noResult($query);
            $orgDetails = OrganizationController::_get($organization_id,false);
            if(!$orgDetails['disable_account_emails']){
                $user->set_me($user_id);
                $translations = $user->get_translations();
                $fromEmailAddress = 'noreply@english3.com';
                $to = $input->email;
                $subject = isset($translations['user_language']['subject_account_info']) ? $translations['user_language']['subject_account_info'] : $translations['en']['subject_account_info'];
                $mail_password_changed_message = isset($translations['user_language']['mail_registered_message']) ? $translations['user_language']['mail_registered_message'] : $translations['en']['mail_registered_message'];
                $input->domain = $_SERVER['HTTP_ORIGIN'];
                $message = mail_message($translations, $input, $password, $mail_password_changed_message);
                $headers = 'MIME-Version: 1.0' . "\r\n";
                $headers .= 'Content-type: text/html;' . "\r\n";
                $headers .= 'From: '.$fromEmailAddress;

                if (mail($to, $subject, $message, $headers,'-f'.$fromEmailAddress)) {
                    $mailed = 'Mailed';
                }
            }


            jsonResponse(['status'=>'success','userId'=>$user_id]);
        }
        else{
            jsonResponse(['error'=>'Could not create user']);
        }
    }
    else if ($action == 'resetpassword') {
        // edited on 09/21/2015. Removed '&& false' if needed again
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');
            $input = json_decode($json_input);
            $data = new \stdClass();
            if (!isset($input->email)) {
                header('Content-Type: application/json');
                $data->message = 'Please, insert a valid email';
                print json_encode($data);
                exit();
            }

            $mysql_email = $DB->mysqli->real_escape_string($input->email);


            if (strlen($mysql_email) > 0) {

                $query = "SELECT id,salt_for_password,organizationid,fname,lname FROM `users` WHERE users.email='{$mysql_email}' LIMIT 1";
                $result = $DB->mysqli->query($query);

                if ($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();

                    $user_id = $row->id;
                    $mysql_salt = $row->salt_for_password;
                    $mysql_fname = $row->fname;
                    $mysql_lname = $row->lname;

                    $generated_password = '$temp$' . generatePassword(7);
                    $new_md5_password = md5($SECURITY->salt . $mysql_salt . $generated_password);

                    $query = "update users set password = '{$new_md5_password}' where email like '%{$input->email}%'";

                    $DB->mysqli->query($query);

                    $user = new PmOrm($_SESSION, $DB);
                    $user->set_me($user_id);
                    $translations = $user->get_translations();
                    $orgDetails = OrganizationController::_get($row->organizationid,false);
                    if ($DB->mysqli->errno == 0) {

                        $to = $input->email;
                        $subject = isset($translations['user_language']['subject_forgotten_password']) ? $translations['user_language']['subject_forgotten_password'] : $translations['en']['subject_forgotten_password'];
                        $mail_registered_message = isset($translations['user_language']['mail_password_changed_message']) ? $translations['user_language']['mail_password_changed_message'] : $translations['en']['mail_password_changed_message'];
                        $fromEmailAddress = 'noreply@english3.com';
                        $input->fname = $mysql_fname;
                        $input->lname = $mysql_lname;
                        $input->domain = $_SERVER['HTTP_ORIGIN'];
                        $message = mail_message($translations, $input, $generated_password, $mail_registered_message);
                        $headers = 'MIME-Version: 1.0' . "\r\n";
                        $headers .= 'Content-type: text/html;' . "\r\n";
                        $headers .= 'From: '.$fromEmailAddress;
                        //send_mail_locally($subject,$input,$message);
                        $u = new User();
                        $u->setFirstName($input->fname);
                        $u->setLastName($input->lname);
                        $u->setEmail($input->email);
                        $mailer = new TemplateResetPassword($u,$translations, $input, $generated_password, $mail_registered_message);
                        $mailer->sendEmail([$input->email],mail_message($translations, $input, $generated_password, $mail_registered_message),"Password Reset");
//                        if (mail($to, $subject, $message, $headers,'-f'.$fromEmailAddress)) {
//                            $mailed = 'Mailed';
//                        }
                        $data->message = 'successful';
                        $data->email = $mysql_email;
                        $data->password = $generated_password;
                        $data->mailed = $mailed;
                        header('Content-Type: application/json');
                        print json_encode($data);
                        exit();
                    } else {
                        header('Content-Type: application/json');
                        $data->message = 'An unexpected error has ocurred';
                        print json_encode($data);
                        exit();
                    }

                } else {
                    header('Content-Type: application/json');
                    $data->message = 'Sorry! The email you provided doesn\'t not exist in our records.';
                    print json_encode($data);
                    exit();
                }
            }
            header('Content-Type: application/json');
            $data->message = 'Please, insert your email';
            print json_encode($data);
            exit();
        }
    }
}


?>