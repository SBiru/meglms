<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:32
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice;

use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class CalculatedMultiChoiceGrader extends QuestionGrader{
    private $sets;
    private $answer;
    private $setUsedInQuestion;
    private $question;
    public function __construct($properties,$sets,CalculatedMultiChoice $question){
        parent::__construct($properties);
        $this->sets=$sets;
        $this->question = $question;
    }
    public function getGradePercent(){
        $this->prepareSelectedSetAndAnswer();
        return intval($this->answer == $this->properties->solution);
    }
    private function prepareSelectedSetAndAnswer(){
        $setIndex = $this->studentResponse['setIndex'];
        $this->setUsedInQuestion = $this->sets[$setIndex];
        $this->answer = $this->studentResponse['answer'];
    }
    public function formatResponse(){
        return json_encode($this->studentResponse);
    }
    public function prepareForDisplay(){
        $this->properties->prompt=$this->properties->originalPrompt;
        $this->prepareSelectedSetAndAnswer();
        $this->question->replacePlaceHolders($this->setUsedInQuestion);
        return [
            'response'=>$this->answer,
            'options'=>$this->properties->options,
            'prompt'=>$this->properties->prompt,
            'isCorrect'=>boolval($this->getGradePercent())
        ];
    }
    public function setStudentResponse($response){
        parent::setStudentResponse(json_decode(json_encode($response),true));
    }
}