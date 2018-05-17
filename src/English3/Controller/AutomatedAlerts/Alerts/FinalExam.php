<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.15.6
 * Time: 14:01
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\UserController;
use English3\Controller\Utility;

class FinalExam extends Alert{
    private $assignments;
    private $students;
    private $classes;
    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $this->assignments = $this->params['assignments'];
        $this->getUsersCompletedFinalExam($this->assignments);
    }

    public function sortBy($by)
    {
        if($by=='students'){
            return $this->students;
        }
        if($by == 'classes'){
            return $this->sortByClasses();
        }
    }
    public function useOuterTable(){return true;}
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
        ];
    }
    public function outerTableInfo(){
        return ['nameField'=>'name','dataField'=>'studentArray'];
    }
    public function getUsersCompletedFinalExam($assignments){
        $data = Utility::getInstance()->fetch($this->queryWithFilters($assignments));
        $this->prepareData($data);
        return $this->students;
    }
    private function queryWithFilters($assignments){
        $assignmentIds = array_map(function($assignment){
            return $assignment['id'];
        },$assignments);
        return sprintf($this->queryGetUsersCompletedFinalExam,implode(',',$assignmentIds));
    }
    private function prepareData($data){
        $this->students = array();
        foreach($data as $row){
            Utility::addToObjectIfNotExists($row['id'],$this->newStudentFromRow($row),$this->students);
            Utility::addToObjectIfNotExists($row['classId'],$this->newClassFromRow($row),$this->students[$row['id']]['classes']);
        }
    }
    private function sortByClasses(){
        $this->classes = array();
        foreach($this->students as $student){
            foreach($student['classes'] as $class){
                Utility::addToObjectIfNotExists($class['id'],$this->newClassFromStudentArray($class),$this->classes);
                Utility::addToObjectIfNotExists($student['id'],$this->newStudentFromStudentArray($student),$this->classes[$class['id']]['students']);
            }
        }
        return $this->classes;
    }
    private function newStudentFromRow($row){
        return [
            'id'=>$row['id'],
            'fname'=>$row['fname'],
            'lname'=>$row['lname'],
            'name'=>$row['name'],
            'classes'=>array()
        ];
    }
    private function newClassFromRow($row){
        return [
            'id'=>$row['classId'],
            'name'=>$row['className']
        ];
    }
    private function newClassFromStudentArray($class){
        $class['students']= array();
        return $class;
    }
    private function newStudentFromStudentArray($student){
        unset($student['classes']);
        return $student;
    }
    private $queryGetUsersCompletedFinalExam = <<<SQL
    SELECT u.id,
    u.fname,
    u.lname,
    concat(u.lname,", ",u.fname) as name,
    c.name as className,
    c.id as classId
    FROM gradebook g
    JOIN users u ON g.userid = u.id
    JOIN pages p on p.id = g.pageid
    JOIN units ON units.id = p.unitid
    JOIN classes c ON c.courseid = units.courseid
    JOIN user_classes uc ON uc.classid = c.id and u.id = uc.userid
	WHERE
	c.exclude_from_alerts = 0 and uc.is_student = 1  and p.id in (%s) and g.score is not null
	ORDER BY c.name

SQL;

}