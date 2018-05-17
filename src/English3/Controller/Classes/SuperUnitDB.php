<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.4
 * Time: 13:39
 */

namespace English3\Controller\Classes;


use Doctrine\DBAL\Exception\DriverException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use English3\Controller\PageController;

use English3\Controller\Utility;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class SuperUnitDB {
    public $data;
    public function __construct($data){
        $this->data = $data;
    }
    public static function fromId($id){
        return new self(Utility::getInstance()->fetchRow(SuperUnitSQL::$queryGetSuperUnit,['id'=>$id]));
    }

    public function prepareForDisplay(){

        $this->data['required_pages']= json_decode($this->data['required_pages'],true);
        $this->data['hide_from_student'] = boolval($this->data['hide_from_student']);
        $this->data['position'] = intval($this->data['position']);
    }
    public function save($newData){
        $this->removeNonAllowedFields($newData);
        $this->prepareForSave($newData);
        if($this->data['id']){
            $this->update($newData);
        }else{
            $this->checkRequiredFields($newData);
            $this->insert($newData);
        }
    }
    private function removeNonAllowedFields(&$data){
        foreach($data as $key=>$value){
            if(in_array($key,$this->allowedFields)===false){
                unset($data[$key]);
            }
        }
    }
    private function prepareForSave(&$data){
        $data['required_pages'] = array_map(function($p){
            return [
                'id'=>$p['id'],
                'minimumCompletion'=>$p['minimumCompletion'],
                'label'=>$p['label'],
                'superUnitName'=>$p['superUnitName']
            ];
        },$data['required_pages']);
        $data['required_pages']=json_encode($data['required_pages']);
    }
    private function update($newData){
        foreach($this->data as $key=>&$value){
            if(isset($newData[$key])){
                $value = $newData[$key];
            }
        }
        try{
            Utility::getInstance()->reader->update(
                'super_units',
                $this->data,
                ['id'=>$this->data['id']]
            );
        }catch(DriverException $e){
            $this->insertOrUpdateException($e);
        }

    }
    private function insertOrUpdateException(DriverException $e){
        if($e->getSQLState()==23000 && $e->getErrorCode()==1062){
            preg_match("/.* key '(.*)'/",$e->getMessage(),$matches);
            throw new SuperUnitException(sprintf('Duplicated %s',$matches[1]));
        }
    }
    private function checkRequiredFields($data){
        try{
            Utility::getInstance()->checkRequiredFields($this->requiredFields,$data,true);
        }catch(\Exception $e){
            throw new SuperUnitException($e->getMessage());
        }

    }

    private function insert($data){
        try{
            Utility::getInstance()->reader->insert(
                'super_units',
                $data
            );
        }catch(DriverException $e){
            $this->insertOrUpdateException($e);
        }
        $this->data = Utility::getInstance()->fetchRow(SuperUnitSQL::$queryGetSuperUnit,['id'=>Utility::getInstance()->reader->lastInsertId()]);
    }

    public function delete(){
        if(!$this->data['id']){
            return;
        }
        Utility::getInstance()->reader->delete(
            'super_units',
            ['id'=>$this->data['id']]
        );
        Utility::getInstance()->reader->delete(
            'unit_superunits',
            ['superunitid'=>$this->data['id']]
        );
    }
    private $allowedFields = ['id','name','classid','position','hide_from_student','required_pages'];
    private $requiredFields = ['name','classid','position'];
}
class SuperUnitException extends Exception{};
class SuperUnitSQL{
    public static $queryGetSuperUnit = <<<SQL
    SELECT * FROM super_units WHERE id = :id
SQL;

}