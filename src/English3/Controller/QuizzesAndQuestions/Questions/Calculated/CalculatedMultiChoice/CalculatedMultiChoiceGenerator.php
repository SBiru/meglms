<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.22.3
 * Time: 09:05
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice;


use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleConfig;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleException;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleGenerator;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\Tolerance;

class CalculatedMultiChoiceGenerator extends  CalculatedSimpleGenerator {
    public function __construct(CalculatedSimpleConfig $config,CalculatedMultiChoiceValidator $validator=null){
        if(is_null($validator)){
            $validator = new CalculatedMultiChoiceValidator();
        }
        parent::__construct($config,$validator);
    }
    public function generateRandomSets(){
        $sets = array();
        while($this->config->numberOfSets>0){
            $randomParams = $this->setArrayToObject($this->generateRandomSetOfParams($this->config->params));
            $sets[]=$this->calculateChoiceFormulasWithSet($randomParams);
            $this->config->numberOfSets--;
        }
        return $sets;
    }
    public function calculateChoiceFormulasWithSet($randomParams){
        $set = [
            'params'=>$randomParams,
            'choices'=>array()
        ];

        try{
            foreach($this->config->choices as $choice){
                if(!isset($choice['formula'])){
                    continue;
                }
                $finalFormula = $this->validator->calculateBracketFormulaWithSet($choice['formula'],$choice['decimals'],$randomParams);
                $setChoice = array(
                    'formula'=>$choice['formula'],
                    'answer'=>$finalFormula
                );
                $set['choices'][]=$setChoice;
            }
            $set['isValid']=true;
        }catch(CalculatedSimpleException $e){
            $set['isValid']=false;
            $set['error']=$e->getMessage();
        }
        return $set;
    }


}