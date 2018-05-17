<?php

require_once('_utils.php');
require_once('usertools/orm.php');
global $PATHS, $DB;



if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {

    $user_id = intval($_SESSION['USER']['ID']);
    $orm = new PmOrm($_SESSION,$DB);
    if(is_admin_user(0,$DB,false) or $orm->am_i_edit_teacher()) {
        include_once($PATHS->app_path . $PATHS->views_path . '/rubrics/index.html');
    } else {
        header("Location: http://" . $_SERVER['HTTP_HOST']);
    }
} else {
    include_once($PATHS->app_path . $PATHS->views_path . '/' . \English3\Util\CustomDomain::getSignInHtml());
}

?>