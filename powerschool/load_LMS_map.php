<?php
require_once("config.php");
require_once("local_conn.php");

$json = file_get_contents("php://input");
$postdata = json_decode($json,true);
$user_id = $postdata["userid"];
$is_admin = $postdata["is_admin"];
if(!$user_id) {
    $preJson = array("error"=>"ERROR: USER ID NOT FOUND");
    echo json_encode($preJson);
}
else {
    if ($user_id > 0) {
        $PSsections = "
SELECT ps.sectionid, ps.course_name,
map.lmsid, 
c.name, 
att.attendance_only 
FROM users usr 
JOIN ps_teachers ps 
  ON (ps.teacherid = usr.external_id OR ps.email = usr.email)
LEFT JOIN lms_map map 
  ON map.sectionid = ps.sectionid 
LEFT JOIN classes c 
  ON c.LMS_id = map.lmsid 
LEFT JOIN is_attendance_only att 
  ON att.sectionid = ps.sectionid 
WHERE usr.id = {$user_id} 
ORDER BY ps.sectionid DESC";
        $ELMScourses = "
SELECT c.LMS_id, c.name 
FROM classes c
JOIN user_classes usr_c 
  ON usr_c.classid = c.id
WHERE usr_c.userid = {$user_id} AND usr_c.is_teacher = 1
ORDER BY c.LMS_id DESC";
    } else {
        $PSsections = "
SELECT ps.sectionid, ps.course_name, ps.first_name, ps.last_name, ps.teacherid,
map.lmsid,
c.name,
att.attendance_only 
FROM ps_teachers ps 
LEFT JOIN is_attendance_only att
  ON att.sectionid = ps.sectionid 
LEFT JOIN lms_map map
  ON map.sectionid = ps.sectionid
LEFT JOIN classes c
  ON c.LMS_id = map.lmsid
ORDER BY ps.sectionid DESC";
        $ELMScourses = "
SELECT c.LMS_id, c.name,
usr.fname, usr.lname 
FROM classes c 
JOIN user_classes usr_c 
JOIN users usr 
ON usr_c.classid = c.id AND usr.id = usr_c.userid 
WHERE c.LMS_id > 0 AND usr_c.id IN (SELECT max(id) FROM user_classes WHERE is_teacher=1 GROUP BY classid)
ORDER BY c.LMS_id DESC";
    }

    $rows1 = $local_conn->query($PSsections);
    $rows2 = $local_conn->query($ELMScourses);

    $rows = new \stdClass();

    $rows->ps_courses = [];
    $rows->elms_courses = [];

    //associate sectionids with power school courses
    $index = 0;
    while ($row = $rows1->fetch_assoc()) {
        $row["index"] = $index;
        $row["sectionid"] = abs($row["sectionid"]);
        array_push($rows->ps_courses, $row);
        $index++;
    }
    //fill array with platform courses
    while ($row = $rows2->fetch_assoc()) array_push($rows->elms_courses, $row);

    $json = json_encode($rows);

    echo $json;
}