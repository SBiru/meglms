<?php

global $PATHS, $DB;
require_once('usertools/orm.php');
use English3\Controller\CanvasTemplates\CanvasTemplatesDB;
use English3\Controller\ClassesController;
use English3\Controller\Glossary\GlossaryLinkOptions;
use English3\Controller\Glossary\GlossaryLinks;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\PageController;
use English3\Controller\QuestionController;
use English3\Controller\Utility;

if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$pattern = '/\/content\/(?P<contentID>\d*)\/?(?P<layoutType>\w*)/';
	preg_match($pattern, $_SERVER['REQUEST_URI'], $matches);
	
	$content_id = intval($matches['contentID']);
	$layoutType =  $DB->mysqli->real_escape_string ((empty($matches['layoutType'])) ? 'CONTENT' : strtoupper($matches['layoutType']));

	if($content_id > 0) {
		$user_id = INTVAL($_SESSION['USER']['ID']);
		$orm = new PmOrm($_SESSION,$DB);

		$select = "SELECT pages.unitid, pages.id, pages.name, pages.subtitle, pages.content, pages.allow_video_post,pages.new_post_text,
					pages.allow_text_post,pages.allow_video_text_post, pages.allow_upload_post, pages.allow_upload_only_post, pages.allow_template_post, pages.is_private, pages.is_gradeable,
					pages.password,pages.template,pages.question,pages.show_archived_posts,departments.organizationid,
					 pages.hide_reply,pages.layout";

		$commonWhere = " AND pages.id={$content_id}
					AND (pages.layout='CONTENT' or pages.layout='FORUM' or pages.layout='TIMED_REVIEW' or pages.layout='WELCOME' or pages.layout='PICTURE' or pages.layout='GLOSSARY' or pages.layout='SCORM') LIMIT 1";

		$org = $orm->my_org()['id'];
		if($orm->am_i_super_user()){
			$from = " FROM pages
			 		JOIN units on units.id = pages.unitid
					JOIN courses on courses.id = units.courseid
					JOIN departments on departments.id = courses.departmentid ";
			$where = " WHERE 1 ";


		} else if($orm->am_i_organization_admin()){

			$from = " FROM pages
					JOIN units on units.id = pages.unitid
					JOIN courses on courses.id = units.courseid
					JOIN departments on departments.id = courses.departmentid ";

			$where = " WHERE departments.organizationid = {$org} ";
		}
		else {
			$from = " FROM `user_classes`
					JOIN classes ON (user_classes.classid=classes.id)
					JOIN units ON (classes.courseid=units.courseid)
					JOIN pages ON (pages.unitid=units.id)
					JOIN courses on courses.id = units.courseid
					 JOIN departments on departments.id = courses.departmentid ";

			$where = " WHERE user_classes.userid={$user_id} ";
		}
		$query = $select . $from . $where .$commonWhere;
		$result = $DB->mysqli->query($query);

		if($result && $result->num_rows == 1) {

			$row = $result->fetch_object();

			$data = new \stdClass();
            $data->unitid = $row->unitid;
			$data->id = $row->id;
			$data->pagename = $row->layout=='WELCOME'?$row->name .' '. $_SESSION['USER']['FNAME'].'!':$row->name;
			$data->new_post_text = $row->new_post_text;
			$extraOptions = PageController::_getPageMeta($row->id);
			$data->next_text = $extraOptions['next_text'];
			$data->nextClassName = @$extraOptions['next_class_name'];
			$data->isIdVerification = boolval($extraOptions['is_id_verification']);
			$data->subtitle = $row->subtitle;
			$data->contenthtml = Utility::addMediaAttribute($row->content,'video');
			$wildCardReplacer = new WildCardReplacer($data->contenthtml);
			$wildCardReplacer->replace();
			$data->contenthtml = $wildCardReplacer->getContent();

			$classId = ClassesController::_getFromPage(Utility::getInstance()->reader,$content_id);
    			if(GlossaryLinkOptions::_checkPageType($classId,strtolower($row->layout)) &&
                    !boolval(PageController::_getPageMeta($content_id,'exclude_glossary'))
                ){
                $data->contenthtml = GlossaryLinks::processIfNeeded($classId,
                    $data->contenthtml);
            }

			$data->allow_video_post = $row->allow_video_post;
			$data->allow_video_text_post = $row->allow_video_text_post;
			$data->allow_text_post = $row->allow_text_post;
			$data->allow_upload_post = $row->allow_upload_post;
			$data->allow_upload_only_post = $row->allow_upload_only_post;
			$data->allow_template_post = $row->allow_template_post;

			$data->hide_reply = boolval($row->hide_reply);
			$data->page_is_private = $row->is_private;
            $data->page_is_gradeable = $row->is_gradeable;
			$data->template = $row->template?CanvasTemplatesDB::get($row->template):null;
			$data->show_archived_posts = boolval(OrganizationController::_getField($row->organizationid,'save_deleted_posts'));
			$data->submit_file_automatically = boolval(OrganizationController::_getPreferencesField($row->organizationid,'submit_file_automatically'));
            $data->orgId = $row->organizationid;
			$data->need_password = $row->password?true:false;
			$data->layout = $row->layout;
			$data->question=QuestionController::hasRespondedPageQuestion($row->id,$_SESSION['USER']['ID'])?null:QuestionController::fetchBeforeLeavePageQuestions(json_decode($row->question,true));
			$data->meta = $extraOptions;
			if(boolval(@$data->meta['hide_title'])){
			    $data->pagename = '';
            }

			$data->showResubmit = boolval(OrganizationController::_getField($row->organizationid,'show_resubmit_button')) && $data->layout !== 'PICTURE';

			$query2 ="SELECT * FROM posts WHERE userid={$user_id} AND pageid={$content_id} AND is_deleted=0";
			$result2 = $DB->mysqli->query($query2);
			$data->number_of_posts = $result2->num_rows;

			$query3 = "SELECT * FROM scorm WHERE page_id = $row->id";
            $result3 = $DB->mysqli->query($query3);
            if($result3 && $result3->num_rows == 1) {
                $row3 = $result3->fetch_object();
                $data->is_scorm = true;
                $data->scorm_course_id = $row3->scorm_course_id;
                $data->scorm_name = $row3->scorm_name;
                $data->display_description = $row3->display_description;
                $data->scorm_title = $row3->scorm_title;
                $data->isStudent = $_SESSION[JUST_STUDENT];
                $data->userMail = $_SESSION[USER][EMAIL];
                $data->userFirstName = $_SESSION[USER][FNAME];
                $data->userLastName = $_SESSION[USER][LNAME];
                $data->userId = $_SESSION[USER][ID];
                $query3 = "SELECT * FROM gradebook WHERE pageid = $row->id and userid = $data->userId";
                $result3 = $DB->mysqli->query($query3);
                $row3 = $result3->fetch_object();
                $data->score = $row3->score;
            }

			header('Content-Type: application/json');

			print json_encode($data);			
		}
	}

	exit();
}
class WildCardReplacer{
	private $content;
	public function __construct($content,$options=null){
		$this->content = $content;
	}
	public function replace(){
		foreach($this->availableWildCards as $replaceFunc){
			call_user_func([$this,$replaceFunc]);
		}
	}
	public function replaceOrgName(){
		$orgName = Utility::getInstance()->fetchOne("SELECT name FROM organizations o JOIN users u ON u.organizationid = o.id where u.id = :userId",['userId'=>$_SESSION['USER']['ID']]);
		$this->content = str_replace('{$org_name}',$orgName,$this->content);
	}
	public function getContent(){
		return $this->content;
	}


	private $availableWildCards = [
		'orgName' => 'replaceOrgName'
	];
}
?>