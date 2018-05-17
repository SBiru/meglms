<?php
namespace English3\Controller\QuizzesAndQuestions\Questions;
use English3\Controller\QuizController;
use English3\Controller\Utility;
use Symfony\Component\Config\Definition\Exception\Exception;

abstract class Question
{
    public $properties;
    public $grader;
    public function __construct(QuestionProperties $properties =null){
        if(!is_null($properties)){
            $this->init($properties);
        }
    }
    private function init(QuestionProperties $properties){
        $this->properties = $properties;
        $this->prepareForDisplay();
        $this->initQuestionGrader();
    }
    public function initWithId($id){
        $array = Utility::getInstance()->fetchRow(
            QuestionInterfaceSQL::$getQuestionWithId,
            ['questionId'=>$id]
        );

        $properties = new QuestionProperties($array);
        $properties->options = QuizController::getQuestionOptions(Utility::getInstance()->reader,$id);
        $this->init($properties);
        return $this;
    }
    protected abstract function prepareForDisplay();
    protected abstract function initQuestionGrader();
    public function toArray(){
        return [
            'prompt'=>$this->properties->prompt,
            'extra'=>$this->properties->extra,
            'solution'=>$this->properties->solution,
            'id'=>$this->properties->id,
            'options'=>$this->properties->options,
        ];
    }



}
abstract class QuestionGraderInterface{
    public $studentResponse;
    public function setResponse($studentResponse){
        $this->$studentResponse = $studentResponse;
    }
    abstract public function isCorrect();
    abstract public function grade();
    abstract public function saveResponse();
}

class QuestionInterfaceSQL{
    public static $getQuestionWithId = <<<SQL
    SELECT * FROM questions WHERE id=:questionId
SQL;

}
?>