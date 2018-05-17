<?php
require("local_conn.php");

$timestamp = date("r");

$json = file_get_contents("php://input");
$postdata = json_decode($json,true);
$sectionid = $postdata['sectionid'];
$course_name = $postdata['course_name'];
$usr_name = $postdata['usr_name'];
$value = $postdata['value'];

$query = "INSERT INTO is_attendance_only (sectionid, attendance_only) VALUES ({$sectionid},{$value}) ON DUPLICATE KEY UPDATE attendance_only={$value}";
$local_conn->query($query);

$text = ($value == 0) ? "NOT attendance only" : "attendance only";
$log_contents = file_get_contents("logs/matchmaker_history.txt");
$log_contents .= "{$timestamp}: {$usr_name} set course \"{$course_name}\" to {$text}.\n\n";
$file_conn = fopen("logs/matchmaker_history.txt","w");
fwrite($file_conn,$log_contents);
echo mysqli_error($local_conn);
