<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class SiteController {

	public function __construct(Connection $reader) {
		$this->reader = $reader;
		$this->me = UserController::me($reader);
		$this->util = new Utility($reader);
	}

	public function get(Request $request, $siteId) {
		$this->util->checkAdmin();
		$site = self::_get($this->reader, $siteId);
		if($site) {
			return new JsonResponse($site);
		} else {
			return Utility::buildHTTPError('Site not found. Id used: ' . $site, 400);
		}
	}

	public function getOrgSites(Request $request, $orgId) {
		$this->util->checkAdmin($orgId);
		$filter = new SiteFilter();
		$sites = $filter->getOrgSites( $orgId,$request->query->all());
		return new JsonResponse($sites);
	}

	public function create(Request $request, $orgId) {
		$this->util->checkAdmin($orgId);
		$this->util->clearPOSTParams($request);
		$name = $request->request->get('name');
		$extId = $request->request->get('externalId');
		if(!$name) {
			return Utility::buildHTTPError('Missing param "name"', 400);
		}
		return new JsonResponse(self::_create($this->reader, $orgId, $name, $extId));
	}

	public function update(Request $request, $orgId) {
		$this->util->checkAdmin($orgId);
		$this->util->clearPOSTParams($request);
		$site = $request->request->get('site');
		if(!$site) {
			return Utility::buildHTTPError('Missing json object param "site"', 400);
		}
		$currentSite = self::_get($this->reader, $site['id']);
		if(!$currentSite) {
			return Utility::buildHTTPError('Wrong id. Site does not exist', 400);
		}
		return new JsonResponse(
			self::_update(
				$this->reader,
				$site['id'],
				($site['name'])? $site['name'] : $currentSite['name'],
				$site['externalId'],
				$site['users']
			)
		);
	}
	public function updateBlackoutDates(Request $request, $id) {
		$util = new Utility();
		$orgId = $util->fetchOne(self::$queryGetOrgFromSiteId,['siteId'=>$id]);
		$util->checkAdmin($orgId);

		$body = json_decode($request->getContent(),true);

		$required = ['blackouts'];
		$util->checkRequiredFields($required,$body);
		$blackouts = json_encode($body['blackouts']);
		$use_default_calendar = boolval($body['use_default_calendar']);
		$util->reader->update('sites',['blackouts'=>$blackouts,'use_default_calendar'=>$use_default_calendar],['id'=>$id]);

		return new JsonResponse(self::_get($this->reader,$id));
	}

	public static function _get(Connection $reader, $siteId) {
		$util = new Utility($reader);
		$site = $util->fetchRow(
			self::$queryGetSite,
			array('siteId' => $siteId)
		);
		if($site) {
			return self::build($reader, $site);
		} else {
			return null;
		}
	}



	public static function _create(Connection $reader, $orgId, $name, $externalId = null) {
		$util = new Utility($reader);
		$defaultBlackout = $util->fetchOne(OrganizationController::$queryGetOrg,['orgId'=>$orgId],'blackouts');
		$id = $util->insert(
			self::$queryInsert,
			array(
				'orgId' => $orgId,
				'name' => $name,
				'externalId' => $externalId,
				'blackouts'=>$defaultBlackout
			)
		);
		return self::_get($reader, $id);
	}

	public static function _update(Connection $reader, $id, $name, $externalId, $users) {
		$util = new Utility($reader);
		$util->execute(
			self::$queryUpdate,
			array(
				'name' => $name,
				'externalId' => $externalId,
				'id' => $id
			)
		);
		$currentUsersIds = $util->fetch(
            self::$queryGetSiteUsers,
			array('siteId' => $id)
		);
		$currentIds = array();
		$newIds = array();
		foreach ($currentUsersIds as $row) {
			$currentIds[] = $row['id'];
		}
		foreach ($users as $user) {
			$newIds[] = $user['id'];
			$util->insert(
				self::$queryAssignUser,
				array(
					'siteId' => $id,
					'userId' => $user['id']
				)
			);
		}
		foreach ($currentIds as $userId) {
			if(!in_array($userId, $newIds)) {
				$util->execute(
					self::$queryRemoveUser,
					array(
						'siteId' => $id,
						'userId' => $userId
					)
				);
			}
		}
		return self::_get($reader, $id);
	}
	public static function _getUserSite($userId){
		$util = new Utility();
		return $util->fetchOne(self::$queryGetUserSite,['userId'=>$userId]);
	}
	public static function _getSiteForUser($userId){
		return Utility::getInstance()->fetchOne(self::$queryGetSiteForUser,['userId'=>$userId]);
	}
	public static function build(Connection $reader, $site,$params=[]) {
		$users = SiteUserFilter::getSiteUsers($site,false,$params);
		$users = $users?:[];
		$admins = SiteUserFilter::getSiteUsers($site,true,$params);
		return array(
			'id' => intval($site['id']),
			'name' => $site['name'],
			'externalId' => $site['externalId'],
			'orgId' => intval($site['orgId']),
			'count' => intval($site['count']),
			'blackouts' => json_decode($site['blackouts']),
			'use_default_calendar' => boolval($site['use_default_calendar']),
			'users' => $users,
			'admins' => $admins,
		);
	}


	public static $queryGetSite = <<<SQL
		SELECT * FROM sites WHERE id = :siteId
SQL;
	public static $queryGetSiteByName = <<<SQL
		SELECT * FROM sites WHERE name = :name
SQL;


	protected static $queryInsert = <<<SQL
		INSERT INTO sites(orgId, name, externalId,blackouts)
		VALUES (:orgId, :name, :externalId,:blackouts)
SQL;

	protected static $queryUpdate = <<<SQL
		UPDATE sites
		SET name = :name, externalId = :externalId
		WHERE id = :id;
SQL;

	protected static $queryRemoveUser = <<<SQL
		DELETE FROM site_users
		WHERE site_id = :siteId AND user_id = :userId;
SQL;

	public static $queryAssignUser = <<<SQL
		INSERT INTO site_users(site_id, user_id)
		VALUES (:siteId, :userId)
		ON DUPLICATE KEY UPDATE site_id = :siteId
SQL;
	protected static $queryGetUserSite = <<<SQL
		SELECT site_id FROM site_users
		 JOIN sites on sites.id = site_users.site_id
		 WHERE user_id=:userId
SQL;
	protected static $queryGetSiteForUser = <<<SQL
		SELECT sites.name FROM site_users
		 JOIN sites on sites.id = site_users.site_id
		 WHERE user_id=:userId
SQL;


	protected static $queryGetOrgFromSiteId = <<<SQL
		SELECT orgId from sites where id=:siteId
SQL;
    protected static $queryGetSiteUsers = <<<SQL
		SELECT DISTINCT users.*, count(uc.classid) as classesCount
		FROM users
		LEFT JOIN user_classes uc on uc.userid = users.id 
		WHERE users.id IN (
			SELECT user_id
			FROM site_users
			WHERE site_id = :siteId
		) and users.is_active = 1 group by users.id
SQL;

}
class SiteFilter{
    private $query;
    private $queryParams;
    private $filter_join = '';
    private $filter_where = '';
    public function getOrgSites($orgId,$params=[]) {
        $util = Utility::getInstance();
        $this->selectQuery($orgId);
        $this->filterClassIfNecessary($params);
        $this->filterStudentIfNecessary($params);
        $this->filterTeacherIfNecessary($params);
        $sites = $this->runQuery();
        if($sites) {
            $result = array();
            foreach ($sites as $site) {
                $result[] = SiteController::build($util->reader, $site,$params);
            }
            return $result;
        } else {
            return [];
        }
    }
    private function selectQuery($orgId){
        if(Utility::getInstance()->checkAdmin($orgId,true,false)){
            $this->query = self::$queryGetOrgSites;
            $this->queryParams = array('orgId' => $orgId);

        }else{
            $this->query = self::$queryGetOrgSitesForSiteAdmin;
            $this->queryParams = array('userId' => $_SESSION['USER']['ID']);
        }
    }
    private function filterClassIfNecessary($params){
        if($classId = @$params['classId']){
            $this->filter_join .= ' join user_classes uc on su.user_id = uc.userid and uc.is_student=1';
            $this->filter_where .= " and uc.classid = $classId";
        }
    }
    private function filterTeacherIfNecessary($params){
        if($id = @$params['teacherId']){
            if(!@$params['classId'] && !@$params['studentId']){
                $this->filter_join .= ' join user_classes uc on su.user_id = uc.userid and uc.is_student=1';
            }
            $this->filter_join .= ' join user_classes tc on tc.classid = uc.classid';
            $this->filter_where .= " and tc.userid = $id";
        }
    }
    private function filterStudentIfNecessary($params){
        if($id = @$params['studentId']){
            if(!@$params['classId']){
                $this->filter_join .= ' join user_classes uc on su.user_id = uc.userid and uc.is_student=1';
            }

            $this->filter_where .= " and uc.userid = $id";
        }
    }
    private function runQuery(){
        $util = Utility::getInstance();
        $query = str_replace('__filter_join__',$this->filter_join,$this->query);
        $query = str_replace('__filter_where__',$this->filter_where,$query);
        return $util->fetch($query,$this->queryParams);
    }
    protected static $queryGetOrgSites = <<<SQL
		SELECT s.*,count(distinct su.user_id) as count FROM sites s
		 LEFT JOIN site_users su on s.id = su.site_id
		 __filter_join__
		WHERE s.orgId = :orgId __filter_where__ group by s.id
SQL;
    protected static $queryGetOrgSitesForSiteAdmin = <<<SQL
		SELECT s.*,count(distinct su.user_id) FROM user_admin_sites us
		 JOIN sites s on s.id = us.siteid
		 LEFT JOIN site_users su on s.id = su.site_id
		 __filter_join__
		 WHERE us.userid = :userId __filter_where__ group by s.id
SQL;

}
class SiteUserFilter{
    private static $query;
    private static $queryParams;
    private static $filter_join = '';
    private static $filter_where = '';
    public static function getSiteUsers($site,$onlyAdmins=false,$params=array()){
        self::restart();
        self::selectQuery($site,$onlyAdmins);
        self::filterClassIfNecessary($params);
        self::filterTeacherIfNecessary($params);
        self::filterStudentIfNecessary($params);
        $usersData = self::runQuery();
        return self::prepareUsers($usersData);

    }
    private static function restart(){
        self::$query = '';
        self::$queryParams = [];
        self::$filter_join = '';
        self::$filter_where = '';
    }
    private static function selectQuery($site,$onlyAdmins){
        self::$query = $onlyAdmins?self::$queryGetSiteAdmins:self::$queryGetSiteUsers;
        self::$queryParams = array('siteId' => $site['id']);
    }
    private static function filterClassIfNecessary($params){
        if($id = @$params['classId']){
            self::$filter_where .= " and uc.classid = $id and uc.is_student = 1";
        }
    }
    private static function filterTeacherIfNecessary($params){
        if($id = @$params['teacherId']){
            self::$filter_join .= " join user_classes tc on tc.classid = uc.classid";
            self::$filter_where .=  " and tc.userid = $id and tc.is_teacher = 1";
        }
    }
    private static function filterStudentIfNecessary($params){
        if($id = @$params['studentId']){
            self::$filter_where .=  " and uc.userid = $id ";
        }
    }
    private static function runQuery(){
        $util = Utility::getInstance();
        $query = str_replace('__filter_join__',self::$filter_join,self::$query);
        $query = str_replace('__filter_where__',self::$filter_where,$query);
        return $util->fetch($query,self::$queryParams);
    }
    private static function prepareUsers($usersData){
        foreach ($usersData as $user) {
            if($shouldFilterOnlyTrackAttendance =boolval($_REQUEST['trackAttendance'])){
                if(!boolval($user['track_attendance'])){
                    continue;
                }

            }
            $users[] = array(
                'id' => intval($user['id']),
                'firstName' => $user['fname'],
                'lastName' => $user['lname'],
                'externalId'=>$user['external_id'],
                'email' => $user['email'],
                'classesCount' => $user['classesCount'],
                'attendanceWithdrawDate' => ($user['attendance_withdraw_date'] && strtotime($user['attendance_withdraw_date'])>strtotime('2000-01-01') && strtotime($user['attendance_withdraw_date']) < time())?$user['attendance_withdraw_date']:null
            );
        }
        return $users;
    }
    public static $queryGetSiteUsers = <<<SQL
		SELECT DISTINCT users.*, count(uc.classid) as classesCount
		FROM users
		JOIN site_users su on su.user_id = users.id 
		LEFT JOIN user_classes uc on uc.userid = users.id
		 __filter_join__
		WHERE 1 __filter_where__ and  su.site_id=:siteId  and users.is_active = 1 group by users.id
SQL;
    protected static $queryGetSiteAdmins = <<<SQL
		SELECT DISTINCT users.*
		FROM user_admin_sites us
		JOIN  users ON us.userid = users.id
		LEFT JOIN user_classes uc on uc.userid = users.id
		__filter_join__
		WHERE 1 __filter_where__ and us.siteid = :siteId group by users.id
SQL;
}