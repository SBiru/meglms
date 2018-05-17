<?php
//require_once('config.php');
//require_once('../../meglms/SCORMCloudPHPLibrarymaster/ScormEngineService.php');
//require_once("/lib/xml2json/xml2json.php");
require_once('config.php');
require_once("lib/xml2json/xml2json.php");
require_once('SCORMCloudPHPLibrarymaster/ScormEngineService.php');

Class ScormController{
    public function __construct($db) {
        $this->db = $db;
    }
    public static function deleteScorm($courseid){
        global $SCORM_CFG;
        $ServiceUrl = $SCORM_CFG->scormcloudurl;
        $AppId = $SCORM_CFG->scormcloudappid;
        $SecretKey = $SCORM_CFG->scormcloudsecretkey;
        $Origin = $SCORM_CFG->scormcloudorigin;
        $ScormService = new ScormEngineService($ServiceUrl, $AppId, $SecretKey, $Origin);
        $courseService = $ScormService->getCourseService();
        $xmlresp = $courseService->DeleteCourse($courseid, 'false');
        $xmlStringContents = simplexml_load_string($xmlresp);
        return xml2json::convertSimpleXmlElementObjectIntoArray($xmlStringContents);
    }
    public static function editUrl($courseid){
        global $SCORM_CFG;
        $ServiceUrl = $SCORM_CFG->scormcloudurl;
        $AppId = $SCORM_CFG->scormcloudappid;
        $SecretKey = $SCORM_CFG->scormcloudsecretkey;
        $Origin = $SCORM_CFG->scormcloudorigin;
        $ScormService = new ScormEngineService($ServiceUrl, $AppId, $SecretKey, $Origin);
        $courseService = $ScormService->getCourseService();
        if(ScormController::isExist($courseService, $courseid))
            return $courseService->GetPropertyEditorUrl($courseid,Null,Null);
        else
            return false;
    }
    public static function properties($courseid){
        global $SCORM_CFG;
        $ServiceUrl = $SCORM_CFG->scormcloudurl;
        $AppId = $SCORM_CFG->scormcloudappid;
        $SecretKey = $SCORM_CFG->scormcloudsecretkey;
        $Origin = $SCORM_CFG->scormcloudorigin;
        $ScormService = new ScormEngineService($ServiceUrl, $AppId, $SecretKey, $Origin);
        $courseService = $ScormService->getCourseService();
        if(ScormController::isExist($courseService, $courseid))
            return $courseService->GetAttributes($courseid);
        else
            return false;
    }
    public function isExist($courseService,$courseid){
        return $courseService->Exists($courseid);
    }
}
?>

