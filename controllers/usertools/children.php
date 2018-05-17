<?php

include(__DIR__ . "/db.php");

function get_children($DB, $user_id) {
    $children = db_query($DB, "SELECT
            users.id,
            users.created,
            fname,
            lname,
            is_active,
            is_logged_in,
            email,
            organizationid
        FROM users
        JOIN user_guardians ON (user_guardians.userchildid=users.id)
        WHERE
            user_guardians.userid={$user_id}
        ORDER BY users.lname ASC");
    return $children;
}

?>
