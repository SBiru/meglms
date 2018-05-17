<?php
/**
 * Created by IntelliJ IDEA.
 * User: ubuntu
 * Date: 13/12/17
 * Time: 15:06
 */

namespace English3\Controller\Organization;


use English3\Controller\Classes\UserClass;
use English3\Controller\Utility;


abstract class Dashboard{
    protected $roles = [];
    protected $orgFlag = '';
    protected $orgSettings;
    protected $myRoles = [];
    public function __construct($orgSettings = null){
        $this->orgSettings = $orgSettings;
    }
    public function checkRoles(){
        $this->getMyRoles();
        foreach ($this->roles as $neededRole){
            if(in_array($neededRole,$this->myRoles)){
                return true;
            }
        }
    }
    protected function getMyRoles(){
        if(Utility::isTeacherForAny($_SESSION['USER']['ID'])){
            $this->myRoles[] = 'teacher';
        }
        if(Utility::isAdminOrOrgAdmin($_SESSION['USER']['ID'])){
            $this->myRoles[] = 'admin';
        }
        if(Utility::getInstance()->checkAdmin(null,false,false)){
            $this->myRoles[] = 'super_admin';
        }
        if(Utility::isSchoolAdmin($_SESSION['USER']['ID'])){
            $this->myRoles[] = 'school_admin';
        }

    }
    public function checkOrgFlag(){
        return boolval($this->orgSettings[$this->orgFlag]);
    }
    public abstract function dashboardSettings();
}