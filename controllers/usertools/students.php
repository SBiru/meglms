<?php

function get_students($DB, $user_id, $class_id) {
    $iamteacher = db_query($DB, "SELECT
        count(*)
        FROM user_classes
        WHERE
            userid={$user_id} AND
            is_teacher = 1");
    $students = db_query($DB, "SELECT
            users.id,
            users.created,
            fname,
            lname,
            is_active,
            is_logged_in,
            email,
            organizationid
        FROM users
        JOIN user_classes ON (user_classes.userid = users.id)
        WHERE
            user_classes.classid = {$class_id} AND
            user_classes.is_student = 1")
}

?>
