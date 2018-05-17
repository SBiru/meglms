<?php

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\UserController;
use English3\Controller\Utility;

class WithdrawnStudents extends Alert{
    private $students;
    private $days;
    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $this->days = $this->params['D']?:7;
        $this->getStudents();
    }

    public function sortBy($by)
    {
        return $this->students;
    }
    public function useOuterTable(){return true;}
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'created','label'=>'Date']
        ];
    }
    public function outerTableInfo(){
        return ['nameField'=>'name','dataField'=>'classArray'];
    }
    public function getStudents(){
        $lastAccess = date('Y-m-d', strtotime("-{$this->days} days"));
        $data = Utility::getInstance()->fetch($this->queryWithFilters(),['lastAccess'=>$lastAccess]);
        $this->prepareData($data);
        return $this->students;
    }
    private function queryWithFilters(){
        return $this->queryGetStudents;
    }
    private function getLastAccess(){
        $userId = $_SESSION['USER']['ID'];
        $lastAccess = $lastAccess = Utility::getInstance()->fetchOne('SELECT meta_value FROM user_meta WHERE userid = :userId and meta_key = "last_alert_access"',['userId'=>$userId]);
        return $lastAccess?:'2000-01-01';
    }
    private function prepareData($data){
        $this->students = array();
        foreach($data as $row){
            Utility::addToObjectIfNotExists($row['id'],$this->newStudentFromRow($row),$this->students);
            Utility::addToObjectIfNotExists($row['classId'],$this->newClassFromRow($row),$this->students[$row['id']]['classes']);
        }
    }
    private function newStudentFromRow($row){
        return [
            'id'=>$row['id'],
            'fname'=>$row['fname'],
            'lname'=>$row['lname'],
            'name'=>$row['name'],
            'classes'=>array()
        ];
    }
    private function newClassFromRow($row){
        return [
            'id'=>$row['classId'],
            'name'=>$row['className'],
            'created'=>$row['created']
        ];
    }
    private $queryGetStudents = <<<SQL
    SELECT u.id,
      u.fname,
      u.lname,
      concat(u.lname,', ',u.fname) as name,
      c.id as classId,
      c.name as className,
      uc.created
    FROM users u
    JOIN user_classes_history uc ON u.id = uc.userid
    JOIN classes c ON c.id = uc.classid
    WHERE c.exclude_from_alerts = 0 and uc.created >=  :lastAccess
SQL;

}