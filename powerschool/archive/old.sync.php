<?php
require_once("powerSchoolApi.php");
require_once("local_conn.php");
require_once("config.php");
require_once("update_db.php");

function make_withdraw_obj($enrollmentObj,$lms_code) {
    $withdrawObj = new \stdClass();
    $withdrawObj->lms_code = $lms_code;
    $withdrawObj->attendance_only = $lms_code ? true : false;
    $withdrawObj->course_name = $enrollmentObj['course_name'];
    $withdrawObj->email = $enrollmentObj['student_web_id']."@sequoiaschools.org";
    $withdrawObj->sectionid = $enrollmentObj['sectionid'];
    $withdrawObj->student_ps_id = $enrollmentObj['studentid'];
    return $withdrawObj;
}

$ps = new powerSchoolApi();

//set variables used in filtering and error reporting
$current = time();

$enrollments = [];
$withdrawals = [];

$errors = [];

$valid_grades = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','W'];


//TODO: get this information from the database
/*
$advisorjson = "advisor_map.json";
$advisors = json_decode(file_get_contents($advisorjson), true);
*/
$get_advisors = "SELECT * FROM advisor_map";
$result = $local_conn->query($get_advisors);
$advisors = array();
while($row = $result->fetch_assoc()) {
    $advisors[$row['name']] = array(
        "email"=>$row['email'],
        "firstname"=>$row['first_name'],
        "id"=>$row['id'],
        "lastname"=>$row['last_name']
    );
}

/*
$sectionjson = "lms_map.json";
$elms_sections = json_decode(file_get_contents($sectionjson), true);
*/
$get_elms_sections = "SELECT * FROM lms_map";
$result = $local_conn->query($get_elms_sections);
$elms_sections = array();
while($row = $result->fetch_assoc()) {
    $elms_sections[$row['sectionid']] = $row['lmsid'];
}

/*
$sitejson = "known_sites.json";
$known_sites = json_decode(file_get_contents($sitejson), true);
*/
$get_sites = "SELECT DISTINCT name FROM sites";
$result = $local_conn->query($get_sites);
$known_sites = [];
while($row = $result->fetch_array()) array_push($known_sites,$row[0]);

//get data from powerschool
$get_grades = json_decode($ps->get_grades(),true);
$grades = $get_grades['record'] ? $get_grades['record'] : [];

$get_enrollments = json_decode($ps->get_enrollments(),true);
$cc_enrollments = $get_enrollments['record'] ? $get_enrollments['record'] : [];

$get_teachers = json_decode($ps->get_teachers(),true);
$teachers = $get_teachers['record'] ? $get_teachers['record'] : [];

//associative arrays
$gradeArr = array();
$teacherArr = array();

//fill associative arrays
foreach($grades as $gradeObj) {
    if (in_array($gradeObj['grade'], $valid_grades)) {
        $gradeArr[$gradeObj['studentid'] . ":" . $gradeObj['sectionid']] = $gradeObj['grade'];
    }
}
foreach($teachers as $teacherObj) {
    $teacherArr[strval(abs(intval($teacherObj['sectionid'])))] = $teacherObj;
}

foreach($cc_enrollments as $enrollmentObj) {
    try {
        $start_date = strtotime($enrollmentObj['start_date']);
        $end_date = strtotime($enrollmentObj['end_date']);

        $sectionid = strval(abs(intval($enrollmentObj['sectionid'])));

        $lms_code = $elms_sections[$sectionid] ? $elms_sections[$sectionid] : null;
        
        if($end_date < $current) {
            $withdrawObj = make_withdraw_obj($enrollmentObj,$lms_code);
            $withdrawObj->reason = "Enrollment period has expired";
            array_push($withdrawals,$withdrawObj);
            continue;
        }

        if(intval($enrollmentObj['sectionid']) < 0) {
            $withdrawObj = make_withdraw_obj($enrollmentObj,$lms_code);
            $withdrawObj->reason = "Manual withdraw";
            array_push($withdrawals,$withdrawObj);
            continue;
        }

        if(isset($gradeArr[$enrollmentObj['studentid'].":".$sectionid])) {
            $withdrawObj = make_withdraw_obj($enrollmentObj,$lms_code);
            $withdrawObj->reason = "Has been assigned a final grade";
            array_push($withdrawals,$withdrawObj);
            continue;
        }

        $track_attendance = ($enrollmentObj['student_schoolid'] == 120) ? true : false;

        ## Data checking: Check for advisor, site, password, and email

        if(!isset($enrollments[$enrollmentObj['studentid']])) {

            $fullname = $enrollmentObj['first_name'] . " " . $enrollmentObj['last_name'];

            if (!isset($enrollmentObj['student_web_id'])) {
                $enrollmentObj['student_web_id'] = '';
                $error = new \stdClass();
                $error->message = "ERROR: {$fullname} does not have an email.";
                //$error->sendto = array($teacher_email);
                array_push($errors, $error);
            }

            $student_email = $enrollmentObj['student_web_id'] . "@sequoiaschools.org";

            if (!isset($enrollmentObj['student_advisor'])) {
                $enrollmentObj['student_advisor'] = "";
                $error = new \stdClass();
                $error->message = "ERROR: No advisor set for student '{$fullname}'";
                //$error->sendto = array($student_email,$teacher_email);
                array_push($errors, $error);
            }

            $advisor = $advisors[$enrollmentObj['student_advisor']] ? $advisors[$enrollmentObj['student_advisor']] : "";

            if (!isset($advisors[$enrollmentObj['student_advisor']])) {
                $error = new \stdClass();
                $error->message = "ERROR: Student '{$fullname}' is assigned to advisor '{$enrollmentObj['student_advisor']}'. No records found for advisor '{$enrollmentObj['student_advisor']}'";
                //$error->sendto = array($student_email,$teacher_email);
                array_push($errors, $error);
            }

            if (!isset($enrollmentObj['student_site'])) {
                $enrollmentObj['student_site'] = "";
                $error = new \stdClass();
                $error->message = "ERROR: No course_code set for student '{$fullname}'";
                //$error->sendto = array($student_email,$teacher_email);
                array_push($errors, $error);
            }
            if (!in_array($known_sites,$enrollmentObj['student_site'])) {
                $error = new \stdClass();
                $error->message = "ERROR: Student '{$fullname}' is enrolled in an unrecognized course. Course_code: '{$enrollmentObj['studnet_site']}'";
                //$error->sendto = array($student_email,$teacher_email);
                array_push($errors, $error);
            }

            if (!isset($enrollmentObj['student_idnumber'])) {
                $enrollmentObj['student_idnumber'] = '';
            }

            $can_enter_attendance = ($enrollmentObj['student_site'] == 'AZDL') ? true : false;

            if (!isset($enrollmentObj['student_guardianemail'])) {
                $enrollmentObj['student_guardianemail'] = '';
            }

            $studentObj = new \stdClass();
            $studentObj->advisors = [$advisor];
            $studentObj->cc = [];
            $studentObj->email = $enrollmentObj['student_web_id'] . "@sequoiaschools.org";
            $studentObj->firstname = $enrollmentObj['first_name'];
            $studentObj->gender = $enrollmentObj['student_gender'];

            $guardian0 = new \stdClass();
            $guardian0->can_enter_attendance = $can_enter_attendance;
            $guardian0->email = $enrollmentObj['student_guardianemail'];
            $guardian0->firstname = null;
            $guardian0->lastname = null;
            $guardian0->phone = "";
            $guardian0->relationship = null;

            $studentObj->guardians = array($guardian0);

            $studentObj->idnumber = $enrollmentObj['student_idnumber'];
            $studentObj->lastname = $enrollmentObj['last_name'];
            $studentObj->password = $enrollmentObj['student_idnumber'] . "00";
            $studentObj->site = $enrollmentObj['student_site'];
            $studentObj->track_attendance = $track_attendance;
            $studentObj->tution_payer = $enrollmentObj['student_tuitionpayer'];

            $enrollments[$enrollmentObj['studentid']] = $studentObj;

        }

        $enrollment = new \stdClass();
        $enrollment->LMS_code = $lms_code;
        $enrollment->attendance_only = $lms_code ? false : true;
        $enrollment->coursename = $enrollmentObj['course_name'];
        $enrollment->date_left = date("m/d/y",strtotime($enrollmentObj['end_date']));
        $enrollment->sectionid = $sectionid;
        $enrollment->start_date = date("m/d/y",strtotime($enrollmentObj['start_date']));

        array_push($enrollments[$enrollmentObj['studentid']]->cc,$enrollment);

    } //catch exception
    catch (Exception $e) {
        foreach($report_to as $address) {
            mail($address,"SYNC had a problem","Time:{$current}\n\nPHP threw error: {$e->getMessage()}");
        }
    }
}

$headers = "From: powerschool_syncer@myedkey.org \r\n";
$mail_content = "";
foreach($errors as $error) {
    $mail_content .= $error->message . "\n\n";
}
foreach($report_to as $address) {
    mail($address, 'Error', $mail_content, $headers);
}

//update records
$log = "";

$insertValues = array();
foreach ($grades as $gradeObj) {

    foreach ($gradeObj as $key => $value) {
        $gradeObj[$key] = mysqli_escape_string($local_conn, $value);
    }

    array_push($insertValues, "({$gradeObj['dcid']},{$gradeObj['studentid']},'{$gradeObj['grade']}',{$gradeObj['sectionid']},'{$gradeObj['last_grade_update']}')");
    $log .= "pgfinalgrades: ADDED ROW | {$gradeObj['studentid']} | {$gradeObj['studentid']} | {$gradeObj['grade']} | {$gradeObj['sectionid']} | {$gradeObj['last_grade_update']} |\n\n";
}

if (!empty($insertValues)) {
    $join = implode($insertValues, ",");
    $query = "INSERT IGNORE INTO pgfinalgrades (dcid,studentid,grade,sectionid,last_grade_update) VALUES " . $join;
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
        array_push($insertValues,
            "(
'{$enrollmentObj['end_date']}',
'{$enrollmentObj['student_idnumber']}',
'{$enrollmentObj['student_gender']}',
'{$enrollmentObj['student_web_id']}',
'{$enrollmentObj['course_name']}',
'{$enrollmentObj['student_guardianemail']}',
'{$enrollmentObj['last_name']}',
'{$enrollmentObj['student_site']}',
'{$enrollmentObj['sectionid']}',
'{$enrollmentObj['student_schoolid']}',
'{$enrollmentObj['studentid']}',
'{$enrollmentObj['termid']}',
'{$enrollmentObj['ccid']}',
'{$enrollmentObj['student_web_password']}',
'{$enrollmentObj['student_tuitionpayer']}',
'{$enrollmentObj['first_name']}',
'{$enrollmentObj['start_date']}',
'{$enrollmentObj['student_advisor']}'
)"
        );
        $log .= "cc_enrollments: ADDED ROW | {$enrollmentObj['end_date']} | {$enrollmentObj['student_idnumber']} | {$enrollmentObj['student_gender']} | {$enrollmentObj['student_web_id']} | {$enrollmentObj['course_name']} | {$enrollmentObj['student_guardianemail']} | {$enrollmentObj['last_name']} | {$enrollmentObj['student_site']} | {$enrollmentObj['sectionid']} | {$enrollmentObj['student_schoolid']} | {$enrollmentObj['studentid']} | {$enrollmentObj['termid']} | {$enrollmentObj['ccid']} | {$enrollmentObj['student_web_password']} | {$enrollmentObj['student_tuitionpayer']} | {$enrollmentObj['first_name']} | {$enrollmentObj['start_date']} | {$enrollmentObj['student_advisor']} |\n\n";
    } else {
        array_push($updateThese, $enrollmentObj);
        $log .= "cc_enrollments: UPDATED ROW KEY(ccid)={$enrollmentObj['ccid']} | {$enrollmentObj['end_date']} | {$enrollmentObj['student_idnumber']} | {$enrollmentObj['student_gender']} | {$enrollmentObj['student_web_id']} | {$enrollmentObj['course_name']} | {$enrollmentObj['student_guardianemail']} | {$enrollmentObj['last_name']} | {$enrollmentObj['student_site']} | {$enrollmentObj['sectionid']} | {$enrollmentObj['student_schoolid']} | {$enrollmentObj['studentid']} | {$enrollmentObj['termid']} | {$enrollmentObj['ccid']} | {$enrollmentObj['student_web_password']} | {$enrollmentObj['student_tuitionpayer']} | {$enrollmentObj['first_name']} | {$enrollmentObj['start_date']} | {$enrollmentObj['student_advisor']} |\n\n";
    }
}

if (!empty($insertValues)) {
    $join = implode($insertValues, ",");
    $query = "INSERT INTO cc_enrollments (end_date,student_idnumber,student_gender,student_web_id,course_name,student_guardianemail,last_name,student_site,sectionid,student_schoolid,studentid,termid,ccid,student_web_password,student_tuitionpayer,first_name,start_date,student_advisor) VALUES " . $join;
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
        . "student_advisor = CASE ccid " . $colvals["student_advisor"] . " END "

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
        array_push($insertValues, "('{$teacherObj['teacherid']}','{$teacherObj['last_name']}','{$teacherObj['sectionid']}','{$teacherObj['first_name']}','{$teacherObj['email']}','{$teacherObj['course_name']}')");
        $log .= "ps_teachers: ADDED ROW | {$teacherObj['teacherid']} | {$teacherObj['last_name']} | {$teacherObj['sectionid']} | {$teacherObj['first_name']} | {$teacherObj['email']} | {$teacherObj['course_name']} |\n\n";
    } else {
        array_push($updateThese, $teacherObj);
        $log .= "ps_teachers: UPDATED ROW KEY(sectionid)={$teacherObj['sectionid']} | {$teacherObj['teacherid']} | {$teacherObj['last_name']} | {$teacherObj['sectionid']} | {$teacherObj['first_name']} | {$teacherObj['email']} | {$teacherObj['course_name']} |\n\n";
    }
}

if (!empty($insertValues)) {
    $join = implode($insertValues, ",");
    $query = "INSERT INTO ps_teachers (teacherid,last_name,sectionid,first_name,email,course_name) VALUES " . $join;
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
        . "course_name = CASE sectionid " . $colvals["course_name"] . " END "
        . "WHERE sectionid IN (" . implode($secids, ",") . ")";

    $local_conn->query($updateString);
}

//create log file
$log_file1 = fopen("logs/db/{$current}","w");
fwrite($log_file1,$log);

$sections = [];

foreach($teacherArr as $sectionid=>$teacherObj) {
    $section = new \stdClass();
    $section->lms_code = $elms_sections[$sectionid];
    $section->sectionid = $sectionid;
    $section->sectionname = $teacherObj['course_name'];
    $teacher_data = new \stdClass();
    $teacher_data->email = $teacherObj['email'];
    $teacher_data->firstname = $teacherObj['first_name'];
    $teacher_data->id = $teacherObj['teacherid'];
    $teacher_data->last_name = $teacherObj['last_name'];
    $section->teacher = $teacher_data;
    array_push($sections,$section);
}

ksort($enrollments);
ksort($withdrawals);

$psexport = array();
//$psexport["sections"] = $sections;
$psexport["students"] = $enrollments;
$psexport["withdrawals"] = $withdrawals;
$psexport_json = json_encode($psexport);

$log_file2 = fopen("logs/export/{$current}.json", "w");
fwrite($log_file2, $psexport_json);

//write export file
/*
$file = fopen("psexport.json", "w");
fwrite($file, $psexport_json);
*/

echo "-- SUCCESS --";

//post data to myedkey.org
/*
$url = "http://myedkey.org/signin/";
$headers = array(
    "cache-control: no-cache",
    "content-type: application/x-www-form-urlencoded",
);
$data = "username=data%40sequoiaschools.org&password=scdata14";
$add_opts = array(CURLOPT_HEADER => 1);
$response = useCurl($url,$headers,$data,"POST",$add_opts);

preg_match('/PHPSESSID=(.*?);/', $response, $matches);
$phpsessid = $matches[1];

$url = "http://myedkey.org/api/organizations/10/imports/powerschool";
$headers = array(
    "cache-control: no-cache",
    "content-type: application/json",
    "Cookie: PHPSESSID={$phpsessid}"
);
$response = useCurl($url,$headers,"","POST");
$json = json_decode($response);
*/

