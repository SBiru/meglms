<?php

global $PATHS, $DB;
require_once('_utils.php');
$uri = strtok($_SERVER['REQUEST_URI'], '?');

$uri = str_replace('/languages/', '', $uri);

$translations_action = strtok($uri, '/');

$response = new \stdClass();

if ($translations_action == 'translations') {
    $translations_language_id = str_replace('translations/', '', $uri);
    $query = "SELECT * FROM localize_navs WHERE language='{$translations_language_id}'";
    $result = $DB->mysqli->query($query);

    $response->translations = array();

    while ($row = $result->fetch_object()) {
        $response->translations[] = $row;
    }

    $response->query = $query;


}
else if ($translations_action == 'update') {
    $input = get_input();

    if(!(isset($input->language_id) && isset($input->keys))){
        throwError("language_id or keys is empty");
    }

    foreach(array_keys(get_object_vars($input->keys)) as $key){
        $query = "SELECT id FROM localize_navs where language='{$input->language_id}' and localize_navs.nav_key='{$key}'";
        $result = $DB->mysqli->query($query);

        if($result->num_rows>0){
            $query = "UPDATE localize_navs SET translation = '{$input->keys->$key}' where nav_key='{$key}' and language='{$input->language_id}'";
        }
        else{
            $query = "INSERT INTO localize_navs (language,nav_key,translation)
                      VALUES  ('{$input->language_id}','{$key}','{$input->keys->$key}')";
        }
        $DB->mysqli->query($query);
        if($DB->mysqli->errno>0){
            throwError("Query error" . $DB->mysqli->error . "\nQuery:" . $query);
        }

    }
    throwError("successful");
}
else {
    $query = "SELECT * FROM languages";
    $result = $DB->mysqli->query($query);

    if (!$result || $result->num_rows <= 0) {
        // TODO report error
        exit();
    }

    $response->languages = array();

    while ($row = $result->fetch_object()) {
        $response->languages[] = $row;
    }
}
header('Content-Type: application/json');
print(json_encode($response));
exit();

?>