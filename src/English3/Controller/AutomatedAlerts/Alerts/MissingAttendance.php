<?php

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\UserActivityController;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\Config\Definition\Exception\Exception;


class MissingAttendance extends Alert{
    private $util;
    private $students;
    private $dates;
    private $lastDate;
    private $classes;
    public $sql;
    public function __construct($params){
        $this->util = Utility::getInstance();
        $this->sql = new MissingAttendanceSQL();
        parent::__construct($params);
    }
    public function setParams($params){
        $this->params = $params;
    }

    public function loadAlertFromParams(){
        $p = &$this->params;
        if(@$p['classes']){
            $p['classIds'] = array_map(function($c){return $c['id'];},$p['classes']);
            $maxDate = $this->getLastWeekDate();
            return $this->getMissingAttendanceGivenClassIds($p['classIds'],'2015-01-01',$maxDate);
        }
        else{
            $maxDate = @$p['maxDate']?:$this->getLastWeekDate();
            return $this->getStudentsMissingAttendanceInOrg($p['orgId'],'2015-01-01',$maxDate);
        }
    }

    public function getLastWeekDate($now=null){
        $previous_week = strtotime("-1 week +1 day",$now);
        $start_week = strtotime("last monday midnight",$previous_week);
        $end_week = strtotime("next friday",$start_week);
        $end_week = date("Y-m-d",$end_week);
        return $end_week;
    }
    public function sortBy($by){
        if($by == 'students'){
            return $this->students;
        }
        if($by == 'classes'){
            return $this->sortByClasses();
        }

    }
    public function useOuterTable(){return true;}
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name']
        ];
    }
    public function outerTableInfo(){
        return ['nameField'=>'name','dataField'=>'studentArray'];
    }
    public function getStudentsMissingAttendanceInOrg($orgId,$minDate=null,$maxDate=null){
        $data = $this->sql->getStudentAttendanceForDateRangeInOrg($orgId,$minDate,$maxDate);
        return $this->getStudentsMissingAttendance($data,$minDate,$maxDate);
    }
    public function getMissingAttendanceGivenStudentIds($userIds,$minDate=null,$maxDate=null,$classId=null){
        $data = $this->sql->getUsersAttendanceForDateRange($userIds,$minDate,$maxDate,$classId);
        return $this->getStudentsMissingAttendance($data,$minDate,$maxDate);
    }
    public function getMissingAttendanceGivenClassIds($classIds,$minDate=null,$maxDate=null){
        $data = array();
        foreach($classIds as $classId){
           $data = array_merge($data,$this->sql->getUsersAttendanceForDateRange(null,$minDate,$maxDate,$classId));
        }
        return $this->getStudentsMissingAttendance($data,$minDate,$maxDate);
    }

    private function getStudentsMissingAttendance($data,$minDate=null,$maxDate=null){

        $this->students=array();
        $usersGroupedById = Utility::groupBy($data,function($row){
            return $row['id'];
        });

        $this->groupUserClasses($usersGroupedById);
        $this->checkAttendanceMissingDatesForUser($usersGroupedById,$minDate,$maxDate);



        return $this->students;
    }
    private function isWeekend(\DateTime $date){
        $dayOfWeek = $dw = date( "w", $date->getTimestamp());
        return $dayOfWeek==6 || $dayOfWeek ==0;
    }
    private function groupUserClasses(&$usersGroupedById){
        foreach($usersGroupedById as &$userData){
            $userData['classes']=Utility::groupBy($userData,function($row){return $row['classId'];});
        }
    }
    private function checkAttendanceMissingDatesForUser($usersGroupedById,$minDate,$maxDate){
        foreach($usersGroupedById as $userData){
            $phone = $userData[0]['phone'];
            $totalAttendance = 0;
            foreach($userData['classes'] as $classData){
                $classHasBeenDeleted = !boolval(@$classData[0]['className']);
                $userMinDate = max(new \DateTime($minDate),new \DateTime($classData[0]['dateEnrolled']));
                $checkingDates = $this->prepareDatesInRange($userMinDate,$maxDate);
                list($missingDates,$okDates) = $this->checkAttendanceMissingDatesForUserClass($classData,$checkingDates,$classHasBeenDeleted);
                $this->addUserIfNotExists($userData,$phone);
                if(count($missingDates)){
                    $this->addUserIfNotExists($userData,$phone);
                    $this->addUserClassIfNotExists($userData,$classData,$missingDates);

                }
                if(count($okDates)){

                    foreach($okDates as $date=>$time){
                        Utility::addToObjectIfNotExists($date,0,$this->students[$userData[0]['id']]['datesWithAttendance']);
                        $this->students[$userData[0]['id']]['datesWithAttendance'][$date]+=$time;
                        $totalAttendance += $time;
                    }
                    $this->students[$userData[0]['id']]['totalAttendance'] = round($totalAttendance,2);

                }
            }
            if(!count($this->students[$userData[0]['id']]['classes'])){
                unset($this->students[$userData[0]['id']]);
            }

        }
    }
    private function prepareDatesInRange($minDate,$maxDate=null){
        $lastDate = $minDate;
        $endDate = $maxDate?new \DateTime($maxDate):new \DateTime();
        $dates = array();
        while($lastDate<=$endDate){
            if(!$this->isWeekend($lastDate)){
                $dates[]=$lastDate->format('Y-m-d');
            }
            $lastDate->add(new \DateInterval('P1D'));
        }
        return $dates;
    }
    private function checkAttendanceMissingDatesForUserClass($classData,$checkingDates,$classHasBeenDeleted){
        $missingDates = $checkingDates;
        $okDates = array();
        foreach($classData as $row){
            if($row['date']){
                $i = array_search($row['date'],$missingDates);
                if($i!==false || $classHasBeenDeleted){
                    Utility::addToObjectIfNotExists($row['date'],0,$okDates);
                    $okDates[$row['date']]+=$row['attendance'];

                }
            }
        }
        foreach($okDates as $date=>$info){
            if(($i = array_search($date,$missingDates))!=false){
                unset($missingDates[$i]);
            }

        }
        return array($missingDates,$okDates);
    }
    private function addUserIfNotExists($userData,$phone){
        if(!isset($this->students[$userData[0]['id']])){
            $student = array(
                'id'=>$userData[0]['id'],
                'name'=>$userData[0]['studentName'],
                'firstName'=>$userData[0]['fname'],
                'lastName'=>$userData[0]['lname'],
                'phone'=>$phone,
                'datesWithAttendance'=>array(),
                'classes'=>array()
            );
            $this->students[$userData[0]['id']]=$student;
        }
    }

    private function addUserClassIfNotExists($userData,$classData,$missingDates){
        if(!isset($this->students[$userData[0]['id']]['classes'][$classData[0]['classId']])){
            $this->students[$userData[0]['id']]['classes'][$classData[0]['classId']]=array(
                'id'=>$classData[0]['classId'],
                'name'=>$classData[0]['className'],
                'dates'=>$missingDates
            );
        }
    }
    private function sortByClasses(){
        $this->classes = array();
        foreach($this->students as $student){
            foreach($student['classes'] as $class){
                $classId = explode('*',$class['id'])[0];
                if($this->params['classIds'] && array_search($classId,$this->params['classIds'])===false){ continue; }

                Utility::addToObjectIfNotExists($class['id'],$this->createClassFromStudentArray($class),$this->classes);
                Utility::addToObjectIfNotExists($student['id'],$this->createStudentFromStudentArray($student,$class),$this->classes[$class['id']]['students']);
            }
        }
        return $this->classes;
    }
    private function createClassFromStudentArray($class){
        unset($class['dates']);
        $class['students'] = array();
        return $class;
    }
    private function createStudentFromStudentArray($student,$class){
        unset($student['classes']);
        $student['dates']=$class['dates'];
        return $student;
    }

}
