<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 16:04
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;

use Exception;
use Symfony\Component\Debug\ErrorHandler;

class CalculatedSimpleValidator{
    public function validateAndFindParameters($formula){
        $parameters = $this->findParametersIfAny($formula);
        return $parameters;
    }
    private function findParametersIfAny($formula){
        $parameters = $this->findParameters($formula);
        if(!count($parameters)){
            throw new CalculatedSimpleException(CalculatedSimpleException::EMPTY_SUBFORMULA);
        }
        return $parameters;
    }
    protected function findParameters($formula){
        $pattern = '/(\{[^\}]+\})/';
        preg_match_all($pattern, $formula, $matches);
        return $matches[1];
    }
    public function calculateFormulaWithSet($formula,$set){
        $formula = $this->replaceParameters($formula,$set);
        return $this->calculateFormula($formula);
    }
    public function replaceParameters($formula,$set){
        foreach($set as $param=>$value){
            $formula = str_replace($param,$value,$formula);
        }
        return $formula;
    }
    private function calculateFormula($formula){
        $result = null;
        ErrorHandler::register();
        try{
            $stringToEval = "\$result = ".$formula.';';
            eval($stringToEval);
            if($result === false || $result === null || is_nan($result)){
                throw new CalculatedSimpleException(sprintf(CalculatedSimpleException::INVALID_FORMULA,$formula));
            }
            return $result;
        }catch(Exception $e){
            if(strpos($e->getMessage(), 'Warning: ') !== false){
                $reason = str_replace('Warning: ','',$e->getMessage());
                throw new CalculatedSimpleException(sprintf(CalculatedSimpleException::INVALID_FORMULA_REASON,$formula,$reason));
            }else{
                throw new CalculatedSimpleException(sprintf(CalculatedSimpleException::INVALID_FORMULA,$formula));
            }

        }
    }
    public function findSubFormulasIfAny($formula){
        $subFormulas = $this->getSubFormulas($formula);
        return $subFormulas;
    }
    protected function getSubFormulas($formula){
        $subFormulaContainers = $this->parseSubFormulaContainers($formula);
        return $this->extractSubFormulasFromContainers($subFormulaContainers);
    }
    protected function parseSubFormulaContainers($formula){
        $pattern = '/\{(?:[^\}](?R)?)*\}/';
        preg_match_all($pattern,$formula,$matches);
        return $matches[0];

    }
    protected function extractSubFormulasFromContainers($subFormulaContainers){
        $subFormulas = array();
        foreach($subFormulaContainers as $container){
            if(!$this->validateSubFormulaContainer($container)){
                continue;
            }
            $containerLength = strlen($container);
            $subFormulas[]=substr($container,2,$containerLength-3);
        }
        return $subFormulas;
    }
    protected function validateSubFormulaContainer($container){
        return substr($container,0,2)=='{=';
    }
    public function calculateBracketFormulaWithSet($formula,$decimals,$randomParams){
        $subFormulas = $this->findSubFormulasIfAny($formula);
        foreach($subFormulas as $subFormula){
            $answer = $this->calculateFormulaWithSet($subFormula,$randomParams);
            $answer = round($answer,$decimals);
            $formula = str_replace('{='.$subFormula.'}',$answer,$formula);
        }
        return $this->replaceParameters($formula,$randomParams);
    }
}

