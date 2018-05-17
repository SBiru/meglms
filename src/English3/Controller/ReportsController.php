<?php

namespace English3\Controller;
require_once $_SERVER['DOCUMENT_ROOT'].'/src/English3/Util/FatalErrorMailer.php';

use Doctrine\DBAL\Connection;
use English3\Controller\AutomatedAlerts\Alerts\BehindInCourses;
use English3\Controller\AutomatedAlerts\Alerts\GradeBelowTarget;
use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGrade;
use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGradeType;
use English3\Controller\Classes\UserClassHistory;
use English3\Controller\Reports\DifferentPagesViewed;
use English3\Controller\Reports\HasNotLoggedIn;
use English3\Controller\Reports\PostsPerStudent;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ReportLogger {
    private static $filename = null;
    public static function start($dept=false){
        if(!file_exists($_SERVER['DOCUMENT_ROOT'].'/logs')){
            $a = mkdir($_SERVER['DOCUMENT_ROOT'].'/logs');
        }
        $basename = 'recalculation_'.($dept?$dept.'_':'');
        self::$filename = $_SERVER['DOCUMENT_ROOT'].'/logs/'.$basename.date('YmdHis').'.txt';
        self::log('Gradebook recalculation','w');
    }
    public static function log($message,$mode='a'){
        if(!self::$filename){
            self::start();
        }
        $h = fopen(self::$filename,$mode);
        fwrite($h,'['.date('Y-m-d H:i:s'). '] ' . $message. PHP_EOL);
        fclose($h);
    }
}
class ReportsController{

	private $reader;
	private $util;

	public function __construct(Connection $reader) {
		global $PATHS;
		$this->reader = $reader;
		$this->util = new Utility($reader);
		$this->me = UserController::me($this->reader);
	}
	public function updateAll(Request $request){
		ini_set('max_execution_time', 3600*10);
		set_time_limit(3600*10);
		\FatalErrorMailer::register('Gradebook Recalculation');
		$orgs = Utility::getInstance()->fetch("SELECT id FROM organizations o WHERE o.calculate_progress = 1");
		foreach($orgs as $org){
			$this->update($request,$org['id']);
		}
		return new JsonResponse('Done');
	}
    public function updateDepartment(Request $request,$deptId,$return = true,$all=false) {
        if(!\FatalErrorMailer::$registered){
            \FatalErrorMailer::register('Gradebook Recalculation');
        }
        ReportLogger::start($deptId);
        /* update reports' tables here */
        Utility::clearPOSTParams($request);
        $this->checkWithdrawDates();
        $query = $this->queryGetAllUserClassesForDeparment;
        if($request->request->has('userId')){
            $query.=' and userid='.$request->request->get('userId');
        }
        $allUserClasses = $this->util->fetch($query.' order by classid,userid',['deptId'=>$deptId]);

        foreach($allUserClasses as $entry){

            echo '<div>trying: class:'.$entry['classid'].', userid:'.$entry['userid'].'</div>';
            ReportLogger::log("Starting class {$entry['classid']}, user {$entry['userid']} ");
            $start = time();
            if($request->request->has('recalculateAll') || $all){
                ClassesController::_calculateDueDates($entry['userid'],$entry['classid'],true);
                GradebookController::_recalculate($entry['userid'],null,$entry['classid']);
            }
            GradebookController::getInstance();
            $progressReportEntry = $this->util->fetchRow(
                GradebookController::$queryGetProgressReport,
                array(
                    'classId'=>$entry['classid'],
                    'userId'=>$entry['userid'],
                    'groupId'=>null
                )
            );
            if(false && $progressReportEntry && $progressReportEntry['total_tasks']){
                $this->util->insert(
                    $this->queryUpdateDailyHistory,
                    array(
                        'user_id' => $entry['userid'],
                        'class_id' => $entry['classid'],
                        'perc_completed_score' => $progressReportEntry['perc_completed_score'],
                        'letter_completed_score' => $progressReportEntry['letter_completed_score'],
                        'total_tasks' => $progressReportEntry['total_tasks'],
                        'completed_tasks' => $progressReportEntry['completed_tasks'],
                        'expected_tasks' => $progressReportEntry['expected_tasks'],
                        'perc_completed_tasks' => $progressReportEntry['perc_completed_tasks'],
                        'perc_expected_tasks' => $progressReportEntry['perc_expected_tasks'],
                        'total_score' => $progressReportEntry['total_score'],
                        'total_max_score' => $progressReportEntry['total_max_score'],
                        'total_worked_score' => $progressReportEntry['total_worked_score'],
                        'letter_total_score' => $progressReportEntry['letter_total_score'],
                        'perc_total_score' => $progressReportEntry['perc_total_score'],
                        'expected_end_date' => $progressReportEntry['expected_end_date'],
                        'projected_end_date' => $progressReportEntry['projected_end_date'],
                        'letter_expected_or_completed_score' => $progressReportEntry['letter_expected_or_completed_score'],
                        'perc_expected_or_completed_score' => $progressReportEntry['perc_expected_or_completed_score'],
                        'total_expected_or_completed_score' => $progressReportEntry['total_expected_or_completed_score'],
                        'enrollment_date' => $progressReportEntry['enrollment_date']
                    )
                );
            }
            $took = time() - $start;
            ReportLogger::log("Finishing class {$entry['classid']}, user {$entry['userid']}.");
            ReportLogger::log("Took: {$took} seconds");
            echo '<div>ok: class:'.$entry['classid'].', userid:'.$entry['userid'].'</div>';
        }
        if($return){
            return new JsonResponse('Done');
        }

    }
	public function update(Request $request,$orgId,$return = true) {
        set_time_limit(3600*10);
		ini_set('max_execution_time', 3600*10);
		if(!\FatalErrorMailer::$registered){
			\FatalErrorMailer::register('Gradebook Recalculation');
		}
		/* update reports' tables here */
		Utility::clearPOSTParams($request);
		$this->checkWithdrawDates();
		$query = $this->queryGetAllUserClasses;
		if($request->request->has('userId')){
			$query.=' and userid='.$request->request->get('userId');
		}
		$allUserClasses = $this->util->fetch($query,['orgId'=>$orgId]);

		foreach($allUserClasses as $entry){
			echo '<div>trying: class:'.$entry['classid'].', userid:'.$entry['userid'].'</div>';
			if($request->request->has('recalculateAll')){
				ClassesController::_calculateDueDates($entry['userid'],$entry['classid'],true);
				GradebookController::_recalculate($entry['userid'],null,$entry['classid']);
			}
            GradebookController::getInstance();
			$progressReportEntry = $this->util->fetchRow(
                GradebookController::$queryGetProgressReport,
				array(
					'classId'=>$entry['classid'],
					'userId'=>$entry['userid'],
					'groupId'=>null
				)
			);
			if($progressReportEntry && $progressReportEntry['total_tasks']){
				$this->util->insert(
					$this->queryUpdateDailyHistory,
					array(
						'user_id' => $entry['userid'],
						'class_id' => $entry['classid'],
						'perc_completed_score' => $progressReportEntry['perc_completed_score'],
						'letter_completed_score' => $progressReportEntry['letter_completed_score'],
						'total_tasks' => $progressReportEntry['total_tasks'],
						'completed_tasks' => $progressReportEntry['completed_tasks'],
						'expected_tasks' => $progressReportEntry['expected_tasks'],
						'perc_completed_tasks' => $progressReportEntry['perc_completed_tasks'],
						'perc_expected_tasks' => $progressReportEntry['perc_expected_tasks'],
						'total_score' => $progressReportEntry['total_score'],
						'total_max_score' => $progressReportEntry['total_max_score'],
						'total_worked_score' => $progressReportEntry['total_worked_score'],
						'letter_total_score' => $progressReportEntry['letter_total_score'],
						'perc_total_score' => $progressReportEntry['perc_total_score'],
						'expected_end_date' => $progressReportEntry['expected_end_date'],
						'projected_end_date' => $progressReportEntry['projected_end_date'],
						'letter_expected_or_completed_score' => $progressReportEntry['letter_expected_or_completed_score'],
						'perc_expected_or_completed_score' => $progressReportEntry['perc_expected_or_completed_score'],
						'total_expected_or_completed_score' => $progressReportEntry['total_expected_or_completed_score'],
						'enrollment_date' => $progressReportEntry['enrollment_date']
					)
				);
			}
			echo '<div>ok: class:'.$entry['classid'].', userid:'.$entry['userid'].'</div>';
		}
		if($return){
			return new JsonResponse('Done');
		}

	}
	private function checkWithdrawDates(){
		$studentsToBeWithdrawn = Utility::getInstance()->fetch("SELECT u.id,uc.classid,uc.groupid FROM users u join user_classes uc on uc.userid = u.id WHERE u.attendance_withdraw_date is not null and u.attendance_withdraw_date > '2000-01-01' and u.attendance_withdraw_date <= now()");
		foreach($studentsToBeWithdrawn as $entry){
			UserClassHistory::moveUserToClassHistory($entry['id'],$entry['classid'],$entry['groupid']);
		}
	}

	/* Report 1: (advisor's alert)
	 * 1. list of students, and their courses where grade < C
	 *	- date grade dropped below C
	 *	- trend: moving up? moving down? (grade) -> for last month
	 */
	public function getReport1(Request $request) {
		// ordered by class' name and record date, descending

		$targetGrade = new TargetGrade(TargetGradeType::LETTER,'C');
		$alert = new GradeBelowTarget($targetGrade);
		return new JsonResponse(['students'=>$alert->adviseesWithGradesBellowC($this->me->user->getUserId())]);
	}

	/* Report 2:
	 * 2. list of students WHO are +15% behind in the course(s)
	 *	- in what course(s) they are behind?
	 *	- last time they work in this/these course(s) -where behind
	 */
	public function getReport2(Request $request) {
		$alert = new BehindInCourses();
		$students = $alert->adviseesBehindByGivenPercent($this->me->user->getUserId(),15);
		$header = array(
			array('id'=>'name','label'=>'Student'),
			array('id'=>'className','label'=>'Class'),
			array('id'=>'percBehind','label'=>'Behind (%)'),
			array('id'=>'lastTimeWorked','label'=>'Last Time Worked'),
		);
		return new JsonResponse(['students'=>$students,'header'=>$header]);
	}


	/* Report 3:
	 * 3. list of students WHO have not logged into a course for > 1 week
	 *	- course(s) name(s)
	 */
	public function getReport3() {
        return new JsonResponse(['students'=>[],'header'=>[]]);
		$students = array();
		$data = $this->util->fetch(
			$this->queryGetReport3,
			array('advisorId' => $this->me->user->getUserId())
		);
		foreach($data as $entry){
			$students[$entry['id']] = array(
				'id' => $entry['id'],
				'first_name' => $entry['fname'],
				'last_name' => $entry['lname'],
				'name'=>$entry['lname'].', '.$entry['fname'],
				'fullName'=>$entry['fname'].' '.$entry['lname'],
				'lastPageSeen'=>$entry['lastPageSeen']

			);
		}

		$header=array(
			array('id'=>'name','label'=>'Student'),
			array('id'=>'lastPageSeen','label'=>'Last login')
		);
		return new JsonResponse(['students'=>$students,'header'=>$header]);
	}

	/*
	 * 4. list of students WHO are missing 3 assignments (final doesn't count)
	 */
	public function getReport4() {
		$history = $this->util->fetch(
			$this->queryGetReport4,
			array('advisorId' => $this->me->user->getUserId())
		);
		$students = array();
		foreach ($history as $entry) {
			// group by student ids
			if(!array_key_exists($entry['userId'], $students)){
				$students[$entry['userId']] = array(
					'id' => $entry['userId'],
					'first_name' => $entry['fname'],
					'last_name' => $entry['lname'],
					'name'=>$entry['lname'].', '.$entry['fname'],
					'fullName'=>$entry['fname'].' '.$entry['lname'],
					'classes' => array()
				);
			}
			// classes are grouped under student's objects
			if(!array_key_exists($entry['classId'], $students[$entry['userId']]['classes'])){
				$students[$entry['userId']]['classes'][$entry['classId']] = array(
					'name' => $entry['className'],
					'missingTasks'=>$entry['missing_tasks'],
					'expectedTasks'=>$entry['expected_tasks']

				);
			}
		}
		$header=array(
			array('id'=>'name','label'=>'Student'),
			array('id'=>'className','label'=>'Class'),
			array('id'=>'missingTasks','label'=>'Missing tasks'),
			array('id'=>'expectedTasks','label'=>'Expected tasks'),
		);
		return new JsonResponse(['students'=>$students,'header'=>$header]);
	}
	/*
	 * All current students
				- grade
				- current course progress
				- 90-day completion date
				- expected course completion date
					* based on current progress, for every course in which student is enrolled
	 */
	public function getReportStudents() {
		$students = array();
		$this->util->calcLoggedIn();
		if($this->me->amISuperUser()){
			$data = $this->util->fetch(
				$this->queryGetReportAllStudents
			);
		}else if($this->me->amIOrgAdmin()){
			$data = $this->util->fetch(
				$this->queryGetReportAllStudents . ' and u.organizationid = :orgId ',
				array('orgId' => $this->me->user->getOrgId())
			);
		}else{
			$data = $this->util->fetch(
				$this->queryGetReportAllStudents . ' and (pr.userid IN
		(SELECT studentid
		 FROM user_advisors
		 WHERE userid = :advisorId) or pr.userid in (SELECT user_id FROM site_users su join user_admin_sites ua on ua.siteid = su.site_id where ua.userid = :advisorId))',
				array('advisorId' => $this->me->user->getUserId())
			);
		}



		foreach($data as $entry){
			if(!array_key_exists($entry['userid'], $students)){
				$students[$entry['userid']] = array(
					'first_name' => $entry['fname'],
					'last_name' => $entry['lname'],
					'name'=>$entry['lname'].', '.$entry['fname'],
					'fullName'=>$entry['fname'].' '.$entry['lname'],
					'organizationid'=>intval($entry['organizationid']),
					'classes' => array()
				);
			}
			// classes are grouped under student's objects
			if(!array_key_exists($entry['classid'], $students[$entry['userid']]['classes'])){
				$students[$entry['userid']]['classes'][$entry['classid']] = array(
					'name' => $entry['className']
				);
				$progressReport = GradebookController::_wrapProgressReport($entry);
				unset($progressReport['fname']);
				unset($progressReport['lname']);
				unset($progressReport['email']);
				unset($progressReport['className']);
				unset($progressReport['id']);
				unset($progressReport['userid']);
				if(boolval($entry['show_grades_as_letter'] || $entry['organizationid']==10)){
					$progressReport['grade']=$progressReport['letterCompletedScore'].' ('.$progressReport['percCompletedScore'].'%)';
				}else{
					$progressReport['grade']=$progressReport['percCompletedScore'].'%';
				}


				$students[$entry['userid']]['classes'][$entry['classid']]=array_merge(
					$students[$entry['userid']]['classes'][$entry['classid']],
					$progressReport
					);
			}
		}

		return new JsonResponse(array_values($students));
	}
	public function getClassSummary(Request $request){
		$u = &$this->util;
		$me = &$this->me;
		$isAdmin = $me->amIOrgAdmin()||$me->amISuperUser();
		$isTeacher = count($me->classesITeach())>0;
		if(!($isAdmin || $isTeacher)){
			return Utility::buildHTTPError('Must be a teacher or an admin');
		}
		$classIds = array();
		if($request->query->has("classes")){
			$classIds=json_decode($request->query->get("classes"));
		}else{
			if($isAdmin){
				$classCtrl = new ClassesController($u->reader);
				$classes=$classCtrl->_getClassesAs('teacher',null,null,null,false);
			}else{
				$classes =$me->classesITeach();

			}
			foreach($classes as $class){
				$classIds[]=$class['id'];
			}
		}



		$data = $u->reader->fetchAll(
			$this->queryGetClassSummary,
			['classes'=>$classIds],
			['classes'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]
		);
		$needingGrade = PostsController::_countNeedingGradeForClasses($classIds);
		foreach($data as &$row){
			$row['unitCount']=intval(@$row['unitCount']);
			$row['studentCount']=intval(@$row['studentCount']);
			$row['lessonsCount']=intval(@$row['lessonsCount']);
			$row['submittableCount']=intval(@$row['submittableCount']);
			if(isset($needingGrade[@$row['id']])){
				@$row['needingGrade']=@$needingGrade[@$row['id']]['count'];
			}
		}

		return new JsonResponse($data);
	}
	public function getDifferentPagesViewed(Request $request,$classId){
	    $report = new DifferentPagesViewed($classId);
	    return new JsonResponse($report->load());
    }
    public function getPostsPerStudent(Request $request,$classId){
	    $report = new PostsPerStudent($classId);
	    return new JsonResponse($report->load());
    }
    public function hasNotLoggedIn(Request $request){
        $report = new HasNotLoggedIn();
        $classId = $request->get('classId');
        $allGroups = false;
        if($classId && strpos($classId,'-')===false){
            $allGroups = true;
        }
        $data = $report->load($request->get('orgId'),$request->get('classId'),$allGroups);
        return new JsonResponse($data);
    }
	public function getTimeSpentInCourse(Request $request,$classId){
	    list($classId,$groupId) = Utility::splitClassGroupIds($classId);
		if($classId == 'all' ){
	        Utility::getInstance()->checkAdmin(null,true);
	        $classId = null;
            $orgId = $_SESSION['USER']['ORGID'];
        }else{
            $this->util->checkTeacher($classId);
            $orgId = null;
        }
		$data =$this->util->fetch($this->queryGetTimeSpentInCourse,['classId'=>$classId,'orgId'=>$orgId,'groupId'=>$groupId]);
		$pages=array();
		foreach($data as $entry){
			if (!array_key_exists($entry['pageId'], $pages)) {
				$pages[$entry['pageId']]=array(
					'id'=>$entry['pageId'],
					'name'=>$entry['pageName'],
					'avgTimeSpent'=>0,
					'max'=>null,
					'min'=>null,
					'students'=>array(),
				);
			}
			$students = &$pages[$entry['pageId']]['students'];
			if (!array_key_exists($entry['id'], $students)) {
				$students[$entry['id']]=array(
					'id' => $entry['id'],
					'first_name' => $entry['fname'],
					'last_name' => $entry['lname'],
					'name'=>$entry['lname'].', '.$entry['fname'],
					'fullName'=>$entry['fname'].' '.$entry['lname'],
					'timeSpent'=>intval($entry['timeSpent'])
				);
				if(is_null($pages[$entry['pageId']]['max']) || intval($entry['timeSpent'])>$pages[$entry['pageId']]['max']){
					$pages[$entry['pageId']]['max']=intval($entry['timeSpent']);
				}
				if(is_null($pages[$entry['pageId']]['min']) || intval($entry['timeSpent'])<$pages[$entry['pageId']]['min']){
					$pages[$entry['pageId']]['min']=intval($entry['timeSpent']);
				}
				$pages[$entry['pageId']]['avgTimeSpent']+=intval($entry['timeSpent']);
			}
		}
		foreach($pages as $id=>&$page){
			$page['students']=array_values($page['students']);
			$page['avgTimeSpent']=$page['avgTimeSpent']/count($page['students']);

		}
		return new JsonResponse(array_values($pages));
	}
	public function getStudentProgressDistribution(Request $request){
		$u = &$this->util;
		$me = &$this->me;
		$isAdmin = $me->amIOrgAdmin()||$me->amISuperUser();
		$isTeacher = count($me->classesITeach())>0;
		if(!($isAdmin || $isTeacher)){
			return Utility::buildHTTPError('Must be a teacher or an admin');
		}
		$classIds = array();
		if($request->query->has("classes")){
			$classIds=json_decode($request->query->get("classes"));
		}else{
			if($isAdmin){
				$classCtrl = new ClassesController($u->reader);
				$classes=$classCtrl->_getClassesAs('teacher',null,null,null,false);
			}else{
				$classes =$me->classesITeach();

			}
			foreach($classes as $class){
				$classIds[]=$class['id'];
			}
		}

		$prData = $u->reader->fetchAll(
			$this->queryGetProgressReportForClasses,
			['classes'=>$classIds],
			['classes'=>\Doctrine\DBAL\Connection::PARAM_STR_ARRAY]
		);
		$classes=array();
		foreach($prData as $entry) {
			if (!array_key_exists($entry['classid'], $classes)) {
				$classes[$entry['classid']] = array(
					'id' => $entry['classid'],
					'name' => $entry['className'],
					'percBehind' => array(
						'lt_20' => array('students'=>array()),
						'gt_20_lt_35' => array('students'=>array()),
						'gt_35' => array('students'=>array())
					),
				);
			}

			$percBehind = intval($entry['perc_expected_tasks']) - intval($entry['perc_completed_tasks']);
			if ($percBehind <= 20) {
				$students = &$classes[$entry['classid']]['percBehind']['lt_20']['students'];
			}else if($percBehind > 20 && $percBehind <= 35){
				$students = &$classes[$entry['classid']]['percBehind']['gt_20_lt_35']['students'];
			}else if($percBehind > 35){
				$students = &$classes[$entry['classid']]['percBehind']['gt_35']['students'];
			}
			if (!array_key_exists($entry['userid'], $students)) {
				$students[$entry['userid']] = array(
					'id' => $entry['userid'],
					'first_name' => $entry['fname'],
					'last_name' => $entry['lname'],
					'name' => $entry['lname'] . ', ' . $entry['fname'],
					'fullName' => $entry['fname'] . ' ' . $entry['lname'],
					'percBehind'=> $percBehind
				);
			}
		}

		foreach($classes as &$class){
			$total = 0;
			foreach($class['percBehind'] as $key=>&$value){
				$value['students'] = array_values($value['students']);
				$total+=count($value['students']);
			}
			foreach($class['percBehind'] as $key=>&$value){
				$value['percentage']=floatval(count($value['students'])/$total);
			}
			$class['total']=$total;

		}
		return new JsonResponse(array_values($classes));
	}
	public function exportActivityReport(Request $request){
		Utility::clearPOSTParams($request);
		$exporter = new ActivityReportExporter(
			$request->request->get('report'),
			$request->request->get('options')
		);
		$filename = $request->request->get('filename').'_activity_report_'.date('Ymdhis').'.csv';
		$content = $exporter->writeFile();
		return new JsonResponse(['content'=> $content,'filename'=>$filename]);
	}

	/***************************
	 * QUERIES
	 ***************************/
	private $queryGetReport2 = <<<SQL
		SELECT (pr.perc_expected_tasks-pr.perc_completed_tasks) as perc_behind,
		pr.perc_expected_tasks,
		pr.perc_completed_tasks,
		cl.id as classId,
		cl.name as className,
		u.fname,
		u.lname,
		 u.email,
		 u.id as userId
		FROM progress_report pr
		JOIN classes cl ON pr.classid = cl.id
		JOIN users u ON u.id = pr.userid
		JOIN user_classes uc on u.id = uc.userid and cl.id = uc.classid
		WHERE
		 (pr.perc_expected_tasks-pr.perc_completed_tasks)>=15
		 AND pr.userid IN
			(SELECT studentid
			 FROM user_advisors
			 WHERE userid = :advisorId)
SQL;
	private $queryGetReport3 = <<<SQL
	select
		u.id,
		u.fname,
		u.lname,
		ah.time_in as lastPageSeen
	 from
		(select max(time_in) time_in, userid,pageid from activity_history ah
			group by userid) ah
		 join users u on u.id = ah.userid
		 JOIN pages p on ah.pageid = p.id
		 JOIN units un on un.id = p.unitid
		 JOIN classes cl on un.courseid = cl.courseid
	where ah.userid IN
	(SELECT studentid
	 FROM user_advisors
	 WHERE userid = :advisorId) and time_in<now()- INTERVAL 7 DAY;
SQL;
	private $queryGetReport4 = <<<SQL
	SELECT
		pr.expected_tasks,
		pr.completed_tasks,
		(pr.expected_tasks-pr.completed_tasks) as missing_tasks,
		cl.id as classId,
		cl.name as className,
		u.fname,
		u.lname,
		 u.email,
		 u.id as userId
		FROM progress_report pr
		JOIN classes cl ON pr.classid = cl.id
		JOIN users u ON u.id = pr.userid
		JOIN user_classes uc on u.id = uc.userid and cl.id = uc.classid
		WHERE
		 (pr.expected_tasks-pr.completed_tasks)>=3
		 AND pr.userid IN
			(SELECT studentid
			 FROM user_advisors
			 WHERE userid = :advisorId)
SQL;
	private $queryGetReportAllStudents=<<<SQL
	SELECT pr.*,
		u.fname,
		u.lname,
		u.email,
		c.name as className,
		c.course_length,
		c.show_grades_as_letter,
		u.organizationid
	FROM progress_report pr
	JOIN users u ON u.id = pr.userid
	JOIN classes c ON c.id = pr.classid
	JOIN user_classes uc on u.id = uc.userid and c.id = uc.classid
	WHERE uc.is_student = 1
SQL;
	private $queryUpdateDailyHistory=<<<SQL
	INSERT INTO history_student_class
		(user_id, class_id, date, perc_completed_score, letter_completed_score, total_tasks, completed_tasks, expected_tasks, perc_completed_tasks, perc_expected_tasks, total_score, total_max_score, total_worked_score, letter_total_score, perc_total_score, expected_end_date, projected_end_date, enrollment_date,letter_expected_or_completed_score,perc_expected_or_completed_score,total_expected_or_completed_score)
	 VALUES
	 	(:user_id, :class_id, CURDATE(), :perc_completed_score, :letter_completed_score, :total_tasks, :completed_tasks, :expected_tasks, :perc_completed_tasks, :perc_expected_tasks, :total_score, :total_max_score, :total_worked_score, :letter_total_score, :perc_total_score, :expected_end_date, :projected_end_date, :enrollment_date,:letter_expected_or_completed_score,:perc_expected_or_completed_score,:total_expected_or_completed_score)
	ON DUPLICATE KEY UPDATE perc_completed_score=:perc_completed_score, letter_completed_score=:letter_completed_score, total_tasks=:total_tasks, completed_tasks=:completed_tasks, expected_tasks=:expected_tasks, perc_completed_tasks=:perc_completed_tasks, perc_expected_tasks=:perc_expected_tasks, total_score=:total_score, total_max_score=:total_max_score, total_worked_score=:total_worked_score, letter_total_score=:letter_total_score, perc_total_score=:perc_total_score, expected_end_date=:expected_end_date, projected_end_date=:projected_end_date, enrollment_date=:enrollment_date,
	letter_expected_or_completed_score=:letter_expected_or_completed_score,perc_expected_or_completed_score=:perc_expected_or_completed_score,total_expected_or_completed_score=:total_expected_or_completed_score
SQL;
	private $queryGetAllUserClasses=<<<SQL
	SELECT DISTINCT userid,classid
	FROM user_classes uc
	JOIN users u ON u.id = uc.userid
	JOIN classes cl ON cl.id = uc.classid
	JOIN courses c ON c.id = cl.courseid
	JOIN departments d ON d.id = c.departmentid
	WHERE d.organizationid=:orgId
SQL;
	private $queryGetAllUserClassesForDeparment=<<<SQL
	SELECT DISTINCT userid,classid
	FROM user_classes uc
	JOIN users u ON u.id = uc.userid
	JOIN classes cl ON cl.id = uc.classid
	JOIN courses c ON c.id = cl.courseid
	JOIN departments d ON d.id = c.departmentid
	WHERE d.id = :deptId
SQL;
	private $queryGetProgressReportForClasses=<<<SQL
	SELECT pr.*,
		u.fname,
		u.lname,
		u.email,
		c.name as className
	FROM progress_report pr
	JOIN users u ON u.id = pr.userid
	JOIN user_classes uc ON uc.userid = u.id and uc.classid=pr.classid
	JOIN classes c ON c.id = pr.classid
	WHERE pr.classid in (:classes) and uc.is_student=1
SQL;
	private $queryGetTimeSpentInCourse=<<<SQL
	SELECT
		sum(if(time_out is null,60,least( UNIX_TIMESTAMP(time_out)-UNIX_TIMESTAMP(time_in),3600))) as timeSpent,
		p.id as pageId,
		p.name as pageName,
		users.id,
		users.fname,
		users.lname
	FROM activity_history ah JOIN pages p ON ah.pageid = p.id
	JOIN units u ON u.id = p.unitid
	JOIN classes c ON c.courseid = u.courseid
	JOIN users ON users.id = ah.userid
	LEFT JOIN user_classes uc on uc.classid = c.id and uc.userid = ah.userid
	WHERE if(:classId,c.id = :classId,1) and if(:groupId,uc.groupid = :groupId,1) and if(:orgId,users.organizationid = :orgId,1)
	GROUP BY ah.pageid,ah.userid
	ORDER BY u.name,p.position;
SQL;
	private $queryGetClassSummary = <<<SQL
	SELECT
		c.id,
		c.name,
		count(distinct u.id) as unitConut,
		count(distinct uc.userid) as studentCount,
		count(distinct CASE WHEN pagegroupid>0 THEN pagegroupid END) as lessonCount,
		count(distinct CASE WHEN p.allow_template_post=1 or p.allow_text_post=1 or p.allow_upload_post=1 or p.allow_video_post=1 THEN p.id END) as submittableCount
	FROM pages p
	JOIN units u ON u.id = p.unitid
	JOIN classes c ON c.courseid = u.courseid
	JOIN user_classes uc ON uc.classid=c.id
	WHERE c.id in (:classes)
		and uc.is_student=1
		and uc.is_suspended=0
		and (uc.finished_the_class=0 or uc.finished_the_class is null)
	GROUP BY c.id;
SQL;
}
abstract class ReportExporter{
	protected $reportData;
	protected $csvExporter;
	protected $options;
	public function __construct($reportData,$options){
		$this->reportData = $reportData;
		$this->options = $options;
		$this->csvExporter = new CSVExporter();
		$this->setCSVExporter();
	}
	public function writeFile(){
		return $this->csvExporter->writeCSV();
	}
	public function buildFileResponse($fileName){
		return Utility::buildFileResponse($this->writeFile(),$fileName);
	}

	abstract protected function setCSVExporter();
}

class ActivityReportExporter extends ReportExporter{
	private $subTables;
	private $subTableTitleField;
	protected function setCSVExporter(){
		$this->setSubTableFields($this->options['groupBy']);
		$this->buildSubTables();
	}

	private function buildSubTables(){
		foreach($this->subTables as $subTable){
			$this->buildSubTableTitle($subTable);
			$this->buildSubTableHeader();
			$this->buildSubTableBody($subTable['rows']);
			$this->addExtraLine();
		}
	}
	private function buildSubTableTitle($subTable){
		$contentFunction = function($rowData){
			return $rowData['title'];
		};
		$headerRow = new CSVRow(
				['title'=>$subTable[$this->subTableTitleField]],
				[new CSVField(CSVFieldType::DYNAMIC_TYPE,$contentFunction)]
			);
		$this->csvExporter->addRow($headerRow);
	}

	private function buildSubTableHeader(){
		$fields = [
			new CSVField(CSVFieldType::STATIC_TYPE,'Unit'),
			new CSVField(CSVFieldType::STATIC_TYPE,'Page Name'),
			new CSVField(CSVFieldType::STATIC_TYPE,'Time'),
			new CSVField(CSVFieldType::STATIC_TYPE,'Event'),
			new CSVField(CSVFieldType::STATIC_TYPE,'Duration'),
			new CSVField(CSVFieldType::STATIC_TYPE,'Time Unit'),
		];
		if($this->options['groupBy']!='class'){
			array_unshift($fields,new CSVField(CSVFieldType::STATIC_TYPE,'Class Name'));
		}
		$headerRow = new CSVRow([],$fields);
		$this->csvExporter->addRow($headerRow);
	}
	private function buildSubTableBody($rows){
		foreach($rows as $row){
			$fields = [
				new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['unit'];}),
				new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['pageName'];}),
				new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['time'];}),
				new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['event'];}),
				new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['duration'];}),
				new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['timeUnit'];}),
			];
			if($this->options['groupBy']!='class'){
				array_unshift($fields,new CSVField(CSVFieldType::DYNAMIC_TYPE,function($rowData){return $rowData['className'];}));
			}
			$csvRow = new CSVRow($row,$fields);
			$this->csvExporter->addRow($csvRow);
		}
	}
	private function addExtraLine(){
		$csvRow = new CSVRow([],[]);
		$this->csvExporter->addRow($csvRow);
	}
	private function setSubTableFields($groupBy){
		if($groupBy=='class'){
			$this->setClassTableFields();
		}else{
			$this->setDayTableFields();
		}
		$this->subTables = $this->reportData;
	}
	private function setClassTableFields(){
		$this->subTableTitleField = 'name';
	}
	private function setDayTableFields(){
		$this->subTableTitleField = 'day';
	}


}
