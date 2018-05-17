<?php

function db_query($DB, $query) {
    $rows = [];
    $result = $DB->mysqli->query($query);

    if (!$result) {
        throw new Exception("Qatabase query failed with error: " . $DB->mysqli->error . ".\n\nQuery: " .$query);
    }
    while($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    return $rows;
}

?>

