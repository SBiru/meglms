<?php

require_once('../../../../controllers/_utils.php');
require_once("../../../../lib/xml2json/xml2json.php");
require_once('../../../../config.php');
require_once('../../../../../meglms/SCORMCloudPHPLibrarymaster/ScormEngineService.php');


global $SCORM_CFG, $DB;

$mysqli = new mysqli($DB->host, $DB->user, $DB->password, $DB->database);
$ServiceUrl = $SCORM_CFG->scormcloudurl;
$AppId = $SCORM_CFG->scormcloudappid;
$SecretKey = $SCORM_CFG->scormcloudsecretkey;
$Origin = $SCORM_CFG->scormcloudorigin;

$ScormService = new ScormEngineService($ServiceUrl, $AppId, $SecretKey, $Origin);
$courseService = $ScormService->getCourseService();
$regService = $ScormService->getRegistrationService();

$tokenId = $_GET["id"];

$courseId = $_GET["courseId"];
$registerationId = $_GET["registerationId"];
$userId = $_GET["userId"];
$pageId = $_GET["pageId"];
$mail = $_GET["mail"];
if($registerationId && $courseId){
//    $courseResult = $regService->GetRegistrationList($courseId,$mail);
    $regResults = $regService->GetRegistrationResult($registerationId,0,'xml');
    $xmlResults = simplexml_load_string($regResults);
    $score = $xmlResults->registrationreport->score;
    $query = "SELECT id FROM `gradebook` WHERE userid = $userId AND pageid = $pageId";
    $result = $mysqli->query($query);
    if($score != "unknown"){
        if($result && $result->num_rows == 1) {
            $row = $result->fetch_object();
            $query = "UPDATE `gradebook` SET score = $score WHERE id = $row->id";
        }
        else{
            $query = "INSERT INTO `gradebook` (userid,pageid,score,max_score) VALUES ($userId, $pageId, $score,100)";
        }
        $mysqli->query($query);
    }
    header("Location:/#/scorm/$pageId");
    exit();
}

//$interstitial = "http://localhost/SCORMCloudPHPLibrarymaster/samples/AsyncImport/result";

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
    $prevUrl = $courseService->GetPreviewUrl($courseid);
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
    $testLink = $regService->GetLaunchUrl($regId,$SCORM_CFG->wwwroot."ScormCloudController.php?courseId=".$courseId."&registerationId=".$regId."&userId=".$userId."&pageId=".$pageId."&mail=".$mail);
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
}

?>

