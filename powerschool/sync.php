<?php

//require("../vendor/phpmailer/phpmailer/PHPMailerAutoload.php");

class ResponseFile{
    private static $folder = '/testresponses/';
    public static function write($filename,$content){
        $f = fopen(getcwd().self::$folder.$filename,'w');
        fwrite($f,$content);
        fclose($f);
    }
    public static function read($filename){
        return file_get_contents(getcwd().self::$folder.$filename);
    }
}

function make_withdraw_obj($enrollmentObj,$lms_code,$attendance_only) {
    $sectionid = strval(abs(intval($enrollmentObj['sectionid'])));
    $withdrawObj = new \stdClass();
    $withdrawObj->LMS_Code = $lms_code;
    $withdrawObj->attendance_only = $attendance_only;
    $withdrawObj->coursename = $enrollmentObj['course_name'];
    $withdrawObj->email = $enrollmentObj['student_web_id']."@sequoiaschools.org";
    $withdrawObj->sectionid = $sectionid;
    $withdrawObj->student_ps_id = $enrollmentObj['studentid'];
    return $withdrawObj;
}

function main($isTestMode=false,$gradesData=null,$enrollmentsData=null,$teachersData=null){
    require("powerSchoolApi.php");
    require_once("local_conn.php");
    require("config.php");
    require("../config.php");
    require("../src/English3/Controller/Mailer/E3Mailer.php");
    require("update_db.php");
    $scriptOpts = getopt('t::');
    $isTestMode = $isTestMode || array_key_exists('t',$scriptOpts);
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

    /*
    $sectionjson = "lms_map.json";
    $elms_sections = json_decode(file_get_contents($sectionjson), true);
    */
    $get_elms_sections = "SELECT map.sectionid, map.lmsid, c.name FROM (SELECT * FROM lms_map) as map LEFT JOIN (SELECT LMS_id, name FROM classes) as c ON c.LMS_id = map.lmsid";
    $result = $local_conn->query($get_elms_sections);
    $elms_sections = array();
    while($row = $result->fetch_assoc()) {
        $section_data = new stdClass();
        $section_data->lmsid = $row['lmsid'];
        $section_data->course_name = $row['name'];
        $elms_sections[$row['sectionid']] = $section_data;
    }

    /*create associative array to check if attendance_only flag has been set for a course*/
    $get_attendance_map = "SELECT * FROM is_attendance_only";
    $result = $local_conn->query($get_attendance_map);
    $is_attendance_only = array();
    while($row = $result->fetch_assoc()) {
        $is_attendance_only[$row['sectionid']] = $row['attendance_only'];
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
    if($isTestMode){
        echo "TEST MODE".PHP_EOL;
        $gradesData = $gradesData?:ResponseFile::read('mockGrades');
        $enrollmentsData = $enrollmentsData?:ResponseFile::read('mockEnrollments');
        $teachersData = $teachersData?:ResponseFile::read('mockTeachers');
    }else{
        echo "PRODUCTION MODE".PHP_EOL;
        $gradesData = $ps->get_grades();
        #ResponseFile::write('grades',$gradesData);
        $enrollmentsData = $ps->get_enrollments();
        #ResponseFile::write('enrollments',$enrollmentsData);
        $teachersData = $ps->get_teachers();
        #ResponseFile::write('teachers',$teachersData);
    }
    $get_grades = json_decode($gradesData,true);
    $grades = isset($get_grades['record']) ? $get_grades['record'] : [];

    $get_enrollments = json_decode($enrollmentsData,true);
    $cc_enrollments = isset($get_enrollments['record']) ? $get_enrollments['record'] : [];

    $get_teachers = json_decode($teachersData,true);
    $teachers = isset($get_teachers['record']) ? $get_teachers['record'] : [];

//associative arrays
    $gradeArr = array();
    $teacherArr = array();

//fill associative arrays
    foreach($grades as $gradeObj) {
        if (in_array($gradeObj['grade'], $valid_grades)) {
            $gradeArr[$gradeObj['studentid'] . ":" . $gradeObj['sectionid']] = $gradeObj['grade'];
        }
    }

    /*keep a record of courses that do not have an entry in the is_attendance_only table*/
    $unset_courses = [];

    foreach($teachers as $teacherObj) {
        $sectionid = strval(abs(intval($teacherObj['sectionid'])));
        $teacherArr[$sectionid] = $teacherObj;
    }

    foreach($cc_enrollments as $enrollmentObj) {
        try {
            $start_date = strtotime($enrollmentObj['start_date']);
            $end_date = strtotime($enrollmentObj['end_date']);

            $sectionid = strval(abs(intval($enrollmentObj['sectionid'])));

            if(!isset($is_attendance_only[$sectionid])) {
                $concat = $sectionid.": ".$enrollmentObj["course_name"];
                if(!in_array($concat,$unset_courses)) {
                    array_push($unset_courses,$concat);
                }
                continue;
            }

            $attendance_only = $is_attendance_only[$sectionid] == 1 ? true : false;

            $lms_code = isset($elms_sections[$sectionid]) ? intval($elms_sections[$sectionid]->lmsid) : null;
            $elms_classname = "";
            if(isset($elms_sections[$sectionid])) {
                $elms_classname = $elms_sections[$sectionid]->course_name;
            }

            if($end_date < $current) {
                $withdrawObj = make_withdraw_obj($enrollmentObj,$lms_code,$attendance_only);
                $withdrawObj->reason = "Enrollment period has expired";
                array_push($withdrawals,$withdrawObj);
                continue;
            }

            if(intval($enrollmentObj['sectionid']) < 0) {
                $withdrawObj = make_withdraw_obj($enrollmentObj,$lms_code,$attendance_only);
                $withdrawObj->reason = "Manual withdraw";
                array_push($withdrawals,$withdrawObj);
                continue;
            }

            if(isset($gradeArr[$enrollmentObj['studentid'].":".$sectionid])) {
                $withdrawObj = make_withdraw_obj($enrollmentObj,$lms_code,$attendance_only);
                $withdrawObj->reason = "Has been assigned a final grade";
                array_push($withdrawals,$withdrawObj);
                continue;
            }

            $track_attendance = (in_array($enrollmentObj['student_schoolid'],$schoolids)) ? true : false;

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

                $student_advisors = [];
                if (!isset($enrollmentObj['student_advisor'])) {
                    $enrollmentObj['student_advisor'] = "";
                    $error = new \stdClass();
                    $error->message = "ERROR: No advisor set for student '{$fullname}'";
                    //$error->sendto = array($student_email,$teacher_email);
                    array_push($errors, $error);
                }
                else {
                    $get_advisors = "SELECT id, first_name as firstname, last_name as lastname, email FROM advisor_map WHERE name = '{$enrollmentObj['student_advisor']}' AND id != 0";
                    $result = $local_conn->query($get_advisors);
                    while ($row = $result->fetch_assoc()) {
                        array_push($student_advisors, $row);
                    }
                    if(empty($student_advisors)) {
                        $error = new \stdClass();
                        $error->message = "ERROR: Student '{$fullname}' is assigned to advisor '{$enrollmentObj['student_advisor']}'. No records found for advisor '{$enrollmentObj['student_advisor']}'";
                        $add_advisor = "INSERT INTO advisor_map (name,id) VALUES ('{$enrollmentObj['student_advisor']}',0) on DUPLICATE KEY UPDATE name = name";
                        $local_conn->query($add_advisor);
                        //$error->sendto = array($student_email,$teacher_email);
                        array_push($errors, $error);
                    }
                }

                if (!isset($enrollmentObj['student_site'])) {
                    $enrollmentObj['student_site'] = "";
                    $error = new \stdClass();
                    $error->message = "ERROR: No course_code set for student '{$fullname}'";
                    //$error->sendto = array($student_email,$teacher_email);
                    array_push($errors, $error);
                }
                else if (!in_array($enrollmentObj['student_site'],$known_sites)) {
                    $error = new \stdClass();
                    $error->message = "ERROR: Student '{$fullname}' is enrolled in an unrecognized course. Course_code: '{$enrollmentObj['student_site']}'";
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
                $studentObj->advisors = $student_advisors;
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
                $studentObj->student_schoolid = $enrollmentObj['student_schoolid'];
                $studentObj->exitdate = $enrollmentObj['exitdate'];
                $studentObj->lastname = $enrollmentObj['last_name'];
                $studentObj->password = $enrollmentObj['student_idnumber'] . "00";
                $studentObj->site = $enrollmentObj['student_site'];
                $studentObj->track_attendance = $track_attendance;
                $studentObj->tution_payer = $enrollmentObj['student_tuitionpayer'];

                $enrollments[$enrollmentObj['studentid']] = $studentObj;

            }

            $enrollment = new \stdClass();
            $enrollment->LMS_code = $lms_code;
            $enrollment->attendance_only = $attendance_only;
            $enrollment->coursename = $elms_classname ? $elms_classname : $enrollmentObj['course_name'];
            $enrollment->credit_hours = $enrollmentObj['credit_hours'];
            $enrollment->enrollment_schoolid = $enrollmentObj['enrollment_schoolid'];
            $enrollment->date_left = date("m/d/Y",strtotime($enrollmentObj['end_date']));
            $enrollment->sectionid = $sectionid;
            $enrollment->start_date = date("m/d/Y",strtotime($enrollmentObj['start_date']));

            array_push($enrollments[$enrollmentObj['studentid']]->cc,$enrollment);

        } //catch exception
        catch (Exception $e) {
            foreach($report_to as $address) {
                mail($address,"SYNC had a problem","Time:{$current}\n\nPHP threw error: {$e->getMessage()}");
            }
        }
    }

    /*
    $headers = "From: powerschool_syncer@myedkey.org \r\n";
    $mail_content = "";
    foreach($errors as $error) {
        $mail_content .= $error->message . "\n\n";
    }
    foreach($report_to as $address) {
        mail($address, 'Error', $mail_content, $headers);
    }

    $mail_content = "Attendance only flag was missing on the following courses: \n\n";
    foreach($unset_courses as $course) {
        $mail_content .= $course . "\n";
    }
    $mail_content .= "\nTo fix this problem go to the matchmaker and set each class to attendance only yes or no.";
    foreach($report_to as $address) {
        mail($address, 'Attendance Only', $mail_content, $headers);
    }
    */
//global $MAIL_SECURITY;
//$mail = new PHPMailer;
//$mail->isSMTP();                                      // Set mailer to use SMTP
//$mail->isHTML();
//$mail->Host = 'smtp.gmail.com';  // Specify main and backup SMTP servers
//$mail->SMTPAuth = true;                               // Enable SMTP authentication
//$mail->Username = $MAIL_SECURITY->username;                 // SMTP username
//$mail->Password = $MAIL_SECURITY->password;                           // SMTP password
//$mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted
//$mail->Port = 465;
    $mailer = new English3\Controller\Mailer\Mailer();
//$mail->setFrom('powerschool_syncer@myedkey.org','powerschool_syncer@myedkey.org');
//foreach ($report_to as $address) {
//    $mail->addAddress($address,$address);
//}
//Send error email

    $mail_content = "Today's sync had no errors.";
    if(count($errors)>0) {
        $mail_content = "";
        foreach ($errors as $error) {
            $mail_content .= $error->message . "<br><br>";
        }
    }
//$mail->Subject = 'Sync Error Report';
//$mail->msgHTML($mail_content);
    echo "Sending error emails to:".json_encode($report_to).PHP_EOL."You can change it at /PScontrols/#/".PHP_EOL;
    echo "-- Errors and Warnings --".PHP_EOL;
    echo $mail_content.PHP_EOL;
    $mailer->sendEmail($report_to,$mail_content,'Sync Error Report');



//Send attendance only email
    if(count($unset_courses)>0) {
        $mail_content = "Attendance only flag was missing on the following courses: <br><br>";
        foreach ($unset_courses as $course) {
            $mail_content .= $course . "<br>";
        }
        $mail_content .= "<br>To fix this problem go to the matchmaker (/PSmatch/#/) and set each class to attendance only yes or no.";
//    $mail->Subject = 'Unset Courses Detected';
//    $mail->msgHTML($mail_content);

        $mailer->sendEmail($report_to,$mail_content,'Sync Error Report');

        echo $mail_content.PHP_EOL;
    }

    $sections = [];

    foreach($teacherArr as $sectionid=>$teacherObj) {
        $section = new \stdClass();
        $section->lms_code = $elms_sections[$sectionid] ? $elms_sections[$sectionid]->lmsid : null;
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
    $psexport_json = json_encode($psexport,JSON_PRETTY_PRINT);

    $log_file = fopen("logs/export/{$current}.json", "w");
    fwrite($log_file, $psexport_json);
    echo "-- EXPORT JSON FILE --".PHP_EOL;
    echo $psexport_json.PHP_EOL;
    update_db();

    echo "-- SUCCESS --".PHP_EOL;
//post data to myedkey.org
    $host = "http://localhost";
    $url = "{$host}/signin/";
    $headers = array(
        "cache-control: no-cache",
        "content-type: application/x-www-form-urlencoded",
    );
    $data = "username=mikegriffiths11@hotmail.com&password=aloha123";
    $add_opts = array(CURLOPT_HEADER => 1);
    $response = useCurl($url,$headers,$data,"POST",$add_opts);
    preg_match('/PHPSESSID=(.*?);/', $response, $matches);
    $phpsessid = $matches[1];

    $url = "{$host}/api/organizations/10/imports/powerschool";
    $headers = array(
        "cache-control: no-cache",
        "content-type: application/json",
        "Cookie: PHPSESSID={$phpsessid}"
    );
    echo "-- STARTING IMPORT --".PHP_EOL;
    $response = useCurl($url,$headers,$psexport_json,"POST");
    echo "-- IMPORT RESPONSE --".PHP_EOL;
    $json_resp =  json_encode(json_decode($response),JSON_PRETTY_PRINT);
    echo $json_resp;
    $f = fopen('logs/db/errors_log_'.$current,'w');
    fwrite($f,$json_resp);
    fclose($f);
}
if(!isset($delayScript)){
    main();
}



