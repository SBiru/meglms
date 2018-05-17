<?php
use English3\Controller\Classes\ClassSuperUnits;
use English3\Controller\Organization\OrganizationController;

require_once('_utils.php');
require_once('usertools/orm.php');
require_once('sql.php');
global $PATHS, $DB;

is_valid_user($_SESSION,true);
$user = new PmOrm($_SESSION,$DB);
$user_id = $user->user_id;
//if($user->am_i_teacher()){
//
//} else {
//    $user_id = is_admin_user(0,$DB,true);
//}

/**
 * addUsersToClass() will enroll the users in the provided array of user IDs into the class with the ID provided in the
 * The $userIdsArray can be an array of user IDs or an array of user external IDs.
 *
 * @param $classId The ID of the class that users are being enrolled into
 * @param $userIdsArray An Array of strings with either user IDs or external user IDs
 * @return error message or blank string
 */
function addUsersToClass($classId, $userIdsArray)
{
    global $DB;

    // Set some default values
    $returnVal = "";
    $is_student = '1';
    $is_teacher = '0';
    $is_edit_teacher = '0';

    $addClass = false;
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
            $addClass = true;
        } else {
            // Next we check if that class ID that was specified is actually a external id
            $queryForExistingClassByExternalId = "SELECT id FROM classes WHERE external_id=$classId";
            $resultForExistingClassByExternalId = $DB->mysqli->query($queryForExistingClassByExternalId);
            if ($resultForExistingClassByExternalId && $resultForExistingClassByExternalId->num_rows > 0) {
                $classRow = $resultForExistingClassByExternalId->fetch_object();
                $mysql_classid = intval($classRow->id);
                $addClass = true;
            }
        }
    } else {
        // Next we check if that class ID that was specified is actually a external id
        $queryForExistingClassByExternalId = "SELECT id FROM classes WHERE external_id='{$classId}'";
        $resultForExistingClassByExternalId = $DB->mysqli->query($queryForExistingClassByExternalId);
        if ($resultForExistingClassByExternalId && $resultForExistingClassByExternalId->num_rows > 0) {
            $classRow = $resultForExistingClassByExternalId->fetch_object();
            $mysql_classid = intval($classRow->id);
            $addClass = true;
        }
    }

    // Handle adding the class to every user specified in the user_ids input
    foreach ($userIdsArray as $userId) {
        $addUser = false;

        // If a numeric userID was provided, we check if the provided ID is a valid
        // user ID. If it is not a valid user ID then we check if it is a valid
        // external user ID.
        if (is_numeric($userId)) {
            $mysql_userid = intval($userId);
            // First we check if a user with the provided ID exists
            $queryForExistingUserById = "SELECT fname FROM users WHERE id=$mysql_userid";
            $resultForExistingUserById = $DB->mysqli->query($queryForExistingUserById);

            // If a user with the provided ID exists, add the user to the class
            if ($resultForExistingUserById && $resultForExistingUserById->num_rows > 0) {
                $addUser = true;
            } else {
                // Next we check if that user ID that was specified is actually a external id
                $queryForExistingUserByExternalId = "SELECT id FROM users WHERE external_id=$mysql_userid";
                $resultForExistingUserByExternalId = $DB->mysqli->query($queryForExistingUserByExternalId);
                if ($resultForExistingUserByExternalId && $resultForExistingUserByExternalId->num_rows > 0) {
                    $userRow = $resultForExistingUserByExternalId->fetch_object();
                    $mysql_userid = intval($userRow->id);
                    $addUser = true;
                }
            }
        } else {
            // Next we check if that user ID that was specified is actually a external user id
            $queryForExistingUserByExternalId = "SELECT id FROM users WHERE external_id='{$userId}'";
            $resultForExistingUserByExternalId = $DB->mysqli->query($queryForExistingUserByExternalId);
            if ($resultForExistingUserByExternalId && $resultForExistingUserByExternalId->num_rows > 0) {
                $userRow = $resultForExistingUserByExternalId->fetch_object();
                $mysql_userid = intval($userRow->id);
                $addUser = true;
            }
        }

        // If we have found an existing class with the provided ID, add the user to that class.
        // Otherwise, give an error.
        if ($addUser && $addClass) {
            $newEnrollmentQuery = "INSERT INTO user_classes (userid, classid, is_student, is_teacher, is_edit_teacher) VALUES
											({$mysql_userid},{$mysql_classid},{$is_student},{$is_teacher},{$is_edit_teacher})";
            $DB->mysqli->query($newEnrollmentQuery);
        } else {
            $returnVal .= " - Invalid class ID " . $classId . " provided - ";
        }
    }
    return $returnVal;
}

function addClass($input){
    GLOBAL $DB;
    $data = new \stdClass();

    $course_id = (isset($input->course_id))? intval($input->course_id): 0;

    $query = "SELECT id FROM courses WHERE id={$course_id}";

    $result = $DB->mysqli->query($query);

    $mysql_chat_mode_code = intval($input->chat_mode_code);

    // The Grade Scale variables
    $is_active = intval($input->is_active);
    $hide_exempted_activities = intval($input->hide_exempted_activities);
    $exclude_from_alerts = intval($input->exclude_from_alerts);
    $use_super_units = intval($input->use_super_units);
    $a_plus_max = intval($input->a_plus_max);
    $a_plus_min = intval($input->a_plus_min);

    $a_max = intval($input->a_max);
    $a_plus_min = $a_plus_min?:$a_max+1;
    $a_max = intval($input->a_max);
    $a_min = intval($input->a_min);
    $a_minus_max = intval($input->a_minus_max);
    $a_minus_min = intval($input->a_minus_min);
    $b_plus_max = intval($input->b_plus_max);
    $b_plus_min = intval($input->b_plus_min);
    $b_max = intval($input->b_max);
    $b_min = intval($input->b_min);
    $b_minus_max = intval($input->b_minus_max);
    $b_minus_min = intval($input->b_minus_min);
    $c_plus_max = intval($input->c_plus_max);
    $c_plus_min = intval($input->c_plus_min);
    $c_max = intval($input->c_max);
    $c_min = intval($input->c_min);
    $c_minus_max = intval($input->c_minus_max);
    $c_minus_min = intval($input->c_minus_min);
    $d_plus_max = intval($input->d_plus_max);
    $d_plus_min = intval($input->d_plus_min);
    $d_max = intval($input->d_max);
    $d_min = intval($input->d_min);
    $d_minus_max = intval($input->d_minus_max);
    $d_minus_min = intval($input->d_minus_min);

    $use_grade_a_plus = '1';
    $use_grade_a = '1';
    $use_grade_a_minus = '1';
    $use_grade_b_plus = '1';
    $use_grade_b = '1';
    $use_grade_b_minus = '1';
    $use_grade_c_plus = '1';
    $use_grade_c = '1';
    $use_grade_c_minus = '1';
    $use_grade_d_plus = '1';
    $use_grade_d = '1';
    $use_grade_d_minus = '1';

    if(isset($input->use_grade_a_plus)){$use_grade_a_plus = $input->use_grade_a_plus;}
    if(isset($input->use_grade_a)){$use_grade_a = $input->use_grade_a;}
    if(isset($input->use_grade_a_minus)){$use_grade_a_minus = $input->use_grade_a_minus;}
    if(isset($input->use_grade_b_plus)){$use_grade_b_plus = $input->use_grade_b_plus;}
    if(isset($input->use_grade_b)){$use_grade_b = $input->use_grade_b;}
    if(isset($input->use_grade_b_minus)){$use_grade_b_minus = $input->use_grade_b_minus;}
    if(isset($input->use_grade_c_plus)){$use_grade_c_plus = $input->use_grade_c_plus;}
    if(isset($input->use_grade_c)){$use_grade_c = $input->use_grade_c;}
    if(isset($input->use_grade_c_minus)){$use_grade_c_minus = $input->use_grade_c_minus;}
    if(isset($input->use_grade_d_plus)){$use_grade_d_plus = $input->use_grade_d_plus;}
    if(isset($input->use_grade_d)){$use_grade_d = $input->use_grade_d;}
    if(isset($input->use_grade_d_minus)){$use_grade_d_minus = $input->use_grade_d_minus;}


    if ($result && $result->num_rows == 1) {
        $mysql_name = $DB->mysqli->real_escape_string($input->name);
        $mysql_external_id = $DB->mysqli->real_escape_string($input->external_id);
        $mysql_lms_id = $DB->mysqli->real_escape_string($input->LMS_id);
        $show_table_of_contents = '0';
        $show_dates = '0';
        $show_grades = '0';
        $show_grades_as_score = '0';
        $show_grades_as_letter = '0';
        $show_grades_as_percentage = '0';


        if (isset($input->show_table_of_contents)) {
            $show_table_of_contents = intval($input->show_table_of_contents);
        }
        if (isset($input->show_dates)) {
            $show_dates = intval($input->show_dates);
        }
        if (isset($input->show_grades)) {
            $show_grades = intval($input->show_grades);
        }
        if (isset($input->show_grades_as_score)) {
            $show_grades_as_score = intval($input->show_grades_as_score);
        }
        if (isset($input->show_grades_as_letter)) {
            $show_grades_as_letter = intval($input->show_grades_as_letter);
        }
        if (isset($input->show_grades_as_percentage)) {
            $show_grades_as_percentage = intval($input->show_grades_as_percentage);
        }
        $default_exempt_points = isset($input->default_exempt_points)?$input->default_exempt_points:'null';
        $is_j1_class = isset($input->is_j1_class)?$input->is_j1_class:'null';

        if (strlen($mysql_name) > 0) {
            $doInsert = true;
            if (isset($input->id)) {
                $mysql_class_id = intval($input->id);
                $queryForExisting = "SELECT name FROM classes WHERE id = {$mysql_class_id}";
                $resultForExisting = $DB->mysqli->query($queryForExisting);
                if ($resultForExisting->num_rows == 1) {
                    $doInsert = false;
                }
            }
            if ($doInsert) {
                $query = "INSERT INTO classes(courseid, name, is_active, hide_exempted_activities, exclude_from_alerts, use_super_units,show_dates, show_grades, chat_mode_code,
                              show_grades_as_score, show_grades_as_letter, show_grades_as_percentage, a_plus_max,
                              a_plus_min, a_max, a_min, a_minus_max, a_minus_min, b_plus_max, b_plus_min, b_max, b_min,
                              b_minus_max, b_minus_min, c_plus_max, c_plus_min, c_max, c_min, c_minus_max, c_minus_min,
                              d_plus_max, d_plus_min, d_max, d_min, d_minus_max, d_minus_min, use_grade_a_plus,
                              use_grade_a, use_grade_a_minus, use_grade_b_plus, use_grade_b, use_grade_b_minus,
                              use_grade_c_plus, use_grade_c, use_grade_c_minus, use_grade_d_plus, use_grade_d,
                              use_grade_d_minus,external_id,LMS_id,default_exempt_points,is_j1_class,show_table_of_contents)
                          VALUES ($course_id, '{$mysql_name}', {$is_active}, {$hide_exempted_activities}, {$exclude_from_alerts}, {$use_super_units},{$show_dates},{$show_grades}, $mysql_chat_mode_code,
                          {$show_grades_as_score},{$show_grades_as_letter}, {$show_grades_as_percentage},{$a_plus_max},
                          {$a_plus_min},{$a_max},{$a_min},{$a_minus_max},{$a_minus_min},{$b_plus_max},{$b_plus_min},
                          {$b_max},{$b_min},{$b_minus_max},{$b_minus_min},{$c_plus_max},{$c_plus_min},{$c_max},{$c_min},
                          {$c_minus_max},{$c_minus_min},{$d_plus_max},{$d_plus_min},{$d_max},{$d_min},{$d_minus_max},
                          {$d_minus_min},{$use_grade_a_plus},{$use_grade_a},{$use_grade_a_minus},{$use_grade_b_plus},
                          {$use_grade_b},{$use_grade_b_minus},{$use_grade_c_plus},{$use_grade_c},{$use_grade_c_minus},
                          {$use_grade_d_plus},{$use_grade_d},{$use_grade_d_minus},'{$mysql_external_id}','{$mysql_lms_id}',
                          {$default_exempt_points},{$is_j1_class},{$show_table_of_contents})";

                $DB->mysqli->query($query);
                $query = "SELECT id FROM classes WHERE courseid={$course_id}";
                $classId=$DB->mysqli->query($query)->fetch_object();
                $orgId = OrganizationController::_getOrgFromClassId($classId->id);
                if($orgId==10){
                    $query="INSERT INTO class_meta(classid,meta_key,meta_value) VALUES( $course_id,'show_for_student',1)";
                    $DB->mysqli->query($query);
                    }
                $data->message = 'successful';
                $data->query = $query;
                $data->class_id = $DB->mysqli->insert_id;
                if(boolval($use_super_units)){
                    $c = new ClassSuperUnits($data->class_id);
                    $c->allowSuperUnits();
                }
            }
        }
    }
    return $data;
}


$uri = strtok($_SERVER['REQUEST_URI'], '?');

$uri = str_replace('/editcourseclass/', '', $uri);

$action = strtok($uri, '/');

if($action == 'save') {

    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $json_input = file_get_contents('php://input');

        $input = json_decode($json_input);

        $data = new \stdClass();

        $course_id = (isset($input->course_id))? intval($input->course_id): 0;

        $query = "SELECT id FROM courses WHERE id={$course_id}";

        $result = $DB->mysqli->query($query);

        $mysql_chat_mode_code = intval($input->chat_mode_code);

        // The Grade Scale variables
        $is_active = intval($input->is_active);
        $hide_exempted_activities = intval($input->hide_exempted_activities);
        $exclude_from_alerts = intval($input->exclude_from_alerts);
        $use_super_units = intval($input->use_super_units);
        $a_plus_max = intval($input->a_plus_max);
        $a_plus_min = intval($input->a_plus_min);
        $a_max = intval($input->a_max);
        $a_min = intval($input->a_min);
        $a_minus_max = intval($input->a_minus_max);
        $a_minus_min = intval($input->a_minus_min);
        $b_plus_max = intval($input->b_plus_max);
        $b_plus_min = intval($input->b_plus_min);
        $b_max = intval($input->b_max);
        $b_min = intval($input->b_min);
        $b_minus_max = intval($input->b_minus_max);
        $b_minus_min = intval($input->b_minus_min);
        $c_plus_max = intval($input->c_plus_max);
        $c_plus_min = intval($input->c_plus_min);
        $c_max = intval($input->c_max);
        $c_min = intval($input->c_min);
        $c_minus_max = intval($input->c_minus_max);
        $c_minus_min = intval($input->c_minus_min);
        $d_plus_max = intval($input->d_plus_max);
        $d_plus_min = intval($input->d_plus_min);
        $d_max = intval($input->d_max);
        $d_min = intval($input->d_min);
        $d_minus_max = intval($input->d_minus_max);
        $d_minus_min = intval($input->d_minus_min);

        $use_grade_a_plus = '1';
        $use_grade_a = '1';
        $use_grade_a_minus = '1';
        $use_grade_b_plus = '1';
        $use_grade_b = '1';
        $use_grade_b_minus = '1';
        $use_grade_c_plus = '1';
        $use_grade_c = '1';
        $use_grade_c_minus = '1';
        $use_grade_d_plus = '1';
        $use_grade_d = '1';
        $use_grade_d_minus = '1';

        if(isset($input->use_grade_a_plus)){$use_grade_a_plus = $input->use_grade_a_plus;}
        if(isset($input->use_grade_a)){$use_grade_a = $input->use_grade_a;}
        if(isset($input->use_grade_a_minus)){$use_grade_a_minus = $input->use_grade_a_minus;}
        if(isset($input->use_grade_b_plus)){$use_grade_b_plus = $input->use_grade_b_plus;}
        if(isset($input->use_grade_b)){$use_grade_b = $input->use_grade_b;}
        if(isset($input->use_grade_b_minus)){$use_grade_b_minus = $input->use_grade_b_minus;}
        if(isset($input->use_grade_c_plus)){$use_grade_c_plus = $input->use_grade_c_plus;}
        if(isset($input->use_grade_c)){$use_grade_c = $input->use_grade_c;}
        if(isset($input->use_grade_c_minus)){$use_grade_c_minus = $input->use_grade_c_minus;}
        if(isset($input->use_grade_d_plus)){$use_grade_d_plus = $input->use_grade_d_plus;}
        if(isset($input->use_grade_d)){$use_grade_d = $input->use_grade_d;}
        if(isset($input->use_grade_d_minus)){$use_grade_d_minus = $input->use_grade_d_minus;}


        if ($result && $result->num_rows == 1) {
            $mysql_name = $DB->mysqli->real_escape_string($input->name);
            $mysql_external_id = $DB->mysqli->real_escape_string($input->external_id);
            $mysql_lms_id = $DB->mysqli->real_escape_string($input->LMS_id);
            $show_dates = '0';
            $show_grades = '0';
            $show_grades_as_score = '0';
            $show_grades_as_letter = '0';
            $show_grades_as_percentage = '0';

            if(isset($input->show_dates)){
                $show_dates = intval($input->show_dates);
            }
            if(isset($input->show_grades)){
                $show_grades = intval($input->show_grades);
            }
            if(isset($input->show_grades_as_score)){
                $show_grades_as_score = intval($input->show_grades_as_score);
            }
            if(isset($input->show_grades_as_letter)){
                $show_grades_as_letter = intval($input->show_grades_as_letter);
            }
            if(isset($input->show_grades_as_percentage)){
                $show_grades_as_percentage = intval($input->show_grades_as_percentage);
            }
            $default_exempt_points = isset($input->default_exempt_points) && $input->default_exempt_points?$input->default_exempt_points:'null';
            $is_j1_class = isset($input->is_j1_class)?$input->is_j1_class:'null';
            if(strlen($mysql_name) > 0) {
                $doInsert = true;
                if(isset($input->id)){
                    $mysql_class_id = intval($input->id);
                    $queryForExisting = "SELECT name FROM classes WHERE id = {$mysql_class_id}";
                    $resultForExisting = $DB->mysqli->query($queryForExisting);
                    if($resultForExisting->num_rows == 1){
                        $doInsert = false;
                    }
                }
                if($doInsert) {
                    $query = "INSERT INTO classes(courseid, name, is_active, hide_exempted_activities, exclude_from_alerts, use_super_units,show_dates, show_grades, chat_mode_code,
                              show_grades_as_score, show_grades_as_letter, show_grades_as_percentage, a_plus_max,
                              a_plus_min, a_max, a_min, a_minus_max, a_minus_min, b_plus_max, b_plus_min, b_max, b_min,
                              b_minus_max, b_minus_min, c_plus_max, c_plus_min, c_max, c_min, c_minus_max, c_minus_min,
                              d_plus_max, d_plus_min, d_max, d_min, d_minus_max, d_minus_min, use_grade_a_plus,
                              use_grade_a, use_grade_a_minus, use_grade_b_plus, use_grade_b, use_grade_b_minus,
                              use_grade_c_plus, use_grade_c, use_grade_c_minus, use_grade_d_plus, use_grade_d,
                              use_grade_d_minus,external_id,LMS_id,default_exempt_points)
                          VALUES ($course_id, '{$mysql_name}', {$is_active}, {$hide_exempted_activities}, {$hide_exclude_from_alerts}, {$use_super_units},{$show_dates},{$show_grades}, $mysql_chat_mode_code,
                          {$show_grades_as_score},{$show_grades_as_letter}, {$show_grades_as_percentage},{$a_plus_max},
                          {$a_plus_min},{$a_max},{$a_min},{$a_minus_max},{$a_minus_min},{$b_plus_max},{$b_plus_min},
                          {$b_max},{$b_min},{$b_minus_max},{$b_minus_min},{$c_plus_max},{$c_plus_min},{$c_max},{$c_min},
                          {$c_minus_max},{$c_minus_min},{$d_plus_max},{$d_plus_min},{$d_max},{$d_min},{$d_minus_max},
                          {$d_minus_min},{$use_grade_a_plus},{$use_grade_a},{$use_grade_a_minus},{$use_grade_b_plus},
                          {$use_grade_b},{$use_grade_b_minus},{$use_grade_c_plus},{$use_grade_c},{$use_grade_c_minus},
                          {$use_grade_d_plus},{$use_grade_d},{$use_grade_d_minus},'{$mysql_external_id}','{$mysql_lms_id}',{$default_exempt_points},{$is_j1_class})";

                    $DB->mysqli->query($query);

                    $data->message = 'successful';
                    $data->query = $query;
                    $data->class_id = $DB->mysqli->insert_id;
                    if(boolval($use_super_units)){
                        $c = new ClassSuperUnits($data->class_id);
                        $c->allowSuperUnits();
                    }
                } else {
                    $query = "UPDATE classes SET name='{$mysql_name}',is_active='{$is_active}',hide_exempted_activities='{$hide_exempted_activities}',hide_exempted_activities='{$exclude_from_alerts}',use_super_units='{$use_super_units}', show_dates={$show_dates} ,
                              show_grades={$show_grades}, chat_mode_code = {$mysql_chat_mode_code},
                              show_grades_as_score = {$show_grades_as_score}, show_grades_as_letter = {$show_grades_as_letter},
                              show_grades_as_percentage = {$show_grades_as_percentage}, a_plus_max= {$a_plus_max},
                              a_plus_min = {$a_plus_min}, a_max = {$a_max}, a_min = {$a_min}, a_minus_max = {$a_minus_max},
                              a_minus_min = {$a_minus_min}, b_plus_max = {$b_plus_max}, b_plus_min = {$b_plus_min},
                              b_max = {$b_max}, b_min = {$b_min}, b_minus_max  = {$b_minus_max},
                              b_minus_min = {$b_minus_min}, c_plus_max = {$c_plus_max}, c_plus_min = {$c_plus_min},
                              c_max  = {$c_max}, c_min  = {$c_min}, c_minus_max = {$c_minus_max}, c_minus_min = {$c_minus_min},
                              d_plus_max = {$d_plus_max}, d_plus_min = {$d_plus_min}, d_max = {$d_max},d_min = {$d_min},
                              d_minus_max = {$d_minus_max}, d_minus_min = {$d_minus_min}, use_grade_a_plus = {$use_grade_a_plus},
                              use_grade_a = {$use_grade_a}, use_grade_a_minus = {$use_grade_a_minus},
                              use_grade_b_plus = {$use_grade_b_plus}, use_grade_b = {$use_grade_b},
                              use_grade_b_minus = {$use_grade_b_minus}, use_grade_c_plus = {$use_grade_c_plus},
                              use_grade_c = {$use_grade_c}, use_grade_c_minus = {$use_grade_c_minus},
                              use_grade_d_plus = {$use_grade_d_plus}, use_grade_d = {$use_grade_d},
                              use_grade_d_minus = {$use_grade_d_minus} , external_id= '{$mysql_external_id}',
                              LMS_id = ,'{$mysql_lms_id}',
                              expiration_date={$mysql_expiration_date},default_exempt_points={$default_exempt_points},
                              is_j1_class={$is_j1_class}

                              WHERE id={$mysql_class_id}";
                    $DB->mysqli->query($query);
                    $data->message = 'successful';
                    $data->query = $query;
                    $data->class_id = $mysql_class_id;
                    if(boolval($use_super_units)){
                        $c = new ClassSuperUnits($data->class_id);
                        $c->allowSuperUnits();
                    }
                }

                // If there is some entry for the user_ids array, we enroll these users in the class.
                if (!empty($input->user_ids)) {
                    $data->message .= addUsersToClasses($data->class_id, $input->user_ids);
                }
            } else {
                $data->message = 'Please Provide Class Name: ' . $input->name;
            }

            header('Content-Type: application/json');
            print json_encode($data);
            exit();
        }
        print "NumRows Not 1";
        exit();
    }
    print("was not post");
    exit();


} else if($action == 'update') {
    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $json_input = file_get_contents('php://input');

        $input = json_decode($json_input);

        $data = new \stdClass();
        unset($input->meta->no_menu);
        $class_id = intval($input->id);
        $mysql_name   = $DB->mysqli->real_escape_string($input->name);
        $mysql_external_id = $DB->mysqli->real_escape_string($input->external_id);
        $mysql_lms_id = $DB->mysqli->real_escape_string($input->LMS_id);
        $show_dates=$input->show_dates?'1':'0';
        $show_grades=$input->show_grades?'1':'0';
        $show_grades_as_score=$input->show_grades_as_score?'1':'0';
        $show_grades_as_letter=$input->show_grades_as_letter?'1':'0';
        $show_grades_as_percentage=$input->show_grades_as_percentage?'1':'0';

        $mysql_chat_mode_code = intval($input->chat_mode_code);

        // The Grade Scale variables
        $is_active = intval($input->is_active);
        $hide_exempted_activities = intval($input->hide_exempted_activities);
        $exclude_from_alerts = intval($input->exclude_from_alerts);
        $use_super_units = intval($input->use_super_units);
        $a_plus_max = intval($input->a_plus_max);
        $a_plus_min = intval($input->a_plus_min);
        $a_max = intval($input->a_max);
        $a_plus_min = $a_plus_min?:$a_max+1;
        $a_min = intval($input->a_min);
        $a_minus_max = intval($input->a_minus_max);
        $a_minus_min = intval($input->a_minus_min);
        $b_plus_max = intval($input->b_plus_max);
        $b_plus_min = intval($input->b_plus_min);
        $b_max = intval($input->b_max);
        $b_min = intval($input->b_min);
        $b_minus_max = intval($input->b_minus_max);
        $b_minus_min = intval($input->b_minus_min);
        $c_plus_max = intval($input->c_plus_max);
        $c_plus_min = intval($input->c_plus_min);
        $c_max = intval($input->c_max);
        $c_min = intval($input->c_min);
        $c_minus_max = intval($input->c_minus_max);
        $c_minus_min = intval($input->c_minus_min);
        $d_plus_max = intval($input->d_plus_max);
        $d_plus_min = intval($input->d_plus_min);
        $d_max = intval($input->d_max);
        $d_min = intval($input->d_min);
        $d_minus_max = intval($input->d_minus_max);
        $d_minus_min = intval($input->d_minus_min);

        $use_grade_a_plus = '1';
        $use_grade_a = '1';
        $use_grade_a_minus = '1';
        $use_grade_b_plus = '1';
        $use_grade_b = '1';
        $use_grade_b_minus = '1';
        $use_grade_c_plus = '1';
        $use_grade_c = '1';
        $use_grade_c_minus = '1';
        $use_grade_d_plus = '1';
        $use_grade_d = '1';
        $use_grade_d_minus = '1';

        if(isset($input->use_grade_a_plus)){$use_grade_a_plus = $input->use_grade_a_plus?'1':'0';}
        if(isset($input->use_grade_a)){$use_grade_a = $input->use_grade_a?'1':'0';}
        if(isset($input->use_grade_a_minus)){$use_grade_a_minus = $input->use_grade_a_minus?'1':'0';}
        if(isset($input->use_grade_b_plus)){$use_grade_b_plus = $input->use_grade_b_plus?'1':'0';}
        if(isset($input->use_grade_b)){$use_grade_b = $input->use_grade_b?'1':'0';}
        if(isset($input->use_grade_b_minus)){$use_grade_b_minus = $input->use_grade_b_minus?'1':'0';}
        if(isset($input->use_grade_c_plus)){$use_grade_c_plus = $input->use_grade_c_plus?'1':'0';}
        if(isset($input->use_grade_c)){$use_grade_c = $input->use_grade_c?'1':'0';}
        if(isset($input->use_grade_c_minus)){$use_grade_c_minus = $input->use_grade_c_minus?'1':'0';}
        if(isset($input->use_grade_d_plus)){$use_grade_d_plus = $input->use_grade_d_plus?'1':'0';}
        if(isset($input->use_grade_d)){$use_grade_d = $input->use_grade_d?'1':'0';}
        if(isset($input->use_grade_d_minus)){$use_grade_d_minus = $input->use_grade_d_minus?'1':'0';}

        $mysql_expiration_date = isset($input->expiration_date) && $input->expiration_date!="" ? (new DateTime($input->expiration_date))->format("Y-m-d H:i:s") : false;
        $mysql_expiration_date=$mysql_expiration_date?"'{$mysql_expiration_date}'":'null';
        $default_exempt_points = isset($input->default_exempt_points)&&$input->default_exempt_points?$input->default_exempt_points:'null';
        $is_j1_class = isset($input->is_j1_class) && boolval($input->is_j1_class)?1:'null';

        $term_id = isset($input->term_id)?$input->term_id:'NULL';
        $show_table_of_contents = '0';
        if(isset($input->show_table_of_contents)){
            $show_table_of_contents = intval($input->show_table_of_contents);
        }
        if(isset($input->show_unit_tabs)){
            $flag = intval($input->show_unit_tabs);
            $unitTabsUpdate = ", show_unit_tabs = '{$flag}'";
        }else{
            $unitTabsUpdate = '';
        }
        if(strlen($mysql_name) > 0) {
            $query = "UPDATE classes SET name='{$mysql_name}', show_dates={$show_dates} , show_grades={$show_grades}, term_id = {$term_id
}, chat_mode_code = {$mysql_chat_mode_code}, show_grades_as_score = {$show_grades_as_score}, show_grades_as_letter = {$show_grades_as_letter}, show_grades_as_percentage = {$show_grades_as_percentage}, a_plus_max= {$a_plus_max}, a_plus_min= {$a_plus_min}, is_active = {$is_active}, a_max = {$a_max}, a_min = {$a_min}, a_minus_max = {$a_minus_max}, a_minus_min = {$a_minus_min}, b_plus_max = {$b_plus_max}, b_plus_min = {$b_plus_min}, b_max = {$b_max}, b_min = {$b_min}, b_minus_max  = {$b_minus_max},b_minus_min = {$b_minus_min}, c_plus_max = {$c_plus_max}, c_plus_min = {$c_plus_min}, c_max  = {$c_max}, c_min  = {$c_min}, c_minus_max = {$c_minus_max}, c_minus_min = {$c_minus_min}, d_plus_max = {$d_plus_max}, d_plus_min = {$d_plus_min}, d_max = {$d_max},d_min = {$d_min}, d_minus_max = {$d_minus_max}, d_minus_min = {$d_minus_min}, use_grade_a_plus = {$use_grade_a_plus}, use_grade_a = {$use_grade_a}, use_grade_a_minus = {$use_grade_a_minus}, use_grade_b_plus = {$use_grade_b_plus}, use_grade_b = {$use_grade_b}, use_grade_b_minus = {$use_grade_b_minus}, use_grade_c_plus = {$use_grade_c_plus},use_grade_c = {$use_grade_c}, use_grade_c_minus = {$use_grade_c_minus}, use_grade_d_plus = {$use_grade_d_plus}, use_grade_d = {$use_grade_d}, use_grade_d_minus = {$use_grade_d_minus} , external_id= '{$mysql_external_id}',LMS_id='{$mysql_lms_id}',expiration_date={$mysql_expiration_date},hide_exempted_activities={$hide_exempted_activities},exclude_from_alerts={$exclude_from_alerts},use_super_units={$use_super_units},default_exempt_points={$default_exempt_points},is_j1_class={$is_j1_class},show_table_of_contents={$show_table_of_contents} {$unitTabsUpdate}  WHERE id={$class_id}";

            $DB->mysqli->query($query);
            $data->message = 'successful';
            $data->query = $query;
        } else {
            $data->message = 'Class Name Must Not Be Empty';
            $data->query = $query;
        }
        $c = new ClassSuperUnits($class_id);
        if(boolval($use_super_units)){
            $c->allowSuperUnits();
        }else{
            $c->disableSuperUnits();
        }
        if($input->meta){
            $courseId = \English3\Controller\Utility::getInstance()->fetchOne("SELECT courseid from classes where id = ".$class_id);
            foreach ($input->meta as $key=>$value){
                if(gettype($value)=== 'boolean'){
                    $value = intval($value);
                }

                \English3\Controller\Utility::getInstance()->executeUpdate(
                    "INSERT  INTO class_meta (classid,meta_key,meta_value) values (:classId,:key,:value) ON duplicate key update meta_value = values(meta_value)",
                    ['classId'=>$courseId,'key'=>$key,'value'=>$value]
                );
            }
        }


        header('Content-Type: application/json');
        print json_encode($data);
        exit();
    }
} else if($action == 'delete') {
    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $sql = new BaseSQL();
        $json_input = file_get_contents('php://input');

        $input = json_decode($json_input);

        $data = new \stdClass();

        $class_id = intval($input->id);

        $query = "SELECT courseid FROM classes WHERE id={$class_id}";
        $courseid = $sql->fetch_one($query)->courseid;
        \English3\Controller\Classes\UserClassHistory::moveAllToClassHistory($class_id);
        \English3\Controller\Utility::moveToHistory('classes','classes_history',$class_id);
        $sql->query_noResult("DELETE FROM courses where id ={$courseid}");
        $sql->query_noResult("DELETE FROM user_classes where classid ={$class_id}");

        $data->status='success';
        header('Content-Type: application/json');
        print json_encode($data);
        exit();
    }

}  else if(is_numeric($action) && $action > 0) {
    $action = intval($action);
    $user_id = intval($_SESSION['USER']['ID']);
    $classSQL = new ClassSQL();
    $query = "SELECT classes.id,
                     classes.name as className,
                     classes.LMS_id,
                     classes.external_id,
                     courses.name as courseName,
                     courses.description as courseDescription,
                     courses.id as courseId,
                     show_dates, show_grades,
                     show_grades_as_score, show_grades_as_letter, show_grades_as_percentage,
                     courses.native_language,
                     classes.term_id,
                     classes.is_active,
                     classes.chat_mode_code,
                     classes.a_plus_max,classes.a_plus_min,classes.a_max,classes.a_min,classes.a_minus_max,classes.a_minus_min,classes.b_plus_max,classes.b_plus_min,classes.b_max,classes.b_min,classes.b_minus_max,classes.b_minus_min,classes.c_plus_max,classes.c_plus_min,classes.c_max,classes.c_min,classes.c_minus_max,classes.c_minus_min,classes.d_plus_max,classes.d_plus_min,classes.d_max,classes.d_min,classes.d_minus_max,classes.d_minus_min,classes.use_grade_a_plus,classes.use_grade_a,classes.use_grade_a_minus,classes.use_grade_b_plus,classes.use_grade_b,classes.use_grade_b_minus,classes.use_grade_c_plus,classes.use_grade_c,classes.use_grade_c_minus,classes.use_grade_d_plus,classes.use_grade_d,classes.use_grade_d_minus,
                     classes.expiration_date,
                     classes.hide_exempted_activities,
                     classes.exclude_from_alerts,
                     classes.use_super_units,
                     classes.default_exempt_points,
                     classes.show_unit_tabs,
                     classes.is_j1_class,
                     classes.show_table_of_contents,
                     departments.id as departmentId,
                     departments.organizationid as orgId,
                     organizations.sort_users_by,
                     organizations.enable_credited_assignments
				FROM classes
				JOIN courses on classes.courseid=courses.id
				JOIN departments on courses.departmentid = departments.id
				JOIN organizations ON departments.organizationid = organizations.id
				WHERE classes.id={$action} LIMIT 1";

    $result = $DB->mysqli->query($query);

    if($result && $result->num_rows == 1) {
        $row = $result->fetch_object();

        $data = new \stdClass();
        $data  = clone $row;
        $data->hide_exempted_activities = boolval($data->hide_exempted_activities);
        $data->exclude_from_alerts = boolval($data->exclude_from_alerts);
        $data->enable_credited_assignments = boolval($data->enable_credited_assignments);
        $data->default_exempt_points = boolval($data->default_exempt_points)?intval($data->default_exempt_points):95;
        if($data->show_unit_tabs===null){
            $data->show_unit_tabs = boolval(OrganizationController::_getField($data->orgId,'show_unit_tabs'));
        }else{
            $data->show_unit_tabs = boolval($data->show_unit_tabs);
        }
        $data->show_table_of_contents = $data->show_table_of_contents===null?false:boolval($data->show_table_of_contents);
        $data->use_super_units = boolval($data->use_super_units);
        $data->meta = $classSQL->getMeta($data->courseId);
        if(!isset($data->meta['show_breadcrumbs'])){
            $data->meta['show_breadcrumbs'] = OrganizationController::_getField($data->orgId,'show_breadcrumbs');
        }
        $data->meta['show_breadcrumbs'] = boolval($data->meta['show_breadcrumbs']);
        $data->meta['show_progress_bar'] = boolval($data->meta['show_progress_bar']);
        $data->departments = \English3\Controller\DepartmentController::_getDepartments($data->orgId);
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