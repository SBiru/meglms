<?php

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\UserController;
use English3\Controller\Utility;

class NewStudents extends Alert{
    private $students;
    private $days;
    public function __construct($params){
        parent::__construct($params);
    }
    public function loadAlertFromParams()
    {
        $this->days = $this->params['D']?:7;
        $this->getNewStudents();
    }

    public function sortBy($by)
    {
        return $this->students;
    }
    public function innerTableInfo(){
        return [
            ['id'=>'name','label'=>'Name'],
            ['id'=>'created','label'=>'Created date']
        ];
    }
    public function getNewStudents(){
        $lastAccess = date('Y-m-d', strtotime("-{$this->days} days"));
        $data = Utility::getInstance()->fetch($this->queryWithFilters(),['lastAccess'=>$lastAccess]);
        $this->prepareData($data);
        return $this->students;
    }
    private function queryWithFilters(){
        return $this->queryGetNewUsers;
    }
    private function getLastAccess(){
        $userId = $_SESSION['USER']['ID'];
        $lastAccess = $lastAccess = Utility::getInstance()->fetchOne('SELECT meta_value FROM user_meta WHERE userid = :userId and meta_key = "last_alert_access"',['userId'=>$userId]);
        return $lastAccess?:'2000-01-01';
    }
    private function prepareData($data){
        $this->students = $data;
    }
    private $queryGetNewUsers = <<<SQL
    SELECT u.id,
      concat(u.lname,', ',u.fname) as name,
      u.created
    FROM users u
    left join user_guardians g on g.userid = u.id
    WHERE u.created >=  :lastAccess and g.id is null
    order by u.created desc
SQL;

}