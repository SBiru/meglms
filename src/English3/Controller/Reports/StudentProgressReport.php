<?php
namespace English3\Controller\Reports;
use English3\Controller\GradebookController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Model\User;

class StudentProgressReport {
    private $studentId;
    private $params;
    public function __construct($studentId,$params=array()){
        $this->studentId = $studentId;
        $this->params = $params;
    }
    public function getProgressForClass($classId){
        return GradebookController::_getProgressReport($classId,$this->studentId);
    }
    public function getProgressForActiveClasses(){
        $user = UserController::byId(Utility::getInstance()->reader,$this->studentId);
        $student = $this->studentWrapper($user);
        $this->prepareUserClasses($student['classes']);
        return $student;
    }
    public function getProgressForAllClasses(){
        $student = $this->getProgressForActiveClasses();
        $user = new UserController();
        $inactiveClasses = $user->getAndInitUserClasses($student['id'],false);
        $classes = $this->prepareUserClasses($inactiveClasses,false);
        $student['classes'] = array_merge($student['classes'],$classes);
        return $student;
    }
    private function studentWrapper($user){
        return array(
            'id'=>$this->studentId,
            'fname'=>$user->user->getFirstName(),
            'lname'=>$user->user->getLastName(),
            'email'=>$user->user->getEmail(),
            'guardians'=>$user->guardiansV2,
            'classes'=>$user->classes
        );
    }
    private function prepareUserClasses(&$classes,$active=true){
        foreach($classes as $i=>&$class){
            if($teacherId = @$this->params['teacherId']){
                if(!Utility::isTeacher($teacherId,$class['id'])){
                    unset($classes[$i]);
                    continue;
                }
            }
            if(@$this->params['classId'] && $class['id']!=$this->params['classId']){
                unset($classes[$i]);
                continue;
            }
            if(!$class['isStudent']){
                unset($classes[$i]);
                continue;
            }
            GradebookController::getInstance();
            $progressReport = GradebookController::_getProgressReport($class['id'],$this->studentId,null,$active);
            $class = array_merge($class,$progressReport);
        }
        return $classes;
    }

}
