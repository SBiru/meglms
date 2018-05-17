<?php

require_once('_utils.php');
require_once('lib/xml2json/xml2json.php');
require_once('config.php');
require_once('SCORMCloudPHPLibrarymaster/ScormEngineService.php');


global $SCORM_CFG, $DB;

$mysqli = new mysqli($DB->host, $DB->user, $DB->password, $DB->database);
$ServiceUrl = $SCORM_CFG->scormcloudurl;
$AppId = $SCORM_CFG->scormcloudappid;
$SecretKey = $SCORM_CFG->scormcloudsecretkey;
$Origin = $SCORM_CFG->scormcloudorigin;

$ScormService = new ScormEngineService($ServiceUrl, $AppId, $SecretKey, $Origin);
$courseService = $ScormService->getCourseService();
$regService = $ScormService->getRegistrationService();

$request = array();
if (preg_match('/\/.+\/([a-z\-]+)/', $_SERVER['REQUEST_URI'], $request)) {
    $request['action'] = $request[1];
}

if ($request['action'] == 'get-upload-url') {
    $data = new \stdClass();
    $courseId = $_GET["courseid"]!="undefined" && $_GET["courseid"] ? $_GET["courseid"]:uniqid();
    $asyncImportUrl = $courseService->GetImportCourseAsyncUrl($courseId, $interstitial);
    $data->url = $asyncImportUrl;
    $data->courseId = $courseId;
    jsonResponse($data);
} else if ($request['action'] == 'preview-url') {
    $data = new \stdClass();
    $courseid = $_GET["courseid"];
    $prevUrl = $courseService->GetPreviewUrl($courseid, $SCORM_CFG->wwwroot."ScormCloudController/course-completed");
    $data->preurl = $prevUrl;
    jsonResponse($data);
} else if ($request['action'] == 'gettittle') {
    $data = new \stdClass();
    $courseId = $_GET["id"];
    $metadata = $courseService->GetMetadata($courseId, 0, 0, 1);
    $data->metadata = $metadata;
    jsonResponse($data);
} else if ($request['action'] == 'get-upload-status') {
    $tokenId = $_GET["id"];
    $xmlresp = $courseService->GetAsyncImportResult($tokenId);
    $xmlStringContents = simplexml_load_string($xmlresp);
    $resp = xml2json::convertSimpleXmlElementObjectIntoArray($xmlStringContents);
    jsonResponse($resp);
} else if ($request['action'] == 'get-edit-url') {
    $data = new \stdClass();
    $tokenId = $_GET["courseid"];
    $asyncImportUrl = $courseService->GetImportCourseAsyncUrl($courseId, $interstitial);
    $data->url = $asyncImportUrl;
    $data->courseId = $courseId;
    jsonResponse($data);
} else if ($request['action'] == 'take-test') {
    $data = new \stdClass();
    $courseId = $_GET["courseId"];
    $pageId = $_GET["pageId"];
    $mail = $_GET["mail"];
    $firstName = $_GET["firstName"];
    $lastName = $_GET["lastName"];
    $userId = $_GET["userId"];

    $query = "SELECT scorm_registeration_id FROM `scorm_registerations` WHERE user_mail = '$mail' AND scorm_course_id = '$courseId'";
    $result = $mysqli->query($query);
    if($result && $result->num_rows == 1) {
        $row = $result->fetch_object();
        $regId = $row->scorm_registeration_id;
    }
    else{
        $regId = uniqid(rand(), true);
        $regService->CreateRegistration($regId, $courseId, $mail, $firstName, $lastName);
        $query = "INSERT INTO `scorm_registerations` (user_mail,scorm_course_id,page_id,scorm_registeration_id) VALUES ('$mail','$courseId',$pageId,'$regId');";
        $result = $mysqli->query($query);
    }
    $testLink = $regService->GetLaunchUrl($regId,$SCORM_CFG->wwwroot."ScormCloudController/test-completed?courseId=".$courseId."&registrationId=".$regId."&userId=".$userId."&pageId=".$pageId."&mail=".$mail);
    $regResults = $regService->GetRegistrationResult($regId,2,'xml');
    $data->url = $testLink;
    $data->courseId = $courseId;
    jsonResponse($data);
}else if ($request['action'] == 'edit-attripute') {
    $data = new \stdClass();
    $courseId = $_GET["courseid"];
    $att = $_GET["attr"];
    $attval = $_GET["attrval"];

    $paramAtts = array($att => $attval);
    $changedAtts = $courseService->UpdateAttributes($courseId,Null,$paramAtts);
    $data->url = $changedAtts;
    jsonResponse($data);
}else if ($request['action'] == 'update-mark') {
    $userId = $_GET["userId"];
    $pageId = $_GET["pageId"];
    $courseId = $_GET["courseId"];
    $mail = $_GET["mail"];
    $query = "SELECT scorm_registeration_id FROM `scorm_registerations` WHERE user_mail = '$mail' AND scorm_course_id = '$courseId'";
    $result = $mysqli->query($query);
    $row = $result->fetch_object();
    $registrationId = $row->scorm_registeration_id;
    $regResults = $regService->GetRegistrationResult($registrationId,2,'xml');
    $xmlResults = simplexml_load_string($regResults);
    $activity = $xmlResults->registrationreport->activity;
    $runtime = $activity->children->activity->runtime;
    $learnerpreference = $runtime->learnerpreference;
    $static = $runtime->static;
    $title = $activity->title;
    $satisfied = $activity->satisfied;
    $completed = $activity->completed;
    $progress_status = $activity->progressstatus;
    $attempt_progress_status = $activity->attemptprogressstatus;
    $attempts = $activity->attempts;
    $suspended = $activity->suspended;
    $completion_status = $runtime->completion_status;
    $credit = $runtime->credit;
    $entry = $runtime->entry;
    $exit = $runtime->exit;
    $audio_level = $learnerpreference->audio_level;
    $language = $learnerpreference->language;
    $delivery_speed = $learnerpreference->delivery_speed;
    $audio_captioning = $learnerpreference->audio_captioning;
    $location = $runtime->location;
    $mode = $runtime->mode;
    $progress_measure = $runtime->progress_measure;
    $score_scaled = $runtime->score_scaled;
    $score_raw = $runtime->score_raw;
    $score_min = $runtime->score_min;
    $score_max = $runtime->score_max;
    $total_time = $runtime->total_time;
    $time_tracked = $runtime->time_tracked;
    $success_status = $runtime->success_status;
    $suspend_data = $runtime->suspend_data;
    $comments_from_learner = $runtime->comments_from_learner;
    $comments_from_lms = $runtime->comments_from_lms;
    $objectives = $runtime->objectives;
    $completion_threshold = $static->completion_threshold;
    $launch_data = $static->launch_data;
    $learner_id = $static->learner_id;
    $learner_name = $static->learner_name;
    $max_time_allowed = $static->max_time_allowed;
    $scaled_passing_score = $static->scaled_passing_score;
    $time_limit_action = $static->time_limit_action;
    $children = $activity->children->children;
    $interactions = json_encode(xml2json::convertSimpleXmlElementObjectIntoArray($runtime->interactions));

    $scorm_response = json_encode(xml2json::convertSimpleXmlElementObjectIntoArray($xmlResults)) ;
    $query = "INSERT INTO `scorm_responses` (scorm_registeration_id,title,satisfied,completed,progress_status,
attempt_progress_status,attempts,suspended,completion_status,credit,entry,`exit`,audio_level,`language`,delivery_speed,
audio_captioning,location,`mode`,progress_measure,score_scaled,score_raw,score_min,score_max,total_time,time_tracked,
success_status,suspend_data,comments_from_learner,comments_from_lms,objectives,completion_threshold,launch_data,
learner_id,learner_name,max_time_allowed,scaled_passing_score,time_limit_action,children,interactions,scorm_response) values 
('$registrationId','$title',$satisfied,$completed,$progress_status,$attempt_progress_status,'$attempts',
$suspended,'$completion_status','$credit','$entry','$exit','$audio_level','$language','$delivery_speed','$audio_captioning',
'$location','$mode','$progress_measure','$score_scaled','$score_raw','$score_min','$score_max','$total_time',
'$time_tracked','$success_status','$suspend_data','$comments_from_learner','$comments_from_lms','$objectives','$completion_threshold',
'$launch_data','$learner_id','$learner_name','$max_time_allowed','$scaled_passing_score','$time_limit_action','$children','$interactions','$scorm_response')";
    $result = $mysqli->query($query);
    $query = "SELECT id FROM `gradebook` WHERE userid = $userId AND pageid = $pageId";
    $result = $mysqli->query($query);

    if($score_max == 0 && $runtime->interactions == ""){
        $score_raw = $completed == "true" ? 1 : 0;
        $score_max = 1;
    }
    if($result && $result->num_rows == 1) {
        $row = $result->fetch_object();
        $query = "UPDATE `gradebook` SET score = $score_raw, max_score = $score_max, is_score_override = TRUE WHERE id = $row->id";
    }
    else{
        $query = "INSERT INTO `gradebook` (userid,pageid,score,max_score) VALUES ($userId, $pageId, $score_raw,$score_max)";
    }
    $mysqli->query($query);

    exit();
}
else if ($request['action'] == 'course-completed'){
    echo("You are exited from SCORM course");
}
else if ($request['action'] == 'test-completed'){
    echo("SCORM course has been completed.");
    echo(" Click on submit button to store your score");
}
else if ($request['action'] == 'get-mark'){
    $userId = $_GET["userId"];
    $pageId = $_GET["pageId"];
    $query = "SELECT score FROM `gradebook` WHERE userid = $userId AND pageid = $pageId";
    $result = $mysqli->query($query);
    $row = $result->fetch_object();
    $data->score = $row->score;;
    jsonResponse($data);
}
?>

