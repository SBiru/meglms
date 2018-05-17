<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 4/21/17
 * Time: 1:48 PM
 */

namespace English3\Controller\Reports\BaseReports;


use English3\Controller\UserController;
use English3\Controller\Utility;

class StudentPagesReport
{
    protected $classId;
    protected $groupId;
    protected $orgId;
    protected $students = array();
    protected $pages = array();
    protected $labels = array();
    protected $data = array();
    protected $groupedData = array();
    protected $avg = 0;
    protected $studentIdIndexMap = array();
    protected $pageIdIndexMap = array();
    protected $queryLoadData;
    protected $valueField;

    public function __construct($classId){
        list($classId,$groupId) = Utility::splitClassGroupIds($classId);
        $this->classId = $classId;
        $this->groupId = $groupId;
        $this->prepareOrgId();
    }
    private function prepareOrgId(){
        if($this->classId=='all'){
            $this->classId=null;
            if(Utility::getInstance()->checkAdmin(null,false,false)){
                $this->orgId = null;
            }else{
                $this->orgId = $_SESSION['USER']['ORGID'];
            }
        }
    }
    public function load(){
        $data =  $this->loadData();
        $this->mapData($data);
        $this->prepareGroupsAndAverage();

        return $this->toObject();
    }
    private function loadData(){
        if($this->isAdvisor() && !Utility::getInstance()->checkAdmin(null,true,false)) {
            $user = new UserController();
            $whereUserIn = sprintf(' and u.id in (%s)', implode(',',$user->getAdviseeIds()));
            $query = sprintf($this->queryLoadData, $whereUserIn);
        }else{
            $query = sprintf($this->queryLoadData, '');
        }
        return Utility::getInstance()->reader->fetchAll($query,[
            'classId'=>$this->classId,
            'orgId'=>$this->orgId,
            'groupId'=>$this->groupId
        ]);

    }

    private function isAdvisor(){
        return Utility::isSiteAdmin() || Utility::isAdvisor();
    }
    private function mapData($data){
        foreach($data as $row){
            $student = &$this->getOrCreateStudent($row);
            $page = &$this->getOrCreatePage($row);
            $page['students'][$student['id']]=$row[$this->valueField];
            $this->addValueField($student,$row);
            $student['pages'][]=$this->pageIdIndexMap[$page['id']];
            $this->addItemsPerPage($page,$row);
        }
    }
    protected function addValueField(&$student,$row){
        $student[$this->valueField]++;
    }
    protected function addItemsPerPage(&$page,$row){
        $page['itemsPerPage'] += 1;
    }
    private function &getOrCreateStudent($row){
        $sId = $row['studentId'];
        if(!array_key_exists($sId,$this->studentIdIndexMap)){
            $this->addNewStudent($row,$sId);
        }
        return $this->students[$this->studentIdIndexMap[$sId]];
    }
    private function addNewStudent($row,$sId){
        $this->studentIdIndexMap[$sId] = count($this->students);
        $this->students[]= $this->prepareStudent($row);

    }
    private function prepareStudent($row){
        return [
            'id' => $row['studentId'],
            'first_name' => $row['fname'],
            'last_name' => $row['lname'],
            'name'=>$row['lname'].', '.$row['fname'],
            'fullName'=>$row['fname'].' '.$row['lname'],
            $this->valueField=>0,
            'pages'=>[]
        ];
    }
    private function &getOrCreatePage($row){
        $pId = $row['pageId'];
        if(!array_key_exists($pId,$this->pageIdIndexMap)){
            $this->addNewPage($row,$pId);
        }
        return $this->pages[$this->pageIdIndexMap[$pId]];
    }
    private function addNewPage($row,$pId){
        $this->pageIdIndexMap[$pId] = count($this->pages);
        $this->pages[]= $this->preparePage($row);

    }
    private function preparePage($row){
        return [
            'id' => $row['pageId'],
            'name'=> $row['pageName'],
            'students'=>array(),
            'itemsPerPage'=>0
        ];
    }

    private function prepareGroupsAndAverage(){
        $grouper = new DataGrouper($this->students,$this->valueField);
        $grouper->group();
        $this->avg = $grouper->getAvg();
        $this->groupedData = $grouper->getGroupedData();
        $this->data = $grouper->getData();
        $this->labels = $grouper->getLabels();
    }

    public function toObject(){
        return [
            'students'=>$this->students,
            'pages'=>$this->pages,
            'labels'=>$this->labels,
            'data'=>$this->data,
            'groupedData'=>$this->groupedData,
            'avg'=>$this->avg
        ];
    }



}
class DataGrouper{
    private $students;
    private $NUMBER_OF_GROUPS = 5;
    private $max=0;
    private $min=null;
    private $avg=0;
    private $distinct = [];
    private $groups = [];
    private $groupedData = [];
    private $valueField;
    public function __construct($students,$valueField)
    {
        $this->students = $students;
        $this->valueField = $valueField;
    }
    public function group(){
        $this->calculate();
        $this->createGroups();
        $this->fillGroups();
    }
    private function calculate(){
        $total = 0;
        foreach ($this->students as $s){
            $c = $s[$this->valueField];
            if($c>$this->max) $this->max = $c;
            if($c<$this->min || $this->min===null) $this->min = $c;
            $total+=$c;
            Utility::addToArrayIfNotExists($c,$this->distinct);
        }
        $this->avg = $total/count($this->students);
    }
    private function createGroups(){
        $step = round($this->max/$this->NUMBER_OF_GROUPS);
        $current = $this->min;
        do{
            $next = min($current+$step,$this->max+1);
            if($next<$this->max){
                $label = $current.' - '.$next;
                $this->groups[$label]=[
                    'min'=>$current,
                    'max'=>$next
                ];
            }else{
                $label = ' > '.$current;
                $this->groups[$label]=[
                    'min'=>$current,
                    'max'=>false
                ];
            }
            $current = $next;
            if($step==0)
                break;
        }while($current<$this->max);
    }
    private function fillGroups(){
        foreach ($this->students as $i=>$s){
            $groupLabel = $this->findGroup($s);
            Utility::addToObjectIfNotExists($groupLabel,[],$this->groupedData);
            $this->groupedData[$groupLabel][]=$i;
        }
    }
    private function findGroup($student){
        foreach ($this->groups as $label=>$g){
            if($g['max'] && $student[$this->valueField]>$g['max']){
                continue;
            }
            if($student[$this->valueField]>=$g['min']){
                return $label;
            }
        }
        return false;
    }
    public function getGroupedData(){
        return $this->groupedData;
    }
    public function getLabels(){
        return array_keys($this->groups);
    }
    public function getData(){
        return [array_map(function($l){
            if(!array_key_exists($l,$this->groupedData)) return 0;
            return count($this->groupedData[$l]);
        },$this->getLabels())];
    }
    public function getAvg(){
        return round($this->avg);
    }
}