<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.20.3
 * Time: 16:20
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


class CalculatedSimpleGenerator {
    protected $validator;
    protected $config;
    public function __construct(CalculatedSimpleConfig $config,CalculatedSimpleValidator $validator=null){
        if(is_null($validator))
            $validator = new CalculatedSimpleValidator();
        $this->validator = $validator;
        $this->config = $config;
    }
    public function generateRandomSets(){
        $sets = array();
        while($this->config->numberOfSets>0){
            $randomParams = $this->setArrayToObject($this->generateRandomSetOfParams($this->config->params));
            $answer = $this->calculateFormulaWithSet($randomParams);
            list($range, $isValid,$error) = $this->checkAnswerRange($answer);
            $answer = is_numeric($answer)?$answer:'Error';
            $formulaWithNumbers = $this->buildSetFormula($randomParams,$answer);
            $set = $this->buildSet($randomParams,$answer,$range,$isValid,$formulaWithNumbers,$error);
            $sets[]=$set;
            $this->config->numberOfSets--;
        }
        return $sets;
    }
    public function checkAnswerRange($answer){
        $error=null;
        if(is_numeric($answer)){
            $range = $this->config->tolerance->getRange($answer);
            $isValid = Tolerance::isAnswerWithinTolerance($answer,$range);
            if($isValid){
                $error = CalculatedSimpleException::OUT_OF_RANGE;
            }
            return [$range,$isValid,$error];
        }else{
            $error = $answer;
            return [['min'=>null,'max'=>null],false,$error];
        }

    }
    private function buildSet($randomParams,$answer,$range,$isValid,$formulaWithNumbers,$error){
        return [
            'params'=>$randomParams,
            'answer'=>$answer,
            'range'=>$range,
            'isValid'=>$isValid,
            'formula'=>$formulaWithNumbers,
            'error'=>$error
        ];
    }
    public function buildSetFormula($randomParams,$answer){
        $leftSide = $this->validator->replaceParameters($this->config->formula,$randomParams);
        $formula =$leftSide. ' = '.$answer;
        return $formula;

    }
    public function calculateFormulaWithSet($randomParams){
        try{
            $answer = $this->validator->calculateFormulaWithSet($this->config->formula,$randomParams);
            return round($answer,$this->config->decimals);
        }catch(CalculatedSimpleException $e){
            return $e->getMessage();
        }
    }


    protected function generateRandomSetOfParams($params){
        return array_map(function($param){
            $param['randomNumber'] = $this->randomNumber($param);
            return $param;
        },$params);
    }
    protected function setArrayToObject($set){
        $obj = array();
        foreach($set as $paramInfo){
            $obj[$paramInfo['param']]=$paramInfo['randomNumber'];
        }
        return $obj;
    }
    private function randomNumber($param){
        $pow10 = pow(10,$param['decimals']);
        $intMin = intval($param['min']*$pow10);
        $intMax = intval($param['max']*$pow10);
        $rand = mt_rand($intMin,$intMax);
        return round($rand/$pow10,$param['decimals']);
    }
}
