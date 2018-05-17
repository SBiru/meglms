<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;
use English3\Model\User;
use English3\WebSocket\AuthValidator;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserController{

	public $user;
	public $isLoggedIn;
	private $reader;
	private $isSuperAdmin;
	private $canCreateSuperUsers;
	public $classes;
	public $preferences;
	private $privileges;
	private $children;
	public $advisees;
	private $guardians;
	public $guardiansV2;
	private $trackAttendance;
	private $attendanceWithdrawDate;
	private $includeHistoryClasses=false;
	private $activeClasses=true;

	public function __construct(Connection $reader=null) {
	    if(!$reader){
	        $reader = Utility::getInstance()->reader;
        }
		$this->reader = $reader;
		$this->util = Utility::getInstance($reader);
		$this->user = new User();
		$this->classes = array();
		$this->attendanceOnlyClasses = array();
		$this->preferences = array();
		$this->privileges = array();
		$this->children = array();
		$this->childrenV2 = array();
		$this->advisees = array();
		$this->guardians = array();
		$this->guardiansV2 = array();
		$this->isLoggedIn = false;
	}

	/**
	 * Returns user object or false is not logged in
	 *
	 */
	public static function me(Connection $reader) {
		if(isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
			$userId = intval($_SESSION['USER']['ID']);
			return self::byId($reader, $userId);
		}
		return false;
	}
	public function amISuperUser(){
		return $this->isSuperAdmin;
	}
	public static function isAdvisor($userId){
		return Utility::getInstance()->fetchOne(UserController::$queryIsAdvisor,['userId'=>$userId]) ||
			self::isSiteAdmin($userId);
	}
	public function amIAdvisor(){
		return self::isAdvisor($this->user->getUserId());
	}
	public function amIOrgAdmin($orgid=null){
		if(!is_null($orgid)){
			foreach($this->privileges as $priv){
				if($priv['organizationId']==$orgid)
					return true;
			}
		}
		else{
			return count($this->privileges)>0;
		}
		return false;
	}
	public static function isSiteAdmin($userId){
		return boolval(Utility::getInstance()->fetchOne('SELECT userid FROM user_admin_sites WHERE userid = :userId',['userId'=>$userId]));
	}
	public function getWebsocketToken(){
		if(!$_SESSION['USER']['ID']){
			return Utility::buildHTTPError('Not logged in');
		}
		return new JsonResponse(['token'=>AuthValidator::generateNewToken($_SESSION['USER']['ID'])]);
	}
	public function amIJustGuardian(){
		if($this->isSuperAdmin)
			return false;
		if(count($this->privileges)>0)
			return false;
		foreach($this->classes as $class){
			if(
				$class['isTeacher'] ||
				$class['isEditTeacher'] ||
				$class['isObserver'] ||
				$class['isStudent']
			) {
				return false;
			}
		}
		if(count($this->advisees)){
			return false;
		}
		return true;
	}
	public function amIJustStudent(){
		if($this->isSuperAdmin)
			return false;
		if(count($this->privileges)>0)
			return false;
		foreach($this->classes as $class){
			if(
				$class['isTeacher'] ||
				$class['isEditTeacher'] ||
				$class['isObserver']
			) {
				return false;
			}
		}
		return true;
	}
	public function amIStudentFor($classId){
		return in_array($classId, array_map(function($a){
			return $a['id'];
		},$this->classesILearn()));
	}
	public function classesILearn(){
		$classes = array();
		foreach($this->classes as $class){
			if($class['isStudent']){
				$classes[]=$class;
			}
		}
		return $classes;
	}
	public function classesITeach(){
		$classes = array();
		foreach($this->classes as $class){
			if($class['isTeacher']){
				$classes[]=$class;
			}
		}
		return $classes;
	}
	public function classesIEdit(){
		$classes = array();
		foreach($this->classes as $class){
			if($class['isEditTeacher']){
				$classes[]=$class;
			}
		}
		return $classes;
	}

	public static function byId(Connection $reader = null, $id,$includeHistoryClasses= false,$activeClasses=true) {

		if(!$reader){
			$reader = Utility::getInstance()->reader;
		}
		$instance = new self($reader);
        $instance->includeHistoryClasses = $includeHistoryClasses;
        $instance->activeClasses = $activeClasses;
		$data = $instance->prepareAndFetch(
			$instance->queryInitUser,
			array(':userId' => $id)
		);
		if ($data) {
			$instance->init(
				intval($id),
				$data[0]['fname'],
				$data[0]['lname'],
				$data[0]['email'],
				$data[0]['phone'],
				intval($data[0]['organizationid']),
				strtotime($data[0]['created']) * 1000,
				$data[0]['use_license'],
				$data[0]['password_expires_on'],
				$data[0]['track_attendance'],
				$data[0]['attendance_withdraw_date'],
				$data[0]['address'],
				$data[0]['city'],
				$data[0]['state'],
				$data[0]['country']
			);
		} else {
			throw new HttpException(400, 'User does not exist. userId given: ' . $id);
		}
		return $instance;
	}

	public static function byEmail(Connection $reader, $email) {
		$instance = new self($reader);
		$data = $instance->prepareAndFetch(
			$instance->queryInitUserByEmail,
			array(':email' => $email)
		);
		if ($data) {
			$instance->init(
				intval($data[0]['id']),
				$data[0]['fname'],
				$data[0]['lname'],
				$data[0]['email'],
				$data[0]['phone'],
				intval($data[0]['organizationid']),
				strtotime($data[0]['created']) * 1000,
				$data[0]['use_license'],
				$data[0]['password_expires_on'],
				$data[0]['track_attendance'],
				$data[0]['attendance_withdraw_date'],
				$data[0]['address'],
				$data[0]['city'],
				$data[0]['state'],
				$data[0]['country']
			);
		} else {
			throw new HttpException(400, 'User does not exist. email given: ' . $email);
		}
		return $instance;
	}

	protected function init($id, $fname, $lname, $email, $phone, $orgId, $created,$use_license,$passwordExpirationDate,$trackAttendance,$attendanceWithdrawDate,$address='',$city='',$state='',$country='') {
		// init user
		$this->user->setUserId($id);
		$this->user->setFirstName($fname);
		$this->user->setLastName($lname);
		$this->user->setEmail($email);
		$this->user->setPhone($phone);
		$this->user->setOrgId($orgId);
		$this->user->setDateCreated($created);
		$this->user->setDateCreated($created);
		$this->user->setUseLicense($use_license);
		$this->user->setPasswordExpirationDate($passwordExpirationDate);
		$this->trackAttendance = boolval($trackAttendance);
		$this->attendanceWithdrawDate = $attendanceWithdrawDate;
		$this->user->setAddress($address);
		$this->user->setCity($city);
		$this->user->setState($state);
		$this->user->setCountry($country);
		$this->user->setProfilePicture($this->getProfilePicture($id));

		$this->getAndInitAttendanceOnlyClasses();
		$this-> classes
		 = $this->getAndInitUserClasses( $id,$this->activeClasses,$this->includeHistoryClasses);

		// get and init user's preferences
		$data = $this->prepareAndFetch(
			$this->queryGetUserPreferences,
			array(':userId' => $id)
		);
		foreach ($data as $row) {
			$this->preferences[$row['preference']] = $row['value'];
		}

		// get and init user's privileges
		$data = $this->prepareAndFetch(
			$this->queryGetUserPrivileges,
			array(':userId' => $id)
		);
		foreach ($data as $row) {

			$this->privileges[] = array(
				'organizationId' => intval($row['organizationid']),
				'canEditCourses' => boolval($row['can_edit_courses']),
				'canAddUsers' => boolval($row['can_add_users']),
				'canAddAdminUsers' => boolval($row['can_add_admin_users'])
			);
		}

		// get and init user's superadmin privileges
		$data = $this->prepareAndFetch(
			$this->queryGetUserSuperAdminPrivileges,
			array(':userId' => $id)
		);
		if($data) {
			$this->isSuperAdmin = true;
			$this->canCreateSuperUsers = boolval($data[0]['can_create_super_users']);
		}

		// get and init user's children
		$data = $this->prepareAndFetch(
			$this->queryGetUserChildren,
			array(':userId' => $id)
		);
		foreach ($data as $row) {
			$this->children[] = intval($row['userchildid']);
		}
		foreach ($data as $row) {
			$this->childrenV2[] = self::_wrapUserObject($row);

		}
		$this->getAdvisees($id);

		// get and init user's guardians
		$data = $this->prepareAndFetch(
			self::$queryGetUserGuardians,
			array(':userId' => $id)
		);
		foreach ($data as $row) {
			$this->guardians[] = intval($row['userid']);
			//TODO: MERGE the guardian arrays
			$this->guardiansV2[]=array(
				'id'=>$row['userid'],
				'fname'=>$row['fname'],
				'lname'=>$row['lname'],
				'email'=>$row['email']
			);
		}
	}
	public function getAdvisees($id){
        $filter = new UserAdviseeFilter($id);
        $data = $filter->filter();
        foreach ($data as $row) {
            $user = self::_wrapUserObject($row);
            $user['site']=$row['siteName'];
            $this->advisees[] = $user;
        }
    }
    public function getAdviseeIds($id = null){
	    $id = $id?:$_SESSION['USER']['ID'];
	    if(!count($this->advisees)){
	        $this->getAdvisees($id);
        }
        return array_map(function($u){
            return $u['id'];
        },$this->advisees);
    }
	private function getProfilePicture($id){
		return Utility::getInstance()->fetchOne('SELECT meta_value FROM user_meta where meta_key="profile_picture" and userid = :id',['id'=>$id]);
	}
	public static function getMenuPreference($id){
		$menu = Utility::getInstance()->fetchOne('SELECT meta_value FROM user_meta where meta_key="menu" and userid = :id',['id'=>$id]);
		return $menu?:'left';
	}
	public static function getGraderMenuPreference($id){
		$menu = Utility::getInstance()->fetchOne('SELECT meta_value FROM user_meta where meta_key="grader_menu" and userid = :id',['id'=>$id]);
		return $menu?:'left';
	}
	public function setMenuPreference(Request $request){
		$u = Utility::getInstance();
		$u->calcLoggedIn();
		Utility::clearPOSTParams($request);
		$menu = $request->request->get('menu');
		$u->insert(self::$queryInsertUserMeta,[
			'userid'=>$_SESSION['USER']['ID'],
			'meta_key'=>'menu',
			'meta_value'=>$menu
		]);
		return new JsonResponse('ok');
	}
	public function setGraderMenuPreference(Request $request){
		$u = Utility::getInstance();
		$u->calcLoggedIn();
		Utility::clearPOSTParams($request);
		$menu = $request->request->get('menu');
		$u->insert(self::$queryInsertUserMeta,[
			'userid'=>$_SESSION['USER']['ID'],
			'meta_key'=>'grader_menu',
			'meta_value'=>$menu
		]);
		return new JsonResponse('ok');
	}
	public static function _includeClassMeta(&$classes,$userId){
		foreach($classes as &$class){
			if($class['isTeacher']){
				$classMeta = ClassesController::_getClassMeta($class['courseId']);
				if($classMeta['teacher'] && $classMeta['teacher']==$userId){
					$class['meta']=$classMeta;
				}

			}
		}
	}
	public static function _getUserMeta($userId, $key = null)
	{
		$util = new Utility();
		if (is_null($key)) {
			$data = $util->fetch(self::$queryGetUserMetaData, ['userId' => $userId]);
			$arrayData = array();
			foreach ($data as $row) {
				$arrayData[$row['meta_key']] = $row['meta_value'];
			}
			return $arrayData;
		} else {
			return $util->fetchOne(self::$queryGetUserMetaKey, ['userId' => $userId, 'metaKey' => $key]);
		}
	}
	private function getAndInitAttendanceOnlyClasses(){
		$data = Utility::getInstance()->fetch($this->queryGetUserAttendanceOnlyClasses,['userId'=>$this->user->getUserId()]);
		foreach($data as $row){
			$class = [
				'id'=>$row['classid'],
				'name'=>$row['name'],
				'startedDate'=>@$row['manual_start_date']?:$row['date_started'],
				'attendanceStartedDate'=>@$row['manual_start_date']?:$row['date_started'],
				'dateLeft'=>@$row['manual_end_date']?:$row['date_left']
			];
			$this->attendanceOnlyClasses[]=$class;
		}
	}
    public function getAndInitUserClasses($id,$active=true,$all=false){
        $classes = [];
        if($all){
            $query = $this->queryGetAllUserClasses;
        }else{
            $query = $active?$this->queryGetUserClasses:$this->queryGetUserClassesHistory;
        }
        $data = $this->prepareAndFetch(
            $query,
            array(':userId' => $id)
        );
        foreach ($data as $row) {
            $class = array(
                'id' => intval($row['classid']),
                'courseId' => intval(@$row['courseId']),
                'showDates'=>boolval(@$row['show_dates']),
                'showGrades'=>boolval(@$row['show_grades']),
                'showGradesAsScore'=>array_key_exists('show_grades_as_score',$row)?boolval(@$row['show_grades_as_score']):false,
                'showGradesAsPercentage'=>array_key_exists('show_grades_as_percentage',$row)?boolval(@$row['show_grades_as_percentage']):false,
                'showGradesAsLetter'=>array_key_exists('show_grades_as_letter',$row)?boolval(@$row['show_grades_as_letter']):false,
                'name' => $row['name'],
                'className' => $row['name'],
                'isStudent' => boolval(@$row['is_student']),
                'is_active' => boolval(@$row['is_active']),
                'isWithdrawn' => boolval(@$row['isWithdrawn']),
                'isTeacher' => boolval(@$row['is_teacher']),
                'isEditTeacher' => boolval(@$row['is_edit_teacher']),
                'isObserver' => boolval(@$row['is_observer']),
                'isJ1' => boolval(@$row['is_j1_class']),
                'hideExemptedActivities' => boolval(@$row['hide_exempted_activities']),
                'addedOn' => strtotime(@$row['created']) * 1000,
                'dateLeft' => date('Y-m-d',strtotime(@$row['manual_end_date']?$row['manual_end_date']:@$row['date_left'])),
                'startedDate' => date('Y-m-d',strtotime(@$row['manual_start_date']?$row['manual_start_date']:@$row['created'])),
                'attendanceStartedDate' => date('Y-m-d',strtotime(@$row['manual_attendance_start_date']?$row['manual_attendance_start_date']:@$row['created'])),
                'chatMode'=>@$row['chat_mode_code'],
                'show_table_of_contents'=>array_key_exists('show_table_of_contents',$row)?boolval(@$row['show_table_of_contents']):null
            );
            //adding group name to the class name (if needed)
            if(!is_null($row['groupId'])){
                $class['name'].= " - " . $row['groupName'];
                $class['groupId'] = $row['groupId'];
                $class['groupName'] = $row['groupName'];
            }

// if this user is a student (and only a student), add total score obtained in class to result
            if($class['isStudent'] && !$class['isTeacher'] && !$class['isEditTeacher'] && !$class['isObserver']){
                $class['calculatedScore'] = intval($this->util->fetchOne(
                    $this->queryGetCalculatedUserScore,
                    array('userId1' => $id,'userId' => $id, 'classId' => $class['id'])
                ));
            }
            // if finalized, add those fields
            if($row['final_score'] != null) {
                $class['finalized'] = array(
                    'score' => ($row['final_score'] == null)? null : intval($row['final_score']),
                    'by' => intval($row['finalizedBy']),
                    'on' => strtotime($row['finalizedOn']) * 1000,
                    'comments' => $row['finalizedComments']
                );

            }
            $classes[] = $class;
        }
        return $classes;
    }	public function getUser(Request $request, $id = null,$echo=true,$includeHistoryClasses=false) {
		// only logged in users can call this method
		if(!isset($_SESSION['USER']) || !isset($_SESSION['USER']['ID'])) {
			throw new HttpException(403, "Not logged in");;
		}

		$email = $request->query->get('email');
		if($email) {
			$user = self::byEmail($this->reader, $email);
		} else {
			$user = ($id)? self::byId($this->reader, $id,$includeHistoryClasses) : self::me($this->reader);
		}
		$result = $user->user->toArray();
		$result['isSuperAdmin'] = $user->isSuperAdmin;
		$result['canCreateSuperUsers'] = $user->canCreateSuperUsers;
		$result['classes'] = $user->classes;
		$result['attendanceOnlyClasses'] = $user->attendanceOnlyClasses;
		$result['preferences'] = $user->preferences;
		$result['privileges'] = $user->privileges;
		$result['children'] = $user->children;
		$result['childrenV2'] = $user->childrenV2;
		$result['advisees'] = $user->advisees;
		$result['guardians'] = $user->guardians;
		$result['guardiansV2'] = $user->guardiansV2;
		$result['site'] = SiteController::_getSiteForUser($result['userId']);
		$result['trackAttendance'] = $user->trackAttendance;
		$result['attendanceWithdrawDate'] = $user->attendanceWithdrawDate;
		if($request->query->get('includeUserMeta')){
			$result['meta'] = self::_getUserMeta($id);
		}
		if($request->query->get('includeClassMeta')){
			self::_includeClassMeta($result['classes'],$id);
		}
		if($echo){
			return new JsonResponse($result);
		}else{
			return $result;
		}

	}
	public function getSpecificUsers(Request $request){
		$u = Utility::getInstance();
		$u->calcLoggedIn();
		Utility::clearPOSTParams($request);
		$userIds = $request->request->get('users');

		$users = array();
		foreach($userIds as $id){
			$users[]=$this->getUser($request,$id,false,boolval($request->request->get('includeHistoryClasses')));
		}
		return new JsonResponse($users);
	}
	public function getUsers(Request $request){
		return new JsonResponse(self::_getUsers($request->query->all(),$request->query->get('role')));
	}
	public function getStudents(Request $request, $id){
		if($id=='me'){
			$id = $_SESSION['USER']['ID'];
		}
		$students = Utility::getInstance()->fetch(self::$queryGetStudents,['userId'=>$id]);
		return new JsonResponse($students);
	}
	public static function checkPasswordExpiration($userId,$me = null){
		if(!$me){
			$me=self::byId(Utility::getInstance()->reader,$userId);
		}
		$amIAdmin = Utility::getInstance()->checkAdmin($me->user->getOrgId(),true,false);
		if($amIAdmin){
			return true;
		}


		$orgDetails = OrganizationController::_get($me->user->getOrgId(),false);

		if(boolval($orgDetails['enable_password_expiration'])){
			$applyToMe = false;
			$users = $orgDetails['password_expiration_users'];

			if($users['teachers']){
				$applyToMe = $me->isTeacher();
			}
			if($users['students'] && !$applyToMe){
				$applyToMe = $me->isStudent();
			}
			if($applyToMe){
				return new \DateTime() <= new \DateTime($me->user->getPasswordExpirationDate());
			}
		}

		return true;
	}
	public static function getNewExpirationDate($orgDetails,\DateTime $now){

		if($orgDetails['password_expiration_type']=='fixed'){
			$dates = $orgDetails['password_expiration_dates'];
			$newExpirationDate = null;
			foreach($dates as $date){
				if(new \DateTime($date)>$now){
					$newExpirationDate=$date;
				}
			}
		}else{
			$time = $orgDetails['password_expiration_time'];
			$unit = $orgDetails['password_expiration_unit'];

			$interval = 'P'.$time.strtoupper(substr($unit,0,1));

			$newExpirationDate = $now->add(new \DateInterval($interval));
		}
		return $newExpirationDate;
	}
	public static function updatePasswordExpiration($userId,$password=false,$orgId=null,$saveToDb=true,$me=null){
		GLOBAL $SECURITY;


		if(!$orgId){
			if(!$me){
				$me = self::byId(Utility::getInstance()->reader,$userId);
				$orgId=$me->user->getOrgId();
			}
		}
		$orgDetails = OrganizationController::_get($orgId,false);
		if(!$orgDetails['enable_password_expiration']){
			return null;
		}
		$salt = Utility::generateSalt(44);
		$password = $password?$password:'$temp$'.Utility::generatePassword(8);
		$md5_password = md5($SECURITY->salt . $salt . $password);

		$newExpirationDate = self::getNewExpirationDate($orgDetails,new \DateTime());


		if($saveToDb){
			Utility::getInstance()->reader->update('users',
				array(
					'password_set_on'=>date('Y-m-d'),
					'password_expires_on'=>date('Y-m-d',$newExpirationDate->getTimestamp()),
					'password'=>$md5_password,
					'salt_for_password'=>$salt
				),
				array(
					'id'=>$userId
				)
			);
		}
		return date('Y-m-d',$newExpirationDate->getTimestamp());

	}
	public static function _getUsers($params,$role){
		$util = new Utility();
		$deptId = @$params['deptId'];
		$orgId = @$params['orgId'];
		$classId = @$params['classId'];

		$queryParams = array();
		$where = ' WHERE 1 ';
		switch($role){
			case 'edit_teacher':
				$where .=  ' and uc.is_edit_teacher=1';
				break;
			case 'teacher':
				$where .=  ' and uc.is_teacher=1';
				break;
			case 'student':
				$where .=  ' and uc.is_student=1';
				break;
			case 'observer':
				$where .=  ' and uc.is_observer=1';
				break;
			default:

		}
		if($params['term']){
			$term = $params['term'];
			$where .=  " and (concat(users.fname,' ',users.lname,' ',users.email) like '%{$term}%')";
		}
		$query = self::$queryGetUsers;

		$whereOrgId = ' and d.organizationid = :orgId ';
		$whereDeptId = ' and d.id = :deptId ';
		$whereClassId = ' and uc.classid = :classId ';

		if($orgId){
			$where .= $whereOrgId;
			$queryParams['orgId']=$orgId;
		}
		if($deptId){
			$where .= $whereDeptId;
			$queryParams['deptId']=$deptId;
		}
		if($classId){

			$where .= $whereClassId;
			$queryParams['classId']=$classId;
		}

		if($util->checkAdmin(null,false,false)){
			$query.=$where;
			$data = $util->fetch($query,$queryParams);
		}
		else{
			$me = $util->me;
			$myOrg = $orgId?$orgId:$me->user->getOrgId();
			if($me->amIOrgAdmin($myOrg)){

				$queryParams['orgId']=$myOrg;
				$query.=$where;
				$query .= ' and d.organizationid = :orgId';
				$data = $util->fetch($query,$queryParams);
			}
			else{
				$join = ' JOIN user_classes myclasses on myclasses.userid=:userId and uc.classid=myclasses.classid' ;

				$queryParams['userId']=$me->user->getUserId();
				$query .= $join.$where;
				$data = $util->fetch($query,$queryParams);
			}

		}
		$users = array();
		foreach($data as $row){
			$users[]=self::_wrapUserObject($row);
		}
		return $users;

	}
	public function isStudent($classId = null, $orAdmin = true,$orgId=null) {
		if($orAdmin && ($this->isSuperAdmin || $this->amIOrgAdmin($orgId)) ) {
			return true;
		}
		foreach ($this->classes as $class) {
			if($class['isStudent']) {
				if($classId) {
					if($class['id'] == intval($classId)) {
						return true;
					}
				} else {
					return true;
				}
			}
		}
		return false;
	}
	public function isTeacher($classId = null, $orAdmin = true,$orgId=null) {
		if($orAdmin && ($this->isSuperAdmin || $this->amIOrgAdmin($orgId)) ) {
			return true;
		}
		foreach ($this->classes as $class) {
			if($class['isTeacher']) {
				if($classId) {
					if($class['id'] == intval($classId)) {
						return true;
					}
				} else {
					return true;
				}
			}
		}
		return false;
	}
	public function isEditTeacher($classId = null, $orAdmin = true,$orgId=null) {
		if($orAdmin && ($this->isSuperAdmin || $this->amIOrgAdmin($orgId)) ) {
			return true;
		}
		foreach ($this->classes as $class) {
			if($class['isEditTeacher']) {
				if($classId) {
					if($class['id'] == intval($classId)) {
						return true;
					}
				} else {
					return true;
				}
			}
		}
		return false;
	}

	private function prepareAndFetch($query, $paramsArray) {
		$preparedStatement = $this->reader->prepare($query);
		$preparedStatement->execute($paramsArray);
		return $preparedStatement->fetchAll();
	}
	public function updateUser(Request $request,$id){
		$this->meOrAdmin($id);
		$userInfo = $this->prepareAndFetch($this->queryInitUser,['userId'=>$id]);
		if(!$userInfo){
			throw new HttpException(400, "User does not exist");
		}
		$userInfo=$userInfo[0];

		$accepted=array(
			"fname",
			"lname",
			"phone",
			"email",
			"password",
			"expiration_date",
			'city',
			'address',
			'state',
			'country'
		);

		$body = json_decode($request->getContent());
		$update = array();
		foreach($body as $key=>$value){
			if(gettype(array_search($key,$accepted))!='boolean'){
				if($key=='password'){
					global $SECURITY;
					if($value==''){
						continue;
					}

					$value = md5($SECURITY->salt . $userInfo['salt_for_password'] . $value);
					$expirationDate = self::updatePasswordExpiration($id,false,null,false);
					if($expirationDate){
						$update['password_expires_on']=$expirationDate;
					}
					$update['password_set_on']=date('Y-m-d');
				}
				$update[$key]=$value;
			}
		}

		$this->reader->update('users',$update,['id'=>$id]);
		return new JsonResponse(['status'=>'success']);
	}
	private function meOrAdmin($id){
		if (isset($_SESSION['USER']) && isset($_SESSION['USER']['ID'])) {
			$userId = $_SESSION['USER']['ID'];
			if($id!=$userId){
				$this->checkAdmin();
			}
		}
		else{
			throw new HttpException(403, "Not logged in");
		}
	}
	private function checkAdmin(){
		$id = $this->reader->fetchAssoc("SELECT id from user_admin_super WHERE user_id = :user_id",['user_id'=>$this->userId]);
		if(!$id){
			throw new HttpException(400, "Must be a super admin");
		}
	}
	public static function _finalizeGrade($userId, $classId, $grade = 0, $comments = null) {
		$util = Utility::getInstance();
		Utility::getInstance()->insert(self::$queryInsertFinalGradeLog,
			array(
				'userId' => $userId,
				'classId' => $classId,
				'grade' => ClassesController::_getGradeAsLetter($classId,$grade),
				'teacherId' => $_SESSION['USER']['ID']
			)
		);
		$resp = $util->execute(
			self::$queryFinalizeGrade,
			array(
				'userId' => $userId,
				'classId' => $classId,
				'grade' => $grade,
				'comments' => $comments,
				'byUserId' => $_SESSION['USER']['ID']
			)
		);

		GradebookController::_recalculate($userId,null,$classId);
		return $resp;
	}
	public static function _getGuardians($studentId){
		$util = new Utility();
		$data = $util->fetch(self::$queryGetUserGuardians,['userId'=>$studentId]);
		$guardians = array();
		foreach ($data as $row) {
			$guardians[]=array(
				'id'=>$row['userid'],
				'fname'=>$row['fname'],
				'lname'=>$row['lname'],
				'email'=>$row['email']
			);
		}
		return $guardians;
	}
	public static function _wrapUserObject($row){
		return [
			'firstName'=>$row['fname'],
			'lastName'=>$row['lname'],
			'email'=>$row['email'],
			'attendanceWithdrawDate'=>@$row['attendance_withdraw_date'],
			'id'=>$row['id']
		];
	}
	public static function _getAdvisors($studentId){
		$util = new Utility();
		return $util->fetch(self::$queryGetAdvisors,['studentId'=>$studentId]);
	}
	public static function _createUser($params){
		GLOBAL $SECURITY;
		//password is required in this method
		//needs to implement the random password + email message
		$util = new Utility();


		$required = array(
			'organizationid',
			'fname',
			'lname',
			'password',
			'email',
			'preferred_language'
		);
		$util->checkRequiredFields($required,$params);

		if($util->fetchRow(
			'SELECT *
			FROM users
			WHERE email = :email',
			['email'=>$params['email']]
		)){
			return 0;
		}

		$preferred_language = $params['preferred_language'];
		unset($params['preferred_language']);

		$salt = Utility::generateSalt(44);
		$md5_password = md5($SECURITY->salt . $salt . $params['password']);

		$params['password']=$md5_password;
		$params['salt_for_password']=$salt;
		$params['created_by']=$_SESSION['USER']['ID'];
		$params['password_set_on']=date('Y-m-d');
		$expirationDate = self::updatePasswordExpiration(null,'',$params['organizationid'],false);
		if($expirationDate){
			$params['password_expires_on']=$expirationDate;
		}
		$util->reader->insert(
			'users',
			$params
		);
		$id = $util->reader->lastInsertId();

		$util->insert(
			self::$queryCreateDefaultUserPreferences,
			array(
				'userId'=>$id,
				'value'=>$preferred_language
			)
		);
		return $id;
	}
	public function hasOnlyProficiencyClasses(){
		if(Utility::getInstance()->checkAdmin(null,true,false)) return false;

		$userId = $_SESSION['USER']['ID'];
		$hasNotOnlyNoMenuCourses = boolval(Utility::getInstance()->fetchOne($this->queryHasNotOnlyNoMenuCourses,['userId'=>$userId]));
		if(!$hasNotOnlyNoMenuCourses) {
			return true;
		}

		if(boolval(Utility::getInstance()->fetchOne($this->queryIsSchoolAdmin,['userId'=>$userId]))){
			return true;
		}
		return false;
	}
	public function profileSettings($data){
	    //move to it's own class
        $availableSettings = [];
        if($this->isJ1Admin()){
            $availableSettings['disable_j1_graded_email']=true;
        }
        if($this->isE3PTAdmin()){
            $availableSettings['disable_e3pt_graded_email']=true;
        }
        if($this->isJ1Teacher()){
            $availableSettings['disable_j1_submitted_email']=true;
        }
        if($data->is_teacher && OrganizationController::shouldSendNotifications($data->org['id'])){
            $availableSettings['disable_teacher_notifications_email']=true;
            $availableSettings['disable_student_post_notifications_email']=true;
        }
        if($data->is_student && OrganizationController::shouldSendNotifications($data->org['id'])){
            $availableSettings['disable_student_notifications_email']=true;
        }
        return $availableSettings;
    }
    private function isJ1Teacher(){
        $userId = $_SESSION['USER']['ID'];
        return boolval(Utility::getInstance()->fetchOne($this->queryIsJ1Teacher,['userId'=>$userId]));
    }
    private function isJ1Admin(){
        $userId = $_SESSION['USER']['ID'];
	    return boolval(Utility::getInstance()->fetchOne($this->queryIsJ1Admin,['userId'=>$userId]));
    }
    private function isE3PTAdmin(){
        $userId = $_SESSION['USER']['ID'];
	    return boolval(Utility::getInstance()->fetchOne($this->queryIsE3PTAdmin,['userId'=>$userId]));
    }


	/* QUERY: get user's data */
	public $queryInitUser = <<<SQL
		SELECT *
		FROM users
		WHERE id = :userId
SQL;

	/* QUERY: get user's data */
	public $queryInitUserByEmail = <<<SQL
		SELECT *
		FROM users
		WHERE email = :email
SQL;

	/* QUERY: user's classes */
	public $queryGetUserClasses = <<<SQL
		SELECT uc.*,
		c.name,c.is_active, c.courseid as courseId,c.show_grades,c.show_dates, c.hide_exempted_activities,c.show_table_of_contents,
		c.chat_mode_code,c.is_j1_class,
		g.name as groupName,g.id as groupId
		FROM user_classes uc
		INNER JOIN classes c ON uc.classid = c.id
		LEFT JOIN groups g on uc.groupid = g.id
		WHERE uc.userid = :userId;
SQL;
    public $queryGetUserClassesHistory = <<<SQL
		SELECT uc.*,1 as isWithdrawn,
		c.name,c.is_active, c.courseid as courseId,c.show_grades,c.show_dates, c.hide_exempted_activities,
		g.name as groupName,g.id as groupId
		FROM user_classes_history uc
		INNER JOIN classes c ON uc.classid = c.id
		LEFT JOIN groups g on uc.groupid = g.id
		WHERE uc.userid = :userId;
SQL;

    public $queryGetAllUserClasses = <<<SQL
		SELECT uc.*,
		c.name,c.is_active, c.courseid as courseId,c.show_grades,c.show_dates, c.hide_exempted_activities,
		g.name as groupName,g.id as groupId
		FROM (select * from (select id, userid, classid, is_student, is_teacher, is_edit_teacher, is_observer, is_suspended, created, groupid, finished_the_class, final_score, finalizedBy, finalizedOn, finalizedComments, recalculate_due_dates, recalculate_gradebook, course_duration, date_left, completion_email_sent, is_test_admin, manual_start_date, manual_end_date, manual_expected_end_date, manual_attendance_start_date ,0 as isWithdrawn from user_classes union select id, userid, classid, is_student, is_teacher, is_edit_teacher, is_observer, is_suspended, created, groupid, finished_the_class, final_score, finalizedBy, finalizedOn, finalizedComments, recalculate_due_dates, recalculate_gradebook, course_duration, date_left, completion_email_sent, is_test_admin, manual_start_date, manual_end_date, manual_expected_end_date, manual_attendance_start_date ,1 as isWithdrawn from 
		user_classes_history) a group by userid,classid) uc
		INNER JOIN classes c ON uc.classid = c.id
		LEFT JOIN groups g on uc.groupid = g.id
		WHERE uc.userid = :userId;
SQL;
	/* QUERY: user's classes */
	public $queryGetUserAttendanceOnlyClasses = <<<SQL
		SELECT uc.*,
		c.name
		FROM user_attendance_only_classes uc
		INNER JOIN attendance_only_classes c ON uc.classid = c.id
		WHERE uc.userid = :userId;
SQL;

	public $queryGetCalculatedUserScoreSlow = <<<SQL
		SELECT SUM(IF(NOT sov.score IS NULL, sov.score, IF(NOT qs.score IS NULL, qs.score, pg.grade))) AS score
		FROM user_classes uc
		INNER JOIN classes ON uc.classid = classes.id
		INNER JOIN courses AS c ON c.id = classes.courseid
		INNER JOIN units AS u ON u.courseid = c.id
		INNER JOIN (SELECT * FROM pages WHERE is_gradeable = true OR layout LIKE '%QUIZ%') p ON u.id = p.unitid
		LEFT JOIN quiz_scores qs ON p.id = qs.quiz_id AND qs.user_id = uc.userid
		LEFT JOIN scores_overrides sov ON p.id = sov.pageId AND uc.userid = sov.userId AND uc.classid = sov.classId
		LEFT JOIN (
			SELECT
				posts.id,
				posts.classid,
				posts.userid,
				posts.pageid,
				gp.grade AS grade
			FROM posts
			JOIN grade_posts gp ON gp.post_id = posts.id
			ORDER BY posts.created DESC) pg
		ON pg.classid = uc.classid
			AND pg.userid = uc.userid
			AND pg.pageid = p.id
		WHERE uc.userid = :userId AND uc.classid = :classId;
SQL;


	/*Golabs new improves sql*/
	public $queryGetCalculatedUserScore = <<<SQL
SELECT pg.grade + IF(NOT sov.score IS NULL, sov.score, IF(NOT qs.score IS NULL, qs.score, 0)) AS score
		FROM user_classes uc
		INNER JOIN classes ON uc.classid = classes.id
		INNER JOIN courses AS c ON c.id = classes.courseid
		INNER JOIN units AS u ON u.courseid = c.id
		INNER JOIN (SELECT  pages.* FROM pages,quiz_scores WHERE quiz_scores.user_id = :userId1 AND pages.id = quiz_scores.quiz_id AND (is_gradeable = true OR layout LIKE '%QUIZ%')) p ON u.id = p.unitid
		LEFT JOIN quiz_scores qs ON p.id = qs.quiz_id AND qs.user_id = uc.userid
		LEFT JOIN scores_overrides sov ON p.id = sov.pageId AND uc.userid = sov.userId AND uc.classid = sov.classId
		INNER JOIN (
select
posts.id,
posts.classid,
posts.userid,
posts.pageid,
grade_posts.grade,
0 AS nothing
from
posts,pages,grade_posts
where
posts.userid = :userId
AND
posts.classid = :classId
AND
posts.pageid = pages.id
AND
grade_posts.post_id = posts.id
Group by posts.id) pg
		     ON 0 = pg.nothing
		WHERE uc.userid = pg.userid AND uc.classid = pg.classid
SQL;

	/* QUERY: user's preferences */
	public $queryGetUserPreferences = <<<SQL
		SELECT *
		FROM user_preferences
		WHERE user_id = :userId
SQL;

	/* QUERY: user's privileges */
	public $queryGetUserPrivileges = <<<SQL
		SELECT *
		FROM user_admin_organizations
		WHERE userid = :userId
SQL;

	/* QUERY: user's superadmin privileges */
	public $queryGetUserSuperAdminPrivileges = <<<SQL
		SELECT *
		FROM user_admin_super
		WHERE user_id = :userId
SQL;

	/* QUERY: user's children */
	public $queryGetUserChildren = <<<SQL
		SELECT DISTINCT ug.userchildid, users.*
		FROM user_guardians ug
		JOIN users ON ug.userchildid = users.id
		WHERE userid = :userId
SQL;


	/* QUERY: user's guardians */
	public static $queryGetUserGuardians = <<<SQL
		SELECT distinct *
		FROM user_guardians
		JOIN users on users.id = user_guardians.userid
		WHERE userchildid = :userId group by userid,userchildid
SQL;

	/* QUERY: user's guardians */
	protected static $queryFinalizeGrade = <<<SQL
		UPDATE user_classes
		SET finished_the_class = 1, final_score = :grade, finalizedBy = :byUserId, finalizedOn = CURRENT_TIMESTAMP , finalizedComments = :comments
		WHERE userid = :userId AND classid = :classId
SQL;
	protected static $queryInsertFinalGradeLog = <<<SQL
		INSERT INTO final_grades (orgid,userid, external_userid, classid, sectionid, teacherid, external_teacherid,grade)
		select u.organizationid,u.id,u.external_id,c.id,null,t.id,t.external_id,:grade from
		users u
		join users t on 1=1
		join classes c on 1=1
		where u.id = :userId and t.id = :teacherId and c.id = :classId;
SQL;
	/* QUERY: all users. Where clause should be appended */
	protected static $queryGetUsers = <<<SQL
		SELECT DISTINCT users.*
		FROM users
		JOIN departments d ON d.organizationid = users.organizationid
		LEFT JOIN user_classes uc ON users.id = uc.userid

SQL;
	protected static $queryGetAdvisors = <<<SQL
		SELECT  u.fname,
				u.lname,
				u.email,
				u.id
		FROM user_advisors ua
		JOIN users u on u.id = ua.userid
		WHERE studentid = :studentId
SQL;
	public static $queryIsAdvisor = <<<SQL
		SELECT  * FROM user_advisors ua WHERE userid=:userId
SQL;
	public static $queryIsGuardian = <<<SQL
		SELECT  * FROM user_guardians
		 join users on user_guardians.userchildid = users.id
		  WHERE userid=:userId
SQL;
	protected static $queryCreateDefaultUserPreferences = <<<SQL
		INSERT INTO user_preferences (user_id, preference, value)
		VALUES (:userId, 'language', :value)
		ON DUPLICATE KEY UPDATE value = value;
SQL;
	private static $queryGetUserMetaData = <<<SQL
		SELECT meta_key,meta_value
		FROM user_meta
		WHERE userid = :userId
SQL;
	private static $queryGetUserMetaKey = <<<SQL
		SELECT meta_value
		FROM user_meta
		WHERE userid = :userId and meta_key= :metaKey
SQL;
	private static $queryInsertUserMeta = <<<SQL
		INSERT INTO user_meta (userid, meta_key, meta_value) values (:userid,:meta_key,:meta_value)
		ON DUPLICATE KEY UPDATE meta_value = values(meta_value)
SQL;
	private static $queryGetStudents = <<<SQL
	SELECT u.id,
	u.lname,
	u.fname,
	u.email
	FROM user_classes uc
	join user_classes sc on uc.classid = sc.classid
	join users u on u.id = sc.userid
	where uc.is_teacher = 1 and uc.userid = :userId and sc.is_student =1
SQL;
	public $queryHasNotOnlyNoMenuCourses = <<<SQL
	SELECT uc.id FROM user_classes uc
  	left JOIN proficiency_classes pc ON pc.classid = uc.classid
	WHERE uc.userid = :userId and pc.id is null
	limit 1
SQL;
	public $queryIsSchoolAdmin = <<<SQL
	SELECT id from proficiency_schools_admins where userid = :userId limit 1
SQL;
    private $queryIsJ1Admin = <<<SQL
    SELECT uc.id FROM user_classes uc
      join classes c on c.id = uc.classid
      where uc.is_test_admin = 1 and c.is_j1_class = 1 and uc.userid = :userId
    union
    select ua.id from user_admin_organizations ua
      join departments d on ua.organizationid = d.organizationid
      join courses co on co.departmentid = d.id
      join classes c on co.id = c.courseid
      where ua.userid = :userId and c.is_j1_class = 1 limit 1
SQL;
    private $queryIsE3PTAdmin = <<<SQL
    SELECT uc.id FROM user_classes uc
      join classes c on c.id = uc.classid
      where uc.is_test_admin = 1 and c.is_j1_class != 1 and uc.userid = :userId
    union
    select ua.id from user_admin_organizations ua
      join departments d on ua.organizationid = d.organizationid
      join courses co on co.departmentid = d.id
      join classes c on co.id = c.courseid
      where ua.userid = :userId and c.is_j1_class != 1
    union
    SELECT a.userid FROM proficiency_schools_admins a where a.userid = :userId limit 1
SQL;
    private $queryIsJ1Teacher = <<<SQL
    SELECT uc.id FROM user_classes uc
    join classes c on c.id = uc.classid
    where uc.is_teacher = 1 and c.is_j1_class = 1 and uc.userid = :userId  limit 1
SQL;


}
class UserAdviseeFilter{
    private $userId;
    private $query;
    private $whereFilter1 = '';
    private $whereFilter2 = '';
    private $joinFilter1 = '';
    private $joinFilter2 = '';
    public function __construct($userId){
        $this->userId = $userId;
    }
    public function filter(){
        $this->query = $this->queryGetUserAdvisees;
        $this->filterSiteIfNecessary();
        $this->filterClassIfNecessary();
        $this->filterTeacherIfNecessary();
        return $data = Utility::getInstance()->fetch (
            $this->replaceWhereAndJoinFilters(),
            array(':userId' => $this->userId)
        );
    }
    private function filterSiteIfNecessary(){
        if($id = @$_REQUEST['siteId']){
            $this->whereFilter1 = $this->whereFilter2 = ' and s.id = '.$id;
        }
    }
    private function filterClassIfNecessary(){
        if($id = @$_REQUEST['classId']){
            $this->joinFilter1 = $this->joinFilter2 = ' join user_classes uc on uc.userid = users.id';
            $this->whereFilter1 = $this->whereFilter2 = " and uc.classid = $id and uc.is_student = 1";
        }
    }
    private function filterTeacherIfNecessary(){
        if($id = @$_REQUEST['teacherId']){
            if( !@$_REQUEST['classId']){
                $this->joinFilter1 = $this->joinFilter2 = ' join user_classes uc on uc.userid = users.id';
            }
            $this->joinFilter1 .=  ' join user_classes tc on tc.classid = uc.classid';
            $this->joinFilter2 .= ' join user_classes tc on tc.classid = uc.classid';
            $this->whereFilter1 = $this->whereFilter2 = "  and uc.is_student = 1 and tc.userid = $id and tc.is_teacher = 1";
        }
    }
    private function replaceWhereAndJoinFilters(){
        $query  = str_replace('__filter_where1__',$this->whereFilter1,$this->query);
        $query  = str_replace('__filter_where2__',$this->whereFilter2,$query);
        $query  = str_replace('__filter_join1__',$this->joinFilter1,$query);
        $query  = str_replace('__filter_join2__',$this->joinFilter2,$query);
        return $query;
    }
    /* QUERY: user's advisses */
    public $queryGetUserAdvisees = <<<SQL
		select * from ( SELECT users.*,s.name as siteName
		FROM user_advisors
		JOIN users on user_advisors.studentid = users.id
		LEFT JOIN site_users su on su.user_id = users.id
		LEFT JOIN sites s on s.id = su.site_id
		__filter_join1__
		WHERE user_advisors.userid = :userId __filter_where1__
		GROUP BY users.id
		UNION SELECT users.*,s.name as siteName
		 FROM user_admin_sites us
		 JOIN sites s on s.id = us.siteid
		 JOIN site_users su on su.site_id = s.id
		 JOIN users ON users.id = su.user_id
		 __filter_join1__
		WHERE us.userid = :userId __filter_where2__) users
		group by users.id
SQL;


}
?>