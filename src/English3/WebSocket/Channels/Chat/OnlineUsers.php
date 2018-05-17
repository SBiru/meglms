<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.4.11
 * Time: 16:16
 */

namespace English3\WebSocket\Channels\Chat;


use English3\Controller\Chat\ChatMode;
use English3\Controller\SessionController;
use English3\Controller\SiteController;
use English3\Controller\UserController;
use English3\Controller\Utility;
use English3\Controller\Chat\ChatApi;
use English3\WebSocket\AdvisoryTopics\ConsumerQueue;
use English3\WebSocket\Users\ConnectedUsers;

class OnlineUsers{
    private $forUser;
    private $advisoryTopic;
    private $onlineUserIds;
    private $teachers;
    private $students;
    private $users;
    private $classes;
    private $sites;
    public function __construct(UserController $forUser,ConsumerQueue $advisoryTopic){
        $this->forUser  = $forUser;
        $this->advisoryTopic  = $advisoryTopic;
    }
    public function buildOnlineUsers()
    {
        if($this->forUser->amIAdvisor()){
            $this->buildForAdvisor();
        }else{
            $this->buildForStudentAndTeachers();
        }

    }
    private function buildForAdvisor(){
        $onlineUserIds = [];
        $teachers = [];
        $students = [];
        $users = [];
        $classes = [];
        $sites = [];

        foreach($this->advisoryTopic->getSubscriptions() as $connectedUserId=>$connectionIds){
            if($this->forUser->user->getUserId()==$connectedUserId || !$this->isMyAdvisee($connectedUserId)) continue;
            $user = ConnectedUsers::getWithId($connectedUserId);

            if(!$user || $user->hideFromOthers()) continue;

            $userModel = $user->getUserModel();
            Utility::addToObjectIfNotExists($userModel->getUserId(),$this->prepareUser($userModel),$users);
            Utility::addToArrayIfNotExists($connectedUserId,$students);
            $onlineUserIds[]=$connectedUserId;
            Utility::addToObjectIfNotExists('all',$this->prepareClass(['id'=>'all','name'=>'All']),$classes);
            foreach($this->forUser->classesITeach() as $class){
                $userInfo = $user->getUserInfo();
                if($userInfo->amIStudentFor($class['id'])){
                    Utility::addToObjectIfNotExists($class['id'],$this->prepareClass($class),$classes);
                    Utility::addToArrayIfNotExists($connectedUserId,$classes[$class['id']]['students']);

                }else{
                    Utility::addToArrayIfNotExists($connectedUserId,$classes['all']['students']);
                }
            }

            $users[$connectedUserId]['isStudent']=true;

            Utility::addToObjectIfNotExists($users[$userModel->getUserId()]['site'],['name'=>$users[$connectedUserId]['site'],'id'=>$users[$connectedUserId]['site'],'users'=>[]],$sites);
            Utility::addToArrayIfNotExists($connectedUserId,$sites[$users[$connectedUserId]['site']]['users']);
        }


        $this->onlineUserIds = $onlineUserIds;
        $this->teachers = $teachers;
        $this->students = $students;
        $this->classes = $classes;
        $this->sites = $sites;
        $this->users = $users;

    }
    private function isMyAdvisee($studentId){
        return in_array($studentId, array_map(function($a){
            return $a['id'];
        },$this->forUser->advisees));
    }
    private function buildForStudentAndTeachers(){
        $onlineUserIds = [];
        $teachers = [];
        $students = [];
        $users = [];
        $classes = [];
        $sites = [];

        foreach($this->advisoryTopic->getSubscriptions() as $connectedUserId=>$connectionIds){
            if($this->forUser->user->getUserId()==$connectedUserId) {
                continue;
            }
            $user = ConnectedUsers::getWithId($connectedUserId);

            if(!$user || $user->hideFromOthers()) continue;

            $userModel = $user->getUserModel();
            $connectedUser = $user->getUserInfo();
            foreach($this->forUser->classes as $class) {
                if($class['chatMode'] == ChatMode::disabled) continue;
                Utility::addToObjectIfNotExists($class['id'], $this->prepareClass($class), $classes);
                $this->checkAndPrepareUserRoles($connectedUser, $connectedUserId, $class, $userModel, $classes, $users,$onlineUserIds,$students,$teachers);
            }
            $this->checkAndPrepareUserSite($connectedUserId,$userModel,$users,$teachers);
        }
        $this->onlineUserIds = $onlineUserIds;
        $this->teachers = $teachers;
        $this->students = $students;
        $this->classes = $classes;
        $this->sites = $sites;
        $this->users = $users;
    }
    private function checkAndPrepareUserRoles($connectedUser,$connectedUserId,$class,$userModel,&$classes,&$users,&$onlineUserIds,&$students,&$teachers){
        $this->checkAndPrepareStudent($connectedUser,$connectedUserId,$class,$userModel,$classes,$users,$onlineUserIds,$students);
        $this->checkAndPrepareTeacher($connectedUser,$connectedUserId,$class,$userModel,$classes,$users,$onlineUserIds,$teachers);
    }
    private function checkAndPrepareStudent($connectedUser,$connectedUserId,$class,$userModel,&$classes,&$users,&$onlineUserIds,&$students){
        $isCheckedUserStudent = $this->hasRole('isStudent',$connectedUser,$class['id']);
        $canTalkToOtherStudent = $this->canTalkToOtherStudent($class['isStudent'],$class['chatMode']);
        if($isCheckedUserStudent && $canTalkToOtherStudent){
            Utility::addToArrayIfNotExists($connectedUserId,$students);
            Utility::addToArrayIfNotExists($connectedUserId,$classes[$class['id']]['students']);
            if(!array_key_exists($userModel->getUserId(),$users)){
                Utility::addToObjectIfNotExists($userModel->getUserId(),$this->prepareUser($userModel),$users);
                Utility::addToArrayIfNotExists($connectedUserId,$onlineUserIds);
            }
            $users[$userModel->getUserId()]['canViewCurrentJob'] = (@$users[$userModel->getUserId()]['canViewCurrentJob'] || !$class['isStudent']);
        }
    }
    private function canTalkToOtherStudent($amIStudent,$classChatMode){
        return !$amIStudent || $classChatMode == ChatMode::all;
    }
    private function checkAndPrepareTeacher($connectedUser,$connectedUserId,$class,$userModel,&$classes,&$users,&$onlineUserIds,&$teachers){
        $isCheckedUserTeacher = $this->hasRole('isTeacher',$connectedUser,$class['id']);
        if($isCheckedUserTeacher){
            Utility::addToArrayIfNotExists($connectedUserId,$teachers);
            Utility::addToArrayIfNotExists($connectedUserId,$classes[$class['id']]['teachers']);
            if(!array_key_exists($userModel->getUserId(),$users)){
                Utility::addToObjectIfNotExists($userModel->getUserId(),$this->prepareUser($userModel),$users);
                Utility::addToArrayIfNotExists($connectedUserId,$onlineUserIds);
            }
            $users[$userModel->getUserId()]['canViewCurrentJob'] = true;
        }
    }
    private function checkAndPrepareUserSite($connectedUserId,$userModel,&$users,&$teachers){
        if(array_key_exists($userModel->getUserId(),$users)){
            Utility::addToObjectIfNotExists($users[$userModel->getUserId()]['site'],['name'=>$users[$connectedUserId]['site'],'id'=>$users[$connectedUserId]['site'],'users'=>[]],$sites);
            Utility::addToArrayIfNotExists($connectedUserId,$sites[$users[$connectedUserId]['site']]['users']);
            $users[$connectedUserId]['isTeacher']=array_search($connectedUserId,$teachers)!==false;
            $users[$connectedUserId]['isStudent']=!$users[$connectedUserId]['isTeacher'];
        }
    }
    private function hasRole($role,$userId,$classId){
        return call_user_func(array($userId,$role),$classId,false);
    }
    private function prepareUser($userModel){
        $user = Chat::prepareUser($userModel);
        $user['loggedInSince'] = SessionController::loggedInSince($user['id']);
        $user['site'] = SiteController::_getSiteForUser($user['id']);
        return $user;
    }
    private function prepareClass($class){
        return [
            'id'=>$class['id'],
            'name'=>$class['name'],
            'canTalkToStudents'=>$class['chatMode'] == ChatMode::all,
            'teachers'=>[],
            'students'=>[]
        ];
    }
    public function getOnlineUsers(){
        return [
            'teachers'=>$this->teachers,
            'students'=>$this->students,
            'classes'=>$this->classes,
            'users'=>$this->users,
            'sites'=>$this->sites,
            'onlineUserIds'=>$this->onlineUserIds
        ];
    }
}