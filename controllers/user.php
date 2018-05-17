<?php
global $PATHS, $DB;
use English3\Controller\ClassesController;
use English3\Controller\ProficiencyTest\TestApi;
use English3\Controller\ProficiencyTest\TestClasses;
use English3\Controller\ProficiencyTest\TestSchoolsAdmins;
use English3\Controller\SiteController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Controller\Organization\AllowedUsersToLogInAsOthers;


require_once('usertools/orm.php');
require_once('_utils.php');
require_once ('sql.php');
function hardCodedHideSplash($userId){
	$hardCodedPlacementClass = 871;
	$isEnrolledToPlacementClass = boolval(
		Utility::getInstance()->fetchOne(
			"SELECT id FROM user_classes WHERE userid = :userId and classid = :classId and is_student=1",
			[
				'userId'=>$userId,
				'classId'=>$hardCodedPlacementClass
			]
		)
	);
	return $isEnrolledToPlacementClass;
}
if(isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN']==true) {
	$data = new \stdClass();
	$util = new Utility();
	$uri = strtok($_SERVER['REQUEST_URI'], '?');

	$uri = str_replace('/user/', '', $uri);

	$uri = strtok($uri, '/');

	if($uri == 'return-to-my-account'){
		if(!isset($_SESSION['USER']['MY_USER_ID'])){
            throw new Exception("My User id is required",400);
		}
        $user = new PmOrm($_SESSION, $DB);
        $targetid = $_SESSION['USER']['MY_USER_ID'];
        $targetuser = $user->fetch_one("SELECT id,fname,lname,email FROM users WHERE id={$targetid}");
        if($targetuser){
            if(session_status() == 1)session_start();
            $_SESSION['USER']['LOGGED_IN'] = true;
            $_SESSION['USER']['ID'] = $targetuser['id'];
            $_SESSION['USER']['FNAME'] = $targetuser['fname'];
            $_SESSION['USER']['LNAME'] = $targetuser['lname'];
            $_SESSION['USER']['EMAIL'] = $targetuser['email'];
            unset($_SESSION['USER']['ADMIN_AS_USER']);
            unset($_SESSION['USER']['MY_USER_ID']);
            jsonResponse(['status'=>'success']);
        }else{
            throw new Exception("An error has ocurred. Invalid user id?",500);
        }
    }else if($uri == 'me') {
		$data->id = $_SESSION['USER']['ID'];

	} else {
		$data->id = $uri;
	}
	$sql = new BaseSQL();
	$info = $sql->fetch_one("SELECT u.*,o.id as org_id,
							o.logo,o.white_label,o.name,o.use_splash,
							o.support_email,o.teacher_can_edit_classes,
							 o.hide_grades_page,o.disallow_email,o.can_edit_profile,
							 o.hide_all_messages,o.enable_reports,o.enable_fix_quizzes,
							 o.enable_chat_app,o.enable_attendance_warning,
							 o.hide_eng_menu,
							 o.enable_attendance,o.category_dashboard,o.show_password_manager,o.sort_users_by,o.use_alert_splash,o.sort_posts_grader,
							 o.show_site,o.allow_users_to_log_in_as_others
							  from users u
								JOIN organizations o on u.organizationid = o.id
								where u.id = {$data->id}");

	$data->external_id = $info->external_id;
	$data->fname = $info->fname;
	$data->lname = $info->lname;
	$data->email = $info->email;
	$data->phone = $info->phone;
	$data->is_active = $info->is_active;
	$data->teacher_supervisor = $info->teacher_supervisor==1;
	$data->admin_as_user = isset($_SESSION['USER']['ADMIN_AS_USER']) && $_SESSION['USER']['ADMIN_AS_USER'] == true;
    $allowedUsersToLogInAsOthers = new AllowedUsersToLogInAsOthers($info->org_id);

	$data->org = array(
		'id'=>$info->org_id,
		'name'=>$info->name,
		'logo'=>$info->logo,
		'white_label'=>$info->white_label==1,
		'use_splash'=>boolval($info->use_splash) && !hardCodedHideSplash($data->id),
		'teacher_can_edit_classes' => boolval($info->teacher_can_edit_classes),
		'support_email'=>$info->support_email,
		'sort_users_by'=>$info->sort_users_by,
		'sort_posts_grader'=>$info->sort_posts_grader,
		'hide_grades_page'=>boolval($info->hide_grades_page),
		'disallow_email' => boolval($info->disallow_email),
		'can_edit_profile' => boolval($info->can_edit_profile),
		'hide_all_messages'=>boolval($info->hide_all_messages),
		'enable_reports'=>boolval($info->enable_reports),
		'enable_attendance'=>boolval($info->enable_attendance),
		'enable_fix_quizzes'=>boolval($info->enable_fix_quizzes),
		'category_dashboard'=>boolval($info->category_dashboard),
		'show_password_manager'=>boolval($info->show_password_manager),
		'use_alert_splash'=>boolval($info->use_alert_splash),
		'enable_chat_app'=>boolval($info->enable_chat_app),
		'enable_attendance_warning'=>boolval($info->enable_attendance_warning),
		'hide_eng_menu' =>boolval($info->hide_eng_menu),
		'show_site' =>boolval($info->show_site),
        'allow_users_to_log_in_as_others' =>boolval($info->allow_users_to_log_in_as_others),
		'allowedUsersToLogInAsOthers'=>$allowedUsersToLogInAsOthers->load($info->org_id)->getPreferences()
	);
	$siteId = SiteController::_getUserSite($data->id);
	if($siteId){
		$data->siteId = $siteId;
	}




	$license = $sql->fetch_one("select * from licenses where user_id={$data->id} order by activated desc limit 1");
	if($license){
		$expiration = new DateTime($license->expiry_date);
		$timeleft = $expiration->diff(new DateTime());
		//$timeleft=$timeleft->s;

		if($license->type=='hours'){
			$totaltime = $_SESSION['USER']['TOTALTIME']+ ($_SESSION['LAST_ACTIVITY']-$_SESSION['CREATED']);
			$timeleft = $license->duration*3600 - $totaltime;

		}
		else{
			$expiration = new DateTime($license->expiry_date);
			$now= new DateTime();
			$timeleft = $expiration->getTimestamp() - $now->getTimestamp();
		}

		$data->license=array(
			'type'=>$license->type,
			'timeleft'=>$timeleft
		);

	}

	/*
	 * DSerejo 2015-02-02
	 * Getting admin information from user
	 */
	//Getting super user information
	$query = "SELECT can_create_super_users FROM `user_admin_super` WHERE user_admin_super.user_id={$data->id} LIMIT 1";
	$result = $DB->mysqli->query($query);
	if($result && $result->num_rows == 1){
		$row = $result->fetch_object();
		$data->is_super_admin=true;
		$data->can_add_super_admin=$row->can_create_super_users;
	}

	//Getting organization admin information
	$query = "SELECT can_add_admin_users,can_add_users,can_edit_courses FROM `user_admin_organizations` WHERE userid={$data->id} LIMIT 1";
	$result = $DB->mysqli->query($query);
	if($result && $result->num_rows == 1){
		$row = $result->fetch_object();
		$data->is_organization_admin=true;
		$data->can_add_organization_admin=$row->can_add_admin_users;
		$data->can_add_user=$row->can_add_users;
		$data->can_edit_course=$row->can_edit_courses;
	}

	//Is teacher?
	$query = "SELECT user_classes.userid,classid ,is_edit_teacher,is_student,is_teacher,is_observer
 				FROM `user_classes`
 				 WHERE user_classes.userid={$data->id}";
	$result = $DB->mysqli->query($query);
	$data->is_edit_teacher = false;

	if($result && $result->num_rows > 0) {

		while($row = $result->fetch_object()){
			if($row->is_edit_teacher==1) $data->is_edit_teacher=true;
			if($row->is_teacher==1) $data->is_teacher=true;
			if($row->is_student==1) $data->is_student=true;
			if($row->is_observer==1) $data->is_observer=true;
		}

	}
	if($data->is_teacher){
		$data->is_proficiency_teacher = boolval(Utility::getInstance()->fetchOne(TestClasses::$queryIsProficiencyTeacher,['userId'=>$_SESSION['USER']['ID']]));
		$data->is_non_proficiency_teacher = boolval(Utility::getInstance()->fetchOne(TestClasses::$queryIsNonProficiencyTeacher,['userId'=>$_SESSION['USER']['ID']]));
	}

	if($data->is_edit_teacher){
		$data->classPasswordsAboutToExpire = ClassesController::checkPagePasswordExpiration();
	}


	$isAvisor = $util->fetchOne(UserController::$queryIsAdvisor,['userId'=>$data->id]);

	$isGuardian = $util->fetchOne(UserController::$queryIsGuardian,['userId'=>$data->id]);
	$data->is_site_admin = UserController::isSiteAdmin($data->id);
	$data->is_advisor = boolval($isAvisor) || $data->is_site_admin;
	$data->is_guardian = boolval($isGuardian);
	$data->is_only_test_admin = TestApi::isOnlyTestAdmin($data->id) && (!$data->is_site_admin || $data->is_advisor|| $data->is_guardian);
	$data->school_admin = TestSchoolsAdmins::schoolAdmin($data->id);
	$userInstance = new UserController(Utility::getInstance()->reader);
	$data->can_enter_attendance = boolval(@$util->fetchOne("select * from user_guardians where userid = :userId and can_enter_attendance=1",['userId'=>$data->id],'can_enter_attendance'));
	$data->menuPreference = UserController::getMenuPreference($data->id);
	$data->noMenuGraderCount = \English3\Controller\PostsController::_countNoMenuNeedingGrade();
	if($data->is_teacher|| $data->is_super_admin || $data->is_organization_admin){
		$data->graderMenuPreference = UserController::getGraderMenuPreference($data->id);
	}

	$data->showMissingAttendanceWarning = \English3\Controller\Attendance\MissingAttendanceChecker::shouldWarning($data->id);
	$data->hasOnlyProficiencyClasses = !$data->is_guardian && $userInstance->hasOnlyProficiencyClasses();
	$data->availableProfileSettings = $userInstance->profileSettings($data);
	$data->useProfileSettings = count($data->availableProfileSettings)>0;
	header('Content-Type: application/json');

	print json_encode($data);

	exit();
} 

?>

