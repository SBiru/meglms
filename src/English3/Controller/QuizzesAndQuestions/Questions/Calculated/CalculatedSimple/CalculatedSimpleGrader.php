<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:32
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class CalculatedSimpleGrader extends QuestionGrader{
    private $sets;
    private $answer;
    private $setUsedInQuestion;
    private $question;
    public function __construct($properties,$sets,CalculatedSimple $question){
        parent::__construct($properties);
        $this->sets=$sets;
        $this->question = $question;
    }
    public function getGradePercent(){
        $this->prepareSelectedSetAndAnswer();
        if(!is_numeric($this->answer)){
            return 0;
        }else{
            $this->answer=floatval($this->answer);
        }
        $isCorrect = Tolerance::isAnswerWithinTolerance($this->answer,$this->setUsedInQuestion['range']);
        return intval($isCorrect);
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
        $this->prepareSelectedSetAndAnswer();
        $this->properties->prompt = $this->properties->originalPrompt;
        $this->question->replacePromptParameters($this->setUsedInQuestion['params']);
        return [
            'response'=>$this->answer,
            'prompt'=>$this->properties->prompt,
            'isCorrect'=>boolval($this->getGradePercent()),
            'correctAnswer'=>boolval($_REQUEST['isGraderView'])?$this->setUsedInQuestion['answer']:null
        ];
    }
    public function setStudentResponse($response){
        parent::setStudentResponse(json_decode(json_encode($response),true));
    }
}