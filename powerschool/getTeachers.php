<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 5/15/17
 * Time: 9:56 PM
 */
require("powerSchoolApi.php");
require("local_conn.php");

$ps = new powerSchoolApi();

$get_teachers = json_decode($ps->get_teachers(),true);

$teachers = $get_teachers['record'];
$teacherids = [];

foreach($teachers as $teacher) {
    array_push($teacherids,$teacher["teacherid"]);
}
$teacherids = array_unique($teacherids);
$teacherid_string = implode(",",$teacherids);

$in = mysqli_escape_string($local_conn, $teacherid_string);

$query = "SELECT id, fname, lname FROM users WHERE external_id IN ({$in}) ORDER BY id DESC";

$rows = $local_conn->query($query);
$preJSON = [];
while($row = $rows->fetch_assoc()) {
    array_push($preJSON,$row);
}

$json = json_encode($preJSON);

echo $json;