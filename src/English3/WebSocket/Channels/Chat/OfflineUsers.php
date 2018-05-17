<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.31.10
 * Time: 11:10
 */

namespace English3\WebSocket\Channels\Chat;


use English3\Controller\Chat\ChatMode;
use English3\Controller\ClassesController;
use English3\Controller\SiteController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\WebSocket\Users\ConnectedUsers;

class OfflineUsers {
    private $userId;
    private $classCtrl;
    private $userCtrl;
    private $offlineUsers = array(
        'users'=>array(),
        'classes'=>array(),
        'students'=>array(),
        'teachers'=>array(),
        'sites'=>array()
    );
    public function __construct($userId){
        $this->userId = $userId;
        $this->classCtrl = new ClassesController(Utility::getInstance()->reader);
        $this->userCtrl = UserController::byId(null,$this->userId);
    }
    public function getAll(){
        $this->offlineUsers['classes'] = array_merge($this->offlineUsers['classes'],$this->offlineStudents()) ;
        $this->offlineUsers['classes'] = array_merge($this->offlineUsers['classes'],$this->offlineTeachers()) ;
        $this->groupBySite($this->offlineUsers['users']);
        return $this->offlineUsers;
    }
    private function offlineStudents(){
        $classes = $this->userCtrl->classesITeach();
        $students = $this->getOfflineUsersWithRole($classes,['students','teachers']);
        return $students;

    }
    private function offlineTeachers(){
        $classes = $this->userCtrl->classesILearn();
        $users = $this->getOfflineUsersWithRole($classes,['students','teachers'],true);
        return $users;
    }

    private function getOfflineUsersWithRole($classes,$roles,$amIStudent=false){
        $allUsersWithRole = array();
        if(gettype($roles)!=='array'){
            $roles = [$roles];
        }
        foreach($classes as $i=>$class){
            $allUsers = $this->classCtrl->getUsers($class['id']);
            foreach($roles as $role){
                if($amIStudent && $role=='students' && $class['chatMode']!= ChatMode::all){
                    continue;
                }
                $users = $allUsers[$role];
                $this->addUsers($users,$allUsersWithRole,$role);
                $classes[$i][$role] = array_filter(array_map(function($u){
                    return $u['id']==$_SESSION['USER']['ID']?null:$u['id'];
                },$users));
            }
        }
        return $this->filterOutEmptyClasses($classes,$roles);
    }
    private function addUsers($users,&$usersWithRole,$role){
        foreach($users as $user){
            if($user['id']==$_SESSION['USER']['ID']){
                continue;
            }
            Utility::addToObjectIfNotExists($user['id'],$user,$this->offlineUsers['users']);
            Utility::addToArrayIfNotExists($user['id'],$usersWithRole);
            Utility::addToArrayIfNotExists($user['id'],$this->offlineUsers[$role]);
        }
    }


    private function filterOutEmptyClasses($classes,$roles){
        return array_filter($classes,function($c) use($roles){
            $isNotEmpty = false;
            foreach ($roles as $role) {
                $isNotEmpty = ($isNotEmpty || count($c[$role])>0);
            }
            return $isNotEmpty;
        });
    }
    private function groupByUsers($classes){
        foreach($classes as $class){
            if($users = $class['students']){
                foreach($users as $user){
                    if($user['id'] != $this->userId){
                        $this->addStudent($user,$class['id']);
                    }

                }
            }
            if($users = $class['teachers']){
                foreach($users as $user){
                    if($user['id'] != $this->userId){
                        $this->addTeacher($user,$class['id']);
                    }
                }
            }
        }
        $this->offlineUsers['byUser'] = array_values($this->offlineUsers['byUser']);
    }
    private function addTeacher($user,$classId){
        $this->addUser($user);
        $this->offlineUsers['byUser'][$user['id']]['teacherFor'][] = $classId;
    }
    private function addUser($user){
        $user['teacherFor']=array();
        $user['studentFor']=array();
        $user['isOffline'] = true;
        Utility::addToObjectIfNotExists($user['id'],$user,$this->offlineUsers['byUser']);
    }
    private function addStudent($user,$classId){
        $this->addUser($user);
        $this->offlineUsers['byUser'][$user['id']]['studentFor'][] = $classId;
    }
    private function groupBySite($users){
        $sites = array();
        foreach($users as $user){
            $user['site'] = SiteController::_getSiteForUser($user['id']);
            if(!$user['site']) continue;
            Utility::addToObjectIfNotExists($user['site'],['name'=>$user['site'],'users'=>array()],$sites);
            $sites[$user['site']]['users'][] =$user['id'];

        }
        $this->offlineUsers['sites'] = $sites;
    }
}