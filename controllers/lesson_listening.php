<?php

global $PATHS, $DB;

require(__DIR__ . '/_utils.php');

function main($DB) {
    if(!is_logged_in($_SESSION)) {
        exit();
    }

    $page_id = get_id('/lesson_listening/', $_SERVER['REQUEST_URI']);

    if ($page_id <= 0) {
        exit();
    }

    // ob_start();

    $query = "SELECT * from pages
        WHERE pages.id={$page_id} AND pages.layout='LESSON_LISTENING'
        LIMIT 1";

    $result = $DB->mysqli->query($query);

    if (!$result || $result->num_rows != 1) {
        exit();
    }

    $row = $result->fetch_object();

    $data = new \stdClass();
    $data->course = $row->listen_course;
    $data->lesson = $row->listen_lesson;
    $data->numEx = $row->listen_numEx;
    $data->need_password = $row->password?true:false;

    $data->nativeLang = $row->native_lang;
    $data->targetLang = $row->target_lang;

    header('Content-Type: application/json');
    print json_encode($data);
    // ob_end_flush();
    exit();
}

main($DB);

?>
