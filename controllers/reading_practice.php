<?php

global $PATHS, $DB;

require(__DIR__ . '/_utils.php');

function main($DB) {
    if(!is_logged_in($_SESSION)) {
        exit();
    }

    $page_id = get_id('/reading_practice/', $_SERVER['REQUEST_URI']);

    if ($page_id <= 0) {
        exit();
    }

    $query = "SELECT * from pages
        WHERE pages.id={$page_id} AND pages.layout='READING_PRACTICE'
        LIMIT 1";

    $result = $DB->mysqli->query($query);

    if (!$result || $result->num_rows != 1) {
        exit();
    }

    $row = $result->fetch_object();

    $data = new \stdClass();
    $data->nativeLang = $row->native_lang;
    $data->targetLang = $row->target_lang;
    $data->need_password = $row->password?true:false;

    header('Content-Type: application/json');
    print json_encode($data);
    exit();
}

main($DB);

?>

