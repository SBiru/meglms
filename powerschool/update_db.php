<?php
require_once("powerSchoolApi.php");
require_once("local_conn.php");

function update_db()
{
    global $ps;
    global $local_conn;
    global $current;

    global $grades,$cc_enrollments,$teachers;

    if(!isset($ps)) $ps = new powerSchoolApi();
    if(!isset($current)) $current = time();

    if(!isset($grades)) {
        $get_grades = json_decode($ps->get_grades(),true);
        $grades = $get_grades['record'];
        $f = fopen('logs/db/grades','w');
        fwrite($f,json_encode($grades));
        fclose($f);
    }
    if(!isset($cc_enrollments)) {
        $get_enrollments = json_decode($ps->get_enrollments(),true);
        $cc_enrollments = $get_enrollments['record'];
    }
    if(!isset($teachers)) {
        $get_teachers = json_decode($ps->get_teachers(),true);
        $teachers = $get_teachers['record'];
    }

    $log = "";

    $insertValues = array();

    $get_max = "SELECT MAX(last_grade_update) as mostrecent FROM pgfinalgrades";
    $result = $local_conn->query($get_max)->fetch_assoc();
    $mostrecent = isset($result['mostrecent']) ? $result['mostrecent'] : "0000-00-00";

    foreach ($grades as $gradeObj) {

        foreach ($gradeObj as $key => $value) {
            $gradeObj[$key] = mysqli_escape_string($local_conn, $value);
        }

        if ($gradeObj['last_grade_update'] > $mostrecent) {
            array_push($insertValues, "({$gradeObj['dcid']},{$gradeObj['studentid']},'{$gradeObj['grade']}',{$gradeObj['sectionid']},'{$gradeObj['last_grade_update']}','{$gradeObj['termid']}','{$gradeObj['storecode']}')");
            $log .= "pgfinalgrades: ADDED ROW | {$gradeObj['dcid']} | {$gradeObj['studentid']} | {$gradeObj['grade']} | {$gradeObj['sectionid']} | {$gradeObj['last_grade_update']} | {$gradeObj['termid']} | {$gradeObj['storecode']}\n\n";
        }
    }

    if (!empty($insertValues)) {
        $join = implode($insertValues, ",");
        $query = "INSERT INTO pgfinalgrades (dcid,studentid,grade,sectionid,last_grade_update,termid,storecode) VALUES " . $join;
        $local_conn->query($query);
    }

    $insertValues = array();
    $updateThese = array();

    foreach ($cc_enrollments as $enrollmentObj) {

        $find = "SELECT 1 FROM cc_enrollments WHERE ccid = '{$enrollmentObj['ccid']}'";
        $result = $local_conn->query($find);

        foreach ($enrollmentObj as $key => $value) {
            $enrollmentObj[$key] = mysqli_escape_string($local_conn, $value);
        }

        if ($result->num_rows < 1) {
            array_push($insertValues, "('{$enrollmentObj['end_date']}', '{$enrollmentObj['student_idnumber']}', '{$enrollmentObj['student_gender']}', '{$enrollmentObj['student_web_id']}', '{$enrollmentObj['course_name']}', '{$enrollmentObj['student_guardianemail']}', '{$enrollmentObj['last_name']}', '{$enrollmentObj['student_site']}', '{$enrollmentObj['sectionid']}', '{$enrollmentObj['student_schoolid']}', '{$enrollmentObj['studentid']}', '{$enrollmentObj['termid']}', '{$enrollmentObj['ccid']}', '{$enrollmentObj['student_web_password']}', '{$enrollmentObj['student_tuitionpayer']}', '{$enrollmentObj['first_name']}', '{$enrollmentObj['start_date']}', '{$enrollmentObj['student_advisor']}', '{$enrollmentObj['exitdate']}', '{$enrollmentObj['credit_hours']}', '{$enrollmentObj['enrollment_schoolid']}')");
            $log .= "cc_enrollments: ADDED ROW | {$enrollmentObj['end_date']} | {$enrollmentObj['student_idnumber']} | {$enrollmentObj['student_gender']} | {$enrollmentObj['student_web_id']} | {$enrollmentObj['course_name']} | {$enrollmentObj['student_guardianemail']} | {$enrollmentObj['last_name']} | {$enrollmentObj['student_site']} | {$enrollmentObj['sectionid']} | {$enrollmentObj['student_schoolid']} | {$enrollmentObj['studentid']} | {$enrollmentObj['termid']} | {$enrollmentObj['ccid']} | {$enrollmentObj['student_web_password']} | {$enrollmentObj['student_tuitionpayer']} | {$enrollmentObj['first_name']} | {$enrollmentObj['start_date']} | {$enrollmentObj['student_advisor']} | {$enrollmentObj['exitdate']} | {$enrollmentObj['credit_hours']} | {$enrollmentObj['enrollment_schoolid']} |\n\n";
        } else {
            array_push($updateThese, $enrollmentObj);
            $log .= "cc_enrollments: UPDATED ROW KEY(ccid)={$enrollmentObj['ccid']} | {$enrollmentObj['end_date']} | {$enrollmentObj['student_idnumber']} | {$enrollmentObj['student_gender']} | {$enrollmentObj['student_web_id']} | {$enrollmentObj['course_name']} | {$enrollmentObj['student_guardianemail']} | {$enrollmentObj['last_name']} | {$enrollmentObj['student_site']} | {$enrollmentObj['sectionid']} | {$enrollmentObj['student_schoolid']} | {$enrollmentObj['studentid']} | {$enrollmentObj['termid']} | {$enrollmentObj['ccid']} | {$enrollmentObj['student_web_password']} | {$enrollmentObj['student_tuitionpayer']} | {$enrollmentObj['first_name']} | {$enrollmentObj['start_date']} | {$enrollmentObj['student_advisor']} | {$enrollmentObj['exitdate']} | {$enrollmentObj['credit_hours']} | {$enrollmentObj['enrollment_schoolid']} |\n\n";
        }
    }

    if (!empty($insertValues)) {
        $join = implode($insertValues, ",");
        $query = "INSERT INTO cc_enrollments (end_date,student_idnumber,student_gender,student_web_id,course_name,student_guardianemail,last_name,student_site,sectionid,student_schoolid,studentid,termid,ccid,student_web_password,student_tuitionpayer,first_name,start_date,student_advisor,exitdate,credit_hours,enrollment_schoolid) VALUES " . $join;
        $local_conn->query($query);
    }

    if (!empty($updateThese)) {

        $colvals = array();
        $ccids = array();

        foreach ($updateThese as $updateThis) {
            foreach ($updateThis as $key => $value) {
                if ($key == "ccid") {
                    array_push($ccids, $value);
                } else if($key != "_name") {
                    $colvals[$key] .= "WHEN {$updateThis['ccid']} THEN '{$value}' ";
                }
            }
        }

        $updateString = "UPDATE cc_enrollments SET "

            . "end_date = CASE ccid " . $colvals["end_date"] . " END, "
            . "student_idnumber = CASE ccid " . $colvals["student_idnumber"] . " END, "
            . "student_gender = CASE ccid " . $colvals["student_gender"] . " END, "
            . "student_web_id = CASE ccid " . $colvals["student_web_id"] . " END, "
            . "course_name = CASE ccid " . $colvals["course_name"] . " END, "
            . "student_guardianemail = CASE ccid " . $colvals["student_guardianemail"] . " END, "
            . "last_name = CASE ccid " . $colvals["last_name"] . " END, "
            . "student_site = CASE ccid " . $colvals["student_site"] . " END, "
            . "sectionid = CASE ccid " . $colvals["sectionid"] . " END, "
            . "student_schoolid = CASE ccid " . $colvals["student_schoolid"] . " END, "
            . "studentid = CASE ccid " . $colvals["studentid"] . " END, "
            . "termid = CASE ccid " . $colvals["termid"] . " END, "
            . "student_web_password = CASE ccid " . $colvals["student_web_password"] . " END, "
            . "student_tuitionpayer = CASE ccid " . $colvals["student_tuitionpayer"] . " END, "
            . "first_name = CASE ccid " . $colvals["first_name"] . " END, "
            . "start_date = CASE ccid " . $colvals["start_date"] . " END, "
            . "student_advisor = CASE ccid " . $colvals["student_advisor"] . " END, "
            . "exitdate = CASE ccid " . $colvals["exitdate"] . " END, "
            . "credit_hours = CASE ccid " . $colvals["credit_hours"] . " END, "
            . "enrollment_schoolid = CASE ccid " . $colvals["enrollment_schoolid"] . " END "

            . "WHERE ccid IN (" . implode($ccids, ",") . ")";

        $local_conn->query($updateString);

    }

    $insertValues = array();
    $updateThese = array();

    foreach ($teachers as $teacherObj) {

        $find = "SELECT 1 FROM ps_teachers WHERE sectionid = '{$teacherObj['sectionid']}'";
        $result = $local_conn->query($find);

        foreach ($teacherObj as $key => $value) {
            $teacherObj[$key] = mysqli_escape_string($local_conn, $value);
        }

        if ($result->num_rows < 1) {
            array_push($insertValues, "('{$teacherObj['teacherid']}','{$teacherObj['last_name']}','{$teacherObj['sectionid']}','{$teacherObj['first_name']}','{$teacherObj['email']}','{$teacherObj['course_name']}','{$teacherObj['credit_hours']}')");
            $log .= "ps_teachers: ADDED ROW | {$teacherObj['teacherid']} | {$teacherObj['last_name']} | {$teacherObj['sectionid']} | {$teacherObj['first_name']} | {$teacherObj['email']} | {$teacherObj['course_name']} | {$teacherObj['credit_hours']} |\n\n";
        } else {
            array_push($updateThese, $teacherObj);
            $log .= "ps_teachers: UPDATED ROW KEY(sectionid)={$teacherObj['sectionid']} | {$teacherObj['teacherid']} | {$teacherObj['last_name']} | {$teacherObj['sectionid']} | {$teacherObj['first_name']} | {$teacherObj['email']} | {$teacherObj['course_name']} | {$teacherObj['credit_hours']} |\n\n";
        }
    }

    if (!empty($insertValues)) {
        $join = implode($insertValues, ",");
        $query = "INSERT INTO ps_teachers (teacherid,last_name,sectionid,first_name,email,course_name,credit_hours) VALUES " . $join;
        $local_conn->query($query);
    }

    if (!empty($updateThese)) {

        $colvals = array();
        $secids = array();

        foreach ($updateThese as $updateThis) {
            foreach ($updateThis as $key => $value) {
                if ($key == "sectionid") {
                    array_push($secids, $value);
                } else if ($key != "_name") {
                    $colvals[$key] .= "WHEN {$updateThis['sectionid']} THEN '{$value}' ";
                }
            }
        }

        $updateString = "UPDATE ps_teachers SET "

            . "teacherid = CASE sectionid " . $colvals["termid"] . " END, "
            . "last_name = CASE sectionid " . $colvals["last_name"] . " END, "
            . "first_name = CASE sectionid " . $colvals["first_name"] . " END, "
            . "email = CASE sectionid " . $colvals["email"] . " END "
            . "course_name = CASE sectionid " . $colvals["course_name"] . " END, "
            . "credit_hours = CASE ccid " . $colvals["credit_hours"] . " END "
            . "WHERE sectionid IN (" . implode($secids, ",") . ")";

        $local_conn->query($updateString);
    }

    $log_file = fopen("logs/db/{$current}.txt","w");
    fwrite($log_file,$log);

}