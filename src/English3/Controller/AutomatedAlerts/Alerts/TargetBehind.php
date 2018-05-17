<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.17.6
 * Time: 08:55
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\Utility;

class TargetBehind extends Alert{
    private $classes;

    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $P = $this->params['P'];
        $T = $this->params['T'];
        return $this->getCoursesPercStudentBehindTarget($P,$T);
    }

    public function sortBy($by)
    {
        return $this->classes;
    }
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'percStudentsBehind','label'=>'% Students behind'],
        ];
    }
    public function getCoursesPercStudentBehindTarget($perc_student,$perc_behind){
        $data = Utility::getInstance()->fetch($this->queryWithFilters(),['target'=>$perc_behind,'percBehind'=>$perc_behind]);
        $this->prepareData($data);
        return $this->classes;
    }

    private function queryWithFilters(){
        if($this->params['classIds']){
            $where = sprintf(" and c.id in (%s)",implode(',',$this->params['classIds']));
        }
        else if(Utility::getInstance()->checkAdmin(null,true,false)){
            $orgId = Utility::getInstance()->fetchOne("SELECT organizationid FROM users WHERE :id",['id'=>$_SESSION['USER']['ID']]);
            $where = " and u.organizationid = ".$orgId;
        }else{
            $where = " and ua.userid = ".$_SESSION['USER']['ID'];
        }

        return sprintf($this->queryCoursesPercStudentBehindTarget,$where);
    }
    private function prepareData($data){
        $this->classes = array();
        foreach($data as $row){
            Utility::addToObjectIfNotExists($row['id'],$row,$this->classes);
        }
    }

    private $queryCoursesPercStudentBehindTarget = <<<SQL
    SELECT
      round(100*sum(if(perc_behind > :percBehind,1,0))/count(id)) as percStudentsBehind,
      id,
      name
      FROM (
        SELECT DISTINCT
            (pr.perc_expected_tasks-pr.perc_completed_tasks) perc_behind,
            c.id,
            c.name,
            u.id as userId
            FROM progress_report pr
            JOIN classes c ON pr.classid = c.id
            JOIN users u ON u.id = pr.userid
            JOIN user_classes uc on u.id = uc.userid and c.id = uc.classid
            LEFT JOIN user_guardians ug ON ug.userchildid = u.id
            LEFT JOIN users guardian ON guardian.id = ug.userid
            LEFT JOIN user_advisors ua ON ua.studentid = u.id
            LEFT JOIN users advisor ON advisor.id = ua.userid
            WHERE c.exclude_from_alerts = 0 and uc.is_student = 1 %s
       ) progress
       GROUP BY id
       HAVING percStudentsBehind > :target
SQL;

}