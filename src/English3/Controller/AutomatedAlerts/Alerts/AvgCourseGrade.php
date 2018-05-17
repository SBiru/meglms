<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.6
 * Time: 09:25
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\Utility;

class AvgCourseGrade extends Alert {
    private $gradeTarget;
    private $classes;
    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $this->gradeTarget = $this->params['G'];
        return $this->getCoursesWithGradeBelowTarget($this->gradeTarget);
    }

    public function sortBy($by){
        return $this->classes;
    }
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'avgGrade','label'=>'Avg. Grade'],
        ];
    }
    public function getCoursesWithGradeBelowTarget($grade){
        $data = Utility::getInstance()->fetch($this->queryWithFilters(),['grade'=>$grade]);
        $this->prepareData($data);
        return $this->classes;
    }
    private function queryWithFilters(){
        if($this->params['classIds']){
            $where = sprintf(" and c.id in (%s)",implode(',',$this->params['classIds']));
        }
        else {
            $where = '';
        }

        return sprintf($this->queryGetCoursesWithGradeBelowTarget,$where);
    }
    private function prepareData($data){
        $this->classes = array();
        foreach($data as $row){
            Utility::addToArrayIfNotExists($row,$this->classes);
        }
    }
    private $queryGetCoursesWithGradeBelowTarget = <<<SQL
    SELECT
    c.id,
    c.name,
    round(avg(perc_expected_or_completed_score)) as avgGrade
    FROM progress_report pr
    JOIN classes c ON c.id = pr.classid
    WHERE c.exclude_from_alerts=0 %s
    GROUP BY c.id
    HAVING avgGrade < :grade
SQL;

}