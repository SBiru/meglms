<?php
namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimple;
use English3\Controller\QuizzesAndQuestions\Questions\Question;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties;

class CalculatedMultiChoice extends CalculatedSimple {
    public function __construct(QuestionProperties $properties=null,CalculatedMultiChoiceValidator $validator = null){
        if(!$validator){
            $validator = new CalculatedMultiChoiceValidator();
        }
        parent::__construct($properties,$validator);
    }
    public function prepareForDisplay(){
        $options = json_decode($this->properties->extra,true);
        $randomSet = $this->selectRandomSet($options['sets']);
        $this->replacePlaceHolders($randomSet);
        $this->questionOptions = $options;
    }
    public function replacePlaceHolders($set){
        $this->replacePromptParameters($set['params']);
        $this->replaceChoiceTexts($set);
    }
    private function replaceChoiceTexts($set){
        foreach($this->properties->options as $i=>&$choice){
            $choice['text'] = $set['choices'][$i]['answer'];
        }
    }
    protected function initQuestionGrader()
    {
        $this->grader = new CalculatedMultiChoiceGrader($this->properties,$this->questionOptions['sets'],$this);
    }
}