<?php
namespace English3\Controller\AutomatedAlerts\Alerts\TargetGrade;

use Exception;

class TargetGrade{
    public $type;
    public $value;
    public function __construct($type,$value){
        $this->type = $type;
        if($type==TargetGradeType::LETTER){
            $this->value = $this->convertLetterToDbFieldName($value);
        }else{
            $this->value = $value;
        }
    }
    //example A+ -> a_plus_min
    //        C  -> c_min
    private function convertLetterToDbFieldName($letterGrade){
        $this->isValidGrade($letterGrade);
        $convertedString = $this->getFirstLetter($letterGrade);
        $convertedString.=$this->addModificatorIfNeeded($letterGrade);
        $convertedString.='_min';
        return $convertedString;

    }
    public function printableVersion(){
        if($this->type==TargetGradeType::PERCENTAGE){
            return $this->value.'%';
        }else{
            return strtoupper($this->value);
        }
    }
    private function isValidGrade($letterGrade){
        $strLen = strlen($letterGrade);
        if($strLen!=1 && $strLen!=2){
            throw new Exception("Letter grade is invalid");
        }
        $firstLetter = $this->getFirstLetter($letterGrade);
        $this->isValidLetter($firstLetter);
        $mod = $this->getModificator($letterGrade);
        $this->isValidModificator($mod);
    }

    private function getFirstLetter($letterGrade){
        return strtolower(substr($letterGrade,0,1));
    }
    private function isValidLetter($firstLetter){
        if(array_search($firstLetter,$this->acceptedLetters)===false){
            throw new Exception("Letter grade is invalid");
        }
    }
    private function addModificatorIfNeeded($letterGrade){
        $mod = $this->getModificator($letterGrade);
        if($mod=='-'){
            return '_minus';
        }
        else if($mod=='+'){
            return '_plus';
        }else return '';
    }
    private function getModificator($letterGrade){
        if(strlen($letterGrade)>1){
            return substr($letterGrade,1,1);
        }
        return '';
    }
    private function isValidModificator($mod){
        if($mod!= '-' && $mod != '+' && $mod != ''){
            throw new Exception("Letter grade is invalid");
        }
    }
    private $acceptedLetters = ['a','b','c','d'];
}
class TargetGradeExpection extends Exception{}
