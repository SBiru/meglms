<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.20.6
 * Time: 11:20
 */

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\Utility;

class AvgAssignmentGrade extends Alert{

    private $assignments;
    private $classes;
    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $this->assignments = $this->params['assignments'];
        return $this->getAssignmentsWithGradeBelowTarget($this->assignments);
    }

    public function sortBy($by){
        return $this->classes;
    }
    public function useOuterTable(){return true;}
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'targetScore','label'=>'Target'],
            ['id'=>'avgGrade','label'=>'Avg. Grade'],
        ];
    }
    public function outerTableInfo(){
        return ['nameField'=>'name','dataField'=>'assignments'];
    }
    public function getAssignmentsWithGradeBelowTarget($assignments){
        $data = Utility::getInstance()->fetch($this->queryWithFilters($assignments));
        $this->prepareData($data,$assignments);
        return $this->classes;
    }
    private function queryWithFilters($assignments){
        $assignmentIds = array_map(function($assignment){
            return $assignment['id'];
        },$assignments);
        return sprintf($this->queryGetAssignmentsWithGradeBelowTarget,implode(',',$assignmentIds));
    }
    private function prepareData($data,$assignments){
        $this->classes = array();
        $indexedAssignments = $this->indexAssignments($assignments);
        foreach($data as $row){
            if(intval($row['avgGrade'])<$indexedAssignments[$row['id']]['targetScore']){
                $row['targetScore']=$indexedAssignments[$row['id']]['targetScore'];
                Utility::addToObjectIfNotExists($row['classId'],$this->newClassFromRow($row),$this->classes);
                Utility::addToArrayIfNotExists($row,$this->classes[$row['classId']]['assignments']);
            }
        }
    }
    private function indexAssignments($assignments){
        $index = array();
        foreach($assignments as $i => $assignment){
            $index[$assignment['id']] = &$assignments[$i];
        }
        return $index;
    }
    private function newClassFromRow($row){
        return [
            'id'=>$row['classId'],
            'name'=>$row['className'],
            'assignments'=>array()
        ];
    }
    private $queryGetAssignmentsWithGradeBelowTarget = <<<SQL
    SELECT
    pg.id,
    pg.name,
    c.name as className,
    c.id as classId,
    round(avg(score)*100/max_score) as avgGrade
    FROM gradebook g
    JOIN pages pg on pg.id = g.pageid
    JOIN units u on pg.unitid = u.id
    join classes c on c.courseid = u.courseid
    WHERE g.pageid in (%s)
    GROUP BY g.pageid
    ORDER BY c.name
SQL;
}