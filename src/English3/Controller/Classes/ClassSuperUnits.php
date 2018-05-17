<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.18.4
 * Time: 15:46
 */

namespace English3\Controller\Classes;


use English3\Controller\ClassesController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ClassSuperUnits {
    private $class;

    public function __construct($classId=null){
        if($classId){
            $this->init($classId);
        }

    }
    private function init($classId){
        $this->class = new ClassDB($classId);
    }

    public function getSuperUnitsReq(Request $req,$classId){
        $this->init($classId);
        return new JsonResponse($this->getSuperUnits());
    }
    public function isUsingSuperUnits(){
        return boolval($this->class['use_super_units']);
    }

    public function allowSuperUnits(){
        $units = $this->getSuperUnits();
        if(!count($units)){
            $this->setupDefaultSuperUnit();
        }
        $this->class->data['use_super_units'] = true;
        $this->class->update();
    }
    public function getSuperUnits(){
        $superUnits = array_map(function($u){

            $unit = new SuperUnitDB($u);
            $unit->prepareForDisplay();
            return $unit->data;


        },Utility::getInstance()->fetch(ClassSuperUnitsDB::$queryGetSuperUnits,['classId'=>$this->class->data['id']]));
        return $superUnits;
    }
    public function disableSuperUnits(){
        $this->class->data['use_super_units'] = false;
        $this->class->update();
    }
    private function setupDefaultSuperUnit(){
        $id = $this->createDefaultSuperUnit();
        $this->associateClassUnitsToDefaultSuperUnit($id);
    }
    private function createDefaultSuperUnit(){
        return ClassSuperUnitsDB::createSuperUnit($this->class->data['id'],'Default super unit');
    }
    private function associateClassUnitsToDefaultSuperUnit($id){
        $units = ClassesController::_getUnitsByClassId($this->class->data['id']);
        $units = array_map(function($u){
            return $u['id'];
        },$units);
        ClassSuperUnitsDB::addUnitsToSuperUnit($units,$id);
    }
    public function addUnitsToSuperUnit(array $units,$superUnitId){
        ClassSuperUnitsDB::addUnitsToSuperUnit($units,$superUnitId);
    }
}

class ClassSuperUnitsDB{
    public static function addUnitsToSuperUnit(array $units,$superUnitId){
        $values = array();
        foreach($units as $unitId){
            $values[]= sprintf('(%s,%s)',$superUnitId,$unitId);
        }

        $query = sprintf("INSERT INTO units (superunitid,id) values %s ON DUPLICATE KEY UPDATE superunitid = values(superunitid)",implode(',',$values));
        Utility::getInstance()->insert($query);
    }
    public static function maxUnitPosition($superUnitId){
        return Utility::getInstance()->fetchOne("SELECT max(name) FROM units WHERE superunitid = :superUnitId",['superUnitId'=>$superUnitId]);

    }
    public static function createSuperUnit($classId,$name){
        Utility::getInstance()->reader->insert(
            'super_units',
            [
                'classid'=>$classId,
                'name'=>$name
            ]
        );
        return Utility::getInstance()->reader->lastInsertId();
    }
    public static $queryGetSuperUnits = <<<SQL
    SELECT su.* FROM super_units su WHERE su.classid = :classId order by position
SQL;

}