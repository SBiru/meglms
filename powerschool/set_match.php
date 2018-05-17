<?php
require("local_conn.php");

$timestamp = date("r");

$json = file_get_contents("php://input");
$postdata = json_decode($json,true);
$sectionid = $postdata['sectionid'];
$course_name = $postdata['course_name'];
$lmsid = $postdata['lmsid'];
$name = $postdata['name'];
$usr_name = $postdata['usr_name'];

$query = "INSERT INTO lms_map (sectionid, lmsid) VALUES ({$sectionid},{$lmsid}) ON DUPLICATE KEY UPDATE lmsid={$lmsid}";
$local_conn->query($query);

echo mysqli_error($local_conn);

$log_contents = file_get_contents("logs/matchmaker_history.txt");
$log_contents .= "{$timestamp}: {$usr_name} linked course \"{$course_name}\" to native course \"{$name}\".\n\n";
$file_conn = fopen("logs/matchmaker_history.txt","w");
fwrite($file_conn,$log_contents);

