<?php

require("local_conn.php");

$timestamp = date("r");

$sectionid = $_POST['sectionid'];
$course_name = $_POST['course_name'];
$name = $_POST['name'];

$query = "DELETE FROM lms_map WHERE sectionid = '{$sectionid}'";
$local_conn->query($query);

echo mysqli_error($local_conn);

$log_contents = file_get_contents("logs/matchmaker_history.txt");
$log_contents .= "{$timestamp}: {$usr_name} broke the link between \"{$course_name}\" and native course \"{$name}\". {$course_name} is now unmatched.\n\n";
$file_conn = fopen("logs/matchmaker_history.txt","w");
fwrite($file_conn,$log_contents);