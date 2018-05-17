<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:30
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


use English3\Controller\QuizzesAndQuestions\Questions\Question;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties;
use Symfony\Component\Config\Definition\Exception\Exception;

class CalculatedSimple extends Question {
    protected $validator;
    public function __construct(QuestionProperties $properties=null, CalculatedSimpleValidator $validator=null){
        if(!$validator){
            $validator = new CalculatedSimpleValidator();
        }
        $this->validator = $validator;
        parent::__construct($properties);
    }
    protected function prepareForDisplay()
    {
        $options = json_decode($this->properties->extra,true);
        $randomSet = $this->selectRandomSet($options['sets']);
        $this->questionOptions = $options;
        $this->replacePromptParameters($randomSet['params']);


    }
    protected function selectRandomSet($availableSets){
        $randomIndex = array_rand($availableSets);
        $this->properties->extra=['setIndex'=>$randomIndex];
        return $availableSets[$randomIndex];
    }
    public function replacePromptParameters($params){
        $this->properties->originalPrompt = $this->properties->prompt;
        $this->properties->prompt = $this->validator->calculateBracketFormulaWithSet($this->properties->prompt,2, $params);
    }
    protected function initQuestionGrader()
    {
        $this->grader = new CalculatedSimpleGrader($this->properties,$this->questionOptions['sets'],$this);
    }


}
