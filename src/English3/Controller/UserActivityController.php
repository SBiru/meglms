<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;

use English3\Model\User;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UserActivityController{

	private $reader;

	public function __construct(Connection $reader) {
		$this->reader = $reader;
	}

	public function get(Request $request,$id){
		if($id=='me'){
			$id=$_SESSION['USER']['ID'];
		}
		$min_date = null;
		$type='period';
		$max_date = null;
		if($request->query->has('period')){
			$min_date=	$request->query->get('period');
		}
		if($request->query->has('minDate')){
			$min_date=	$request->query->get('minDate');
			$type='range';
		}
		if($request->query->has('maxDate')){
			$max_date=	$request->query->get('maxDate');
		}
		return new JsonResponse(self::_get($this->reader,$id,$min_date,$type,$max_date));
	}
	public function getAllHistoryForClass(Request $request,$id){
		if($id=='me'){
			$id=$_SESSION['USER']['ID'];
		}
		require_once __DIR__.'/../../../controllers/history.php';
		$input= new \stdClass();
		$input->user_id=$id;
		if($request->query->has('class_id')){
			$input->class_id=$request->query->get('class_id');
		}
		$input->includeWithdrawn = boolval($request->get('includeWithdrawn'));
		$data = classHistoryForUser($input,false);
		$data->blackoutDates  = $this->getStudentSchoolBlackoutDates($id);
		return new JsonResponse($data);

	}
	private function getStudentSchoolBlackoutDates($userId){
		$siteId = SiteController::_getUserSite($userId);
		if(is_null($siteId)){
			$userInstance = new UserController(Utility::getInstance()->reader);
			$orgId = Utility::getInstance()->fetchOne($userInstance->queryInitUser,['userId'=>$userId],'organizationid');
			$blackoutDates = Utility::getInstance()->fetchOne(OrganizationController::$queryGetOrg,['orgId'=>$orgId],'blackouts');
		}
		else{
			$blackoutDates = Utility::getInstance()->fetchOne(SiteController::$queryGetSite,['siteId'=>$siteId],'blackouts');
		}
		$blackoutDates = json_decode($blackoutDates,true);
		return $blackoutDates;
	}

	public function getTotalTimeSpent(Request $request,$id){
		if($id=='me'){
			$id=$_SESSION['USER']['ID'];
		}
		$util = new Utility();
		$util->calcLoggedIn();
		$classes = array();
		foreach($util->me->classes as $class){
			$classes[]=array(
				'id'=>$class['id'],
				'timeSpent'=>self::_getClassTotalTimeSpent($id,$class['id'])
			);
		}
		return new JsonResponse($classes);
	}
	public static function _getClassTotalTimeSpent($userId,$classId){
		if(!$userId){
			return null;
		}
		$util = new Utility();
		return intval($util->fetchOne(self::$queryGetClassTotalTime,['classId'=>$classId,'userId'=>$userId]));
	}
	public static function _get(Connection $reader,$userId,$min_date,$type='period',$max_date=null){
		if(!$userId){
			return null;
		}
		$util = new Utility($reader);
		if(is_null($min_date)){
			$min_date=0;
		}
		else{
			if($type=='period'){
				$min_date=(new \DateTime())->sub(new \DateInterval('P'.$min_date))->format('Y-m-d');
			}
			else{
				$min_date=(new \DateTime($min_date))->format('Y-m-d');
			}
		}
		if(is_null($max_date)){
			$max_date=(new \DateTime())->add(new \DateInterval('P1D'))->format('Y-m-d');
		}
		else{
			$max_date=(new \DateTime($max_date))->add(new \DateInterval('P1D'))->format('Y-m-d');
		}

		$rawData = $util->fetch(self::$queryGetActivityHistory, array(
			'userId' => $userId,
			'minDate'=>$min_date,
			'maxDate'=>$max_date,
            'includeInactive'=>intval($_REQUEST['includeInactive'])
		));
		if(!$rawData){
			return null;
		}
		$classes = array();
		$totalTime = 0;

		foreach($rawData as $row){
			$duration = self::getDuration($row['time_in'],$row['time_out'],$row['orgTimeout']);

			if(!isset($classes[$row['classId']])){
				$classes[$row['classId']]=array(
					'id'=>$row['classId'],
					'name'=>$row['className'],
					'totalTime'=>0,
					'units'=>array(),
					'dates'=>array()
				);
			}
			$date = substr($row['time_in'],0,10);
			$units = &$classes[$row['classId']]['units'];
			$dates = &$classes[$row['classId']]['dates'];

			if(!isset($dates[$date])){
				$dates[$date]=array(
					'date'=>$date,
					'totalTime'=>0
				);
			}
			$dates[$date]['totalTime']+=$duration;

			if(!isset($units[$row['unitId']])){
				$units[$row['unitId']] = array(
					'id'=>$row['unitId'],
					'name'=>$row['unitName'],
					'position'=>$row['unitId'],
					'totalTime'=>0,
					'pages'=>array()
				);
			}
			$pages = &$units[$row['unitId']]['pages'];

			if(intval($row['pageGroupId'])){
				if(!isset($pages[$row['pageGroupId']])){
					$pages[$row['pageGroupId']]=array(
						'id'=>$row['pageGroupId'],
						'name'=>$row['pageGroupName'],
						'position'=>$row['pageGroupPosition'],
						'totalTime'=>0,
						'pages'=>array(),
					);


				}
				$pages[$row['pageGroupId']]['totalTime']+=$duration;
				$pages = &$pages[$row['pageGroupId']]['pages'];
			}

			if(!isset($pages[$row['pageId']])){
				$pages[$row['pageId']]=array(
					'id'=>$row['pageId'],
					'name'=>$row['pageName'],
					'position'=>$row['pagePosition'],
					'totalTime'=>0,
					'history'=>array()
				);
			}

			$history = &$pages[$row['pageId']]['history'];
			$history[]= array(
				'timeIn'=>$row['time_in'],
				'duration'=>$duration
			);
			$pages[$row['pageId']]['totalTime']+=$duration;
			$units[$row['unitId']]['totalTime']+=$duration;
			$classes[$row['classId']]['totalTime']+=$duration;
			$totalTime+=$duration;
		}
		foreach($classes as &$class){
			$units = &$class['units'];
			foreach($units as &$unit){
				$pages = &$unit['pages'];
				foreach($pages as &$page){
					if(isset($page['pages'])){
						$page['pages']=array_values($page['pages']);
					}
				}
				$pages = array_values($pages);
			}
			$units=array_values($units);

		}

		return ['totalTime'=>$totalTime,'classes'=>array_values($classes)];


	}
	public static function _hasAccessedClass($userId,$classId){
		return boolval(Utility::getInstance()->fetchOne(self::$queryGetClassLastPageAccessed,['userId'=>$userId,'classId'=>$classId]));
	}
	public static function _getClassLastWork($userId,$classId){
		$util = Utility::getInstance( );
		$lastPageAccessed = $util->fetchOne(self::$queryGetClassLastPageAccessed,['userId'=>$userId,'classId'=>$classId]);
		$lastPost = $util->fetchOne(self::$queryGetClassLastPost,['userId'=>$userId,'classId'=>$classId]);
		$lastPageQuiz = $util->fetchOne(self::$queryGetClassLastQuiz,['userId'=>$userId,'classId'=>$classId]);
		if($lastPageAccessed){
			$lastPageAccessed= strtotime($lastPageAccessed);
		}
		if($lastPost){
			$lastPost= strtotime($lastPost);
		}
		if($lastPageQuiz){
			$lastPageQuiz= strtotime($lastPageQuiz);
		}
		return max($lastPageAccessed,$lastPageQuiz,$lastPost);
	}
	//return the duration in seconds or 1 minute if we don't know the time the user left the page
	protected static function getDuration($time_in,$time_out,$orgTimeout){
		if(is_null($time_out)){
			return 60;
		}
		$timeFirst  = strtotime($time_in);
		$timeSecond = strtotime($time_out);
		return min(($timeSecond - $timeFirst),3600);
	}
	protected static $queryGetClassLastPageAccessed = <<<SQL
		SELECT time_in FROM activity_history ah
		JOIN pages p ON ah.pageid = p.id
		JOIN units u ON u.id = p.unitid
		JOIN classes cl ON cl.courseid = u.courseid
		WHERE cl.id = :classId and ah.userid = :userId
		ORDER BY ah.time_in DESC
		LIMIT 1
SQL;
	protected static $queryGetClassLastPost = <<<SQL
		SELECT posts.created FROM posts
		JOIN pages p ON posts.pageid = p.id
		JOIN units u ON u.id = p.unitid
		JOIN classes cl ON cl.courseid = u.courseid
		WHERE cl.id = :classId and posts.userid = :userId
		ORDER BY posts.created DESC
		LIMIT 1
SQL;
	protected static $queryGetClassLastQuiz = <<<SQL
		SELECT qs.submitted FROM quiz_scores qs
		JOIN pages p ON qs.quiz_id = p.id
		JOIN units u ON u.id = p.unitid
		JOIN classes cl ON cl.courseid = u.courseid
		WHERE cl.id = :classId and qs.user_id = :userId
		ORDER BY qs.submitted DESC
		LIMIT 1
SQL;
	protected static $queryGetClassTotalTime = <<<SQL
	select sum(if(time_out,LEAST(UNIX_TIMESTAMP(time_out)-UNIX_TIMESTAMP(time_in),3600),60)) from classes c
	join units u on u.courseid = c.courseid
	join pages p on p.unitid = u.id
	join activity_history ah on p.id = ah.pageid
	where c.id = :classId and ah.userid = :userId;
SQL;
	protected static $queryGetActivityHistory = <<<SQL
		select p.id as pageId,p.name as pageName, p.position as pagePosition,
					 header.name as pageGroupName, header.id as pageGroupId, header.position as pageGroupPosition,
					 cl.name as className,cl.id as classId,
					 g.name as groupName,g.id as groupId,
					 un.name as unitPosition,un.description as unitName,un.id as unitId,
					 ah.time_in,ah.time_out,
					 o.session_time as orgTimeout
					 from
		users u
		
		join (
		  SELECT distinct * FROM (SELECT userid,classid,groupid FROM user_classes uc where userid = :userId
		  UNION
		  SELECT  userid,classid,groupid FROM user_classes_history uch where userid = :userId and if(:includeInactive,1,0)
		  ) a
		  )  uc on uc.userid = u.id
		join classes cl on uc.classid = cl.id
		left join groups g on uc.groupid=g.id
		join units un on un.courseid = cl.courseid
		join pages p on p.unitid = un.id
		left join pages header on p.pagegroupid = header.id
		join activity_history ah on p.id = ah.pageid and u.id = ah.userid
		join organizations o on u.organizationid = o.id
		where u.id = :userId and ah.time_in>=:minDate and ah.time_in<=:maxDate and p.hide_activity = 0
SQL;

}


?>