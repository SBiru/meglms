<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails;
use English3\Controller\AutomatedAlerts\AutomatedEmails\BaseAlertEmail;
use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\BehindInCoursesTemplate;
use English3\Controller\AutomatedAlerts\Alerts\BehindInCourses;

use English3\Controller\ClassesController;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Utility;
use Exception;

class BehindInCoursesEmail extends BaseAlertEmail {
    private $percBehind;
    private $percBehindMax;
    private $alertObj;
    private $cachedClassTeachers = array();
    private $classCtrl;

    public function __construct($orgId,$percBehind=15,$percBehindMax=null,$testVersion=true,$preview=false){
        $this->classCtrl = new ClassesController(Utility::getInstance()->reader);
        $this->setPercBehind($percBehind);
        $this->setPercBehindMax($percBehindMax);
        $this->alertObj = new BehindInCourses(['x'=>$percBehind,'orgId'=>$orgId]);
        $this->preview = $preview;
        parent::__construct($orgId,'Students behind in courses',$testVersion);

    }
    public function setPercBehind($percBehind){
        $this->percBehind=$percBehind;
    }
    public function setPercBehindMax($percBehindMax){
        $this->percBehindMax=$percBehindMax;
    }
    public function getStudents(){
        if($this->preview){
            return $this->students = $this->previewMockStudents();
        }
        $this->students = $this->alertObj->studentsBehindByGivenPercent($this->percBehind,$this->orgId);
    }


    public function emailUser($email){
        $this->checkIfStudentsAreLoaded();
        $mailMessage = new behindInCoursesTemplate($this->orgId,['name'=>'','email'=>$email],$this->students,$this->percBehind,'customEmail',$this->options);
        if($this->preview){
            $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
        }
        $this->sendEmail($mailMessage);
    }
    public function emailTeachers(){
        $this->checkIfStudentsAreLoaded();
        $teachers = $this->buildTeachersData();
        $count = 0;
        foreach($teachers as $teacher){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            if($this->preview){
                $teacher['name']='Teacher Demo';
            }
            $mailMessage = new behindInCoursesTemplate($this->orgId,$teacher,$teacher['classes'],$this->percBehind,'teacher',$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }
    private function buildTeachersData(){
        $teachers = array();
        foreach($this->students as $student){
            foreach($student['classes'] as $classId=>$class){
                $classTeachers = $this->getTeachersForClass($classId);
                foreach($classTeachers as $teacher){
                    Utility::addToObjectIfNotExists($teacher['id'],['classes'=>array(),'name'=>$teacher['firstName'].' '.$teacher['lastName']],$teachers);
                    Utility::addToObjectIfNotExists($classId,['name'=>$class['name'],'students'=>array()],$teachers[$teacher['id']]['classes']);
                    $teachers[$teacher['id']]['classes'][$classId]['students'][]=array_merge($class,['name'=>$student['fullName']]);
                }
            }
        }
        return $teachers;
    }
    private function getTeachersForClass($id){
        Utility::addToObjectIfNotExists($id,$this->classCtrl->getUsers($id)['teachers'],$this->cachedClassTeachers);
        return $this->cachedClassTeachers[$id];
    }
    public function emailStudents(){
        $this->checkIfStudentsAreLoaded();
        $count = 0;
        foreach($this->students as $student){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new behindInCoursesTemplate($this->orgId,$student,[$student],$this->percBehind,'student',$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }
    public function emailAdmins(){
        $admins = OrganizationController::_getAdmins($this->orgId);
        $count = 0;
        foreach($admins as $admin){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new behindInCoursesTemplate($this->orgId,['name'=>$admin['fname'].' '.$admin['lname']],$this->students,$this->percBehind,'admin',$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }

    protected function sendEmailToParentsOrAdvisors($addressees,$role){
        $count = 0;
        foreach($addressees as $addressee){
            if($count == $this->testLimit){
                break;
            }
            $count++;
            $mailMessage = new behindInCoursesTemplate($this->orgId,$addressee,$addressee['students'],$this->percBehind,$role,$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
    }

    protected function prepareAddressees($type='parents'){
        $addressees = array();
        foreach($this->students as $student){
            foreach($student[$type] as $addressee){
                $this->createAddresseeIfNotExists($addressees,$addressee);
                $this->addStudentToAddressee($addressees[$addressee['id']],$student);
            }
        }
        return $addressees;
    }
    private function previewMockStudents(){
        return [
            24=>[
                'id'=>24,
                'first_name'=>'Student',
                'last_name'=>'Demo',
                'name'=>'Demo, Student',
                'fullName'=>'Student Demo',
                'advisors'=>[
                    [
                        'id'=>1,
                        'name'=>'Advisor Demo',
                        'email'=>'demo@advisor.com'
                    ]
                ],
                'parents'=>[
                    [
                        'id'=>1,
                        'name'=>'Parent Demo',
                        'email'=>'demo@parent.com'
                    ]
                ],
                'classes'=>[
                    405=>[
                        'name'=>'6th Grade English',
                        'percBehind'=>'100',
                        'percExpectedTasks'=>'100',
                        'percCompletedTasks'=>'0',
                        'lastTimeWorked'=>"1969-12-31 21:00:00"
                    ]
                ]
            ]
        ];
    }

}