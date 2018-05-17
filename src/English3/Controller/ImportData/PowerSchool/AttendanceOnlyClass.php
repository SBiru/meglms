<?php
namespace English3\Controller\ImportData\PowerSchool;
use English3\Controller\Utility;

class AttendanceOnlyClass extends AttendanceOnlyClassSQL{
    private $externalId;
    private $paramenters;
    public static function initWithExternalId($externalId){
        $classData = self::getClassWithExternalId($externalId);
        $instance = new self($externalId,$classData);
        return $instance;
    }
    private function __construct($externalId,array $parameters = null){
        $this->externalId = $externalId;
        if(!is_null($parameters)){
            $this->setParameters($parameters);
        }
    }
    private function setParameters(array $parameters){
        $this->paramenters = new AttendanceOnlyClassParameters(
            $parameters['id'],
            $parameters['name'],
            $parameters['created'],
            $parameters['department_id']
        );
    }
    public function classExists(){
        return !is_null($this->paramenters);
    }
    public function createOrUpdateClass($externalId,$departmentId,$name){
        if($this->classExists()){
            return self::updateClass($this->paramenters->id,$name,$departmentId);
        }else{
            return self::createClass($externalId,$name,$departmentId);
        }
    }
}
class AttendanceOnlyClassParameters{
    public $id;
    public $name;
    public $createdOn;
    public $departmentId;
    public function __construct($id,$name,$createdOn,$departmentId){
        $this->id = $id;
        $this->name = $name;
        $this->createdOn = $createdOn;
        $this->departmentId = $departmentId;
    }
}
class AttendanceOnlyClassSQL{
    protected static function getClassWithExternalId($externalId){
        return Utility::getInstance()->fetchRow(self::$queryGetClassWithExternalId,['externalId'=>$externalId]);
    }
    protected static function updateClass($id,$name,$departmentId){
        Utility::getInstance()->reader->update(
            'attendance_only_classes',
            [
                'name'=>$name,
                'department_id'=>$departmentId
            ],
            ['id'=>$id]
        );
        return $id;
    }
    protected static function createClass($externalId,$name,$departmentId){
        Utility::getInstance()->reader->insert(
            'attendance_only_classes',
            [
                'external_id'=>$externalId,
                'name'=>$name,
                'department_id'=>$departmentId
            ]
        );
        return Utility::getInstance()->reader->lastInsertId();
    }
    private static $queryGetClassWithExternalId = <<<SQL
    SELECT * FROM attendance_only_classes WHERE external_id = :externalId

SQL;
    public static $queryGetClassWithId = <<<SQL
    SELECT * FROM attendance_only_classes WHERE id = :id
SQL;

}