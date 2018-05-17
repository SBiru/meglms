<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.22.3
 * Time: 08:35
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice;


use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleException;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleValidator;
use English3\Controller\Utility;
use Symfony\Component\Debug\ErrorHandler;

class CalculatedMultiChoiceValidator extends CalculatedSimpleValidator {
    public function validateAndFindParameters($choices){
        $parameters = array();
        foreach($choices as $choice){
            $formula = $choice['formula'];
            if(!$formula){
                continue;
            }
            $choiceParams = $this->validateAndFindParametersPerChoice($formula);
            $parameters = array_unique(array_merge($parameters,$choiceParams));
        }
        if(!count($parameters)){
            throw new CalculatedSimpleException(CalculatedSimpleException::EMPTY_PARAMETERS);
        }
        return $parameters;
    }
    public function validateAndFindParametersPerChoice($formula){
        $subFormulas = $this->findSubFormulasIfAny($formula);
        $parameters = $this->findParametersIfAny($subFormulas);
        return $parameters;
    }


    private function findParametersIfAny($subFormulas){
        $parameters = $this->findParameters($subFormulas);
        return $parameters;
    }
    protected function findParameters($subFormulas){
        $parameters = [];
        foreach($subFormulas as $subFormula ){
            $subFormulaParams = CalculatedSimpleValidator::findParameters($subFormula);
            foreach($subFormulaParams as $param){
                Utility::addToArrayIfNotExists($param,$parameters);
            }
        }
        return $parameters;
    }


}