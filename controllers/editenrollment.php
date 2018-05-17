<?php

global $PATHS, $DB, $SECURITY;
require_once('usertools/orm.php');
require_once('_utils.php');
require_once('sql.php');

/**
 * addUserToClasses() will enroll the user with the provided ID into all the classes provided in the $classesArray.
 * The $classesArray can be an array of class IDs or an array of class external IDs.
 *
 * @param $userId The ID of the user that is to be enrolled
 * @param $classesArray An Array of strings with either class IDs or external IDs
 * @return error message or blank string
 */
function addUserToClasses($userId, $classId)
{
    global $DB;

    // Set some default values
    $returnVal = "";
    $is_student = '1';
    $is_teacher = '0';
    $is_edit_teacher = '0';


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

    // If we have found an existing class with the provided ID, add the user to that class.
    // Otherwise, give an error.
    if ($addUser) {
        $newEnrollmentQuery = "INSERT INTO user_classes (userid, classid, is_student, is_teacher, is_edit_teacher) VALUES
											({$userId},{$mysql_classid},{$is_student},{$is_teacher},{$is_edit_teacher})";
        $DB->mysqli->query($newEnrollmentQuery);
    } else {
        $returnVal .= " - Invalid class ID " . $classId . " provided - ";
    }

    return $returnVal;
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

    $uri = str_replace('/editenrollment/', '', $uri);

    $action = strtok($uri, '/');
    /*
     * See /public/services.js EditOrganizationUser
     */

    if ($action == 'save') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');

            $input = json_decode($json_input);

            $data = new \stdClass();
            $imported_userid = 0;
            // If a user ID was provided and it is numeric
            if (isset($input->user_id) && is_numeric($input->user_id)) {
                $imported_userid = intval($input->user_id);
            } else {
                // If the user is specified by external ID, we look up the user's ID for the  E3 system
                if ($input->user_id && strlen($input->user_id) > 0) {
                    $queryForUserId = "SELECT id FROM users WHERE external_id='{$DB->mysqli->real_escape_string($input->userid)}' LIMIT 1";
                    $userResult = $DB->mysqli->query($queryForUserId);
                    if ($userResult && $userResult->num_rows == 1) {
                        $userRow = $userResult->fetch_object();
                        $imported_userid = intval($userRow->id);
                    }
                }
            }

            addUserToClasses($imported_userid, $input->class_id);

            header('Content-Type: application/json');
            print json_encode($data);
            exit();

        }
    }
} ?>