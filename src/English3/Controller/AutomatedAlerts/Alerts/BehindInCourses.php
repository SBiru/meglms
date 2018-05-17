<?php

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\UserActivityController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;

class BehindInCourses extends Alert{
    private $util;
    private $students;

    public function __construct($params){
        $this->util = Utility::getInstance();
        $this->students=array();
        parent::__construct($params);

    }
    public function loadAlertFromParams(){
        $percBehind = $this->params['x'];
        if($this->params['classIds']){
            return $this->studentsInCoursesBehindByGivenPercent($percBehind,$this->params['classIds']);
        }if (Utility::getInstance()->checkAdmin(null,true,false)){
            return $this->studentsBehindByGivenPercent($percBehind);
        }
        if($this->params['orgId']){
            return $this->studentsBehindByGivenPercent($percBehind,$this->params['orgId']);
        }
        return $this->adviseesBehindByGivenPercent($_SESSION['USER']['ID'],$percBehind);
    }
    public function useOuterTable(){return true;}
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'percBehind','label'=>'% behind'],
        ];
    }
    public function outerTableInfo(){
        return ['nameField'=>'name','dataField'=>'studentArray'];
    }


    public function adviseesBehindByGivenPercent($advisorId,$percBehind){
        $this->prepareStudents(BehindInCoursesSQL::getAdviseesBehindInCourses($advisorId,$percBehind));
        return $this->students;
    }

    public function studentsBehindByGivenPercent($percBehind,$orgId = null,$percBehindMax=null){
        $this->prepareStudents(BehindInCoursesSQL::getAllStudentsBehindInCourses($percBehind,$orgId,$percBehindMax));
        return $this->students;
    }
    public function studentsInCoursesBehindByGivenPercent($percBehind,$classes,$percBehindMax=null){
        $this->prepareStudents(BehindInCoursesSQL::getAllStudentsBehindInCourses($percBehind,null,$percBehindMax,$classes));
        return $this->students;
    }

    private function prepareStudents($students){
        foreach ($students as $entry) {
            $this->createStudentIfNotExist($entry);
            $this->createClassForStudentIfNotExist($entry);
            $this->fillStudentParents($entry);
            $this->fillStudentAdvisors($entry);
        }
    }

    private function createStudentIfNotExist($entry){
        if(!array_key_exists($entry['userId'], $this->students)){
            $this->students[$entry['userId']] = array(
                'id' => $entry['userId'],
                'first_name' => $entry['fname'],
                'last_name' => $entry['lname'],
                'name'=>$entry['lname'].', '.$entry['fname'],
                'fullName'=>$entry['fname'].' '.$entry['lname'],
                'advisors' => array(),
                'parents' => array(),
                'classes' => array()
            );
        }
    }

    private function createClassForStudentIfNotExist($entry){
        if(!array_key_exists($entry['classId'], $this->students[$entry['userId']]['classes'])){
            $this->students[$entry['userId']]['classes'][$entry['classId']] = array(
                'name' => $entry['className'],
                'percBehind'=>$entry['perc_behind'],
                'percExpectedTasks'=>$entry['perc_expected_tasks'],
                'percCompletedTasks'=>$entry['perc_completed_tasks'],
                'lastTimeWorked'=>date('Y-m-d H:i:s',UserActivityController::_getClassLastWork($entry['userId'],$entry['classId']))
            );
        }
    }
    
    private function fillStudentParents($entry){
        if(@$entry['parentId']){
            $parent = array(
                'id'=>@$entry['parentId'],
                'name'=>@$entry['parentName'],
                'email'=>@$entry['parentEmail']
            );
            if(!array_key_exists($parent['id'], $this->students[$entry['userId']]['parents'])){
                $this->students[$entry['userId']]['parents'][$parent['id']]=$parent;
            }
        }
    }
    
    private function fillStudentAdvisors($entry){
        if(@$entry['advisorId']){
            $advisor = array(
                'id'=>@$entry['advisorId'],
                'name'=>@$entry['advisorName'],
                'email'=>@$entry['advisorEmail']
            );
            if(!array_key_exists($advisor['id'], $this->students[$entry['userId']]['advisors'])){
                $this->students[$entry['userId']]['advisors'][$advisor['id']]=$advisor;
            }
        }
    }
    public function sortBy($by){
        if($by=='students'){
            return $this->students;
        }
        if($by=='classes'){
            return $this->sortByClasses();
        }
    }
    private function sortByClasses(){
        $classes = array();
        foreach($this->students as $student){
            foreach($student['classes'] as $classId => $class){
                Utility::addToObjectIfNotExists($classId,['name'=>$class['name'],'id'=>$classId,'students'=>array()],$classes);
                unset($student['classes']);
                $student['lastTimeWorked'] = $class['lastTimeWorked'];
                $student['percBehind'] = intval($class['percBehind']);
                $student['percCompletedTasks'] = intval($class['percCompletedTasks']);
                $student['percExpectedTasks'] = intval($class['percExpectedTasks']);
                Utility::addToObjectIfNotExists($student['id'],
                    $student
                    ,$classes[$classId]['students']);
            }
        }
        $this->classes = $classes;
        return $this->classes;
    }

}
class BehindInCoursesSQL{
    public static function getAdviseesBehindInCourses($advisorId,$percBehind,$percBehindMax=null){
        $query = self::$queryGetAllStudentsBehindInCourses.' AND pr.userid IN
			(SELECT studentid
			 FROM user_advisors
			 WHERE userid = :advisorId) ORDER BY cl.name';
        $params=array('advisorId' => $advisorId,'percBehind'=>$percBehind);

        if($percBehindMax){
            self::appendPercMaxFilter($query,$params,$percBehindMax);
        }
        return Utility::getInstance()->fetch(
            $query,
            $params
        );
    }
    public static function getAllStudentsBehindInCourses($percBehind,$orgId = null,$percBehindMax=null,array $classIds=null){
        $query = self::$queryGetAllStudentsBehindInCourses;
        $params = array('percBehind'=>$percBehind);
        if($percBehindMax){
            self::appendPercMaxFilter($query,$params,$percBehindMax);
        }
        if(!is_null($orgId)){
            $query.=' and u.organizationid=:orgId';
            $params['orgId']=$orgId;
        }
        if(!is_null($classIds)){
            $query .= sprintf(" and cl.id in (%s)",implode(',',$classIds));
        }

        return Utility::getInstance()->fetch(
            $query.' ORDER BY cl.name',
            $params
        );
    }
    private static function appendPercMaxFilter(&$query,&$params,$percMax){
        $query.=' and (pr.perc_expected_tasks-pr.perc_completed_tasks)<:percBehindMax';
        $params['percBehindMax']=$percMax;
    }
    private static $queryGetAllStudentsBehindInCourses = <<<SQL
		SELECT DISTINCT (pr.perc_expected_tasks-pr.perc_completed_tasks) as perc_behind,
		pr.perc_expected_tasks,
		pr.perc_completed_tasks,
		cl.id as classId,
		cl.name as className,
		u.fname,
		u.lname,
		 u.email,
		 u.id as userId,
		 ug.userid as parentId,
		 concat(guardian.fname,' ',guardian.lname) as parentName,
		 guardian.email as parentEmail,
		 ua.userid as advisorId,
		 concat(advisor.fname,' ',advisor.lname) as advisorName,
		 advisor.email as advisorEmail
		FROM progress_report pr
		JOIN classes cl ON pr.classid = cl.id
		JOIN users u ON u.id = pr.userid
		JOIN user_classes uc on u.id = uc.userid and cl.id = uc.classid
		LEFT JOIN user_guardians ug ON ug.userchildid = u.id
		LEFT JOIN users guardian ON guardian.id = ug.userid
		LEFT JOIN user_advisors ua ON ua.studentid = u.id
		LEFT JOIN users advisor ON advisor.id = ua.userid
		WHERE
		cl.exclude_from_alerts = 0 and
		 (pr.perc_expected_tasks-pr.perc_completed_tasks)>=:percBehind
		 and uc.is_student = 1


SQL;
}