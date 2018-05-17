<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 4/21/17
 * Time: 7:42 AM
 */

namespace English3\Controller\Reports;


use English3\Controller\AutomatedAlerts\Alerts\NotLoggedIn;
use Symfony\Component\HttpFoundation\JsonResponse;


class HasNotLoggedIn
{
    public function load($orgId=null,$classId=null,$allGroups=false){
        if($classId){
            $classIds = [$classId];
        }else{
            $classIds = null;
        }
        $alert = new NotLoggedIn(['D'=>'beginning','orgId'=>$orgId,'classIds'=>$classIds,'allGroups'=>intval(!boolval
            ($allGroups)
        )]);
        $alert->loadAlertFromParams();
        $students = $alert->sortBy('students');
        $tableHeader = $this->tableHeader();
        return ['students'=>array_values($students),'tableHeader'=>$tableHeader];

    }
    private function tableHeader(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'createdOn','label'=>'Created on'],
        ];
    }

}