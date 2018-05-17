<?php
namespace English3\Controller\QuizzesAndQuestions\Questions;
use English3\Controller\Utility;
use Exception;

abstract class QuestionDB {
    protected $properties;

    public function __construct(QuestionProperties $properties){
        $this->properties = $properties;
    }
    public function isSavedToDb(){
        return !is_null($this->properties->id);
    }

    public function save(){
        $this->prepareForSaveInDB_();
        if($this->isSavedToDb()){
            return $this->update();
        }else{
            return $this->create();
        }
    }
    private function prepareForSaveInDB_(){
        $this->checkPrompt();
        $this->prepareForSaveInDB();
    }
    protected abstract function prepareForSaveInDB();
    private function update(){
        Utility::getInstance()->reader->update(
            'questions',
            $this->propertiesArray(),
            ['id'=>$this->properties->id]
        );
        $this->saveQuestionOptions();
        return $this->properties->id;
    }
    private function create(){
        Utility::getInstance()->reader->insert(
            'questions',
            $this->propertiesArray()
        );
        $this->properties->id = Utility::getInstance()->reader->lastInsertId();
        $this->saveQuestionOptions();
        return $this->properties->id;
    }
    protected function propertiesArray(){
        return [
            'extra'=>json_encode(@$this->properties->extra),
            'type'=>$this->type(),
            'options'=>json_encode($this->properties->options),
            'prompt'=>$this->properties->prompt,
            'solution'=>(string)@$this->properties->solution,
            'feedback'=>'',
            'modified_by'=>$_SESSION['USER']['ID'],
            'max_points'=>intval($this->properties->points)
        ];
    }
    private function saveQuestionOptions(){
        $this->deleteQuestionOptions();
        $this->insertQuestionOptions();
    }
    private function deleteQuestionOptions(){
        Utility::getInstance()->reader->delete(
            'question_options',
            ['question_id'=>$this->properties->id]
        );
    }
    private function insertQuestionOptions(){
        foreach($this->properties->options as $i=>$option){
            Utility::getInstance()->reader->insert(
                'question_options',
                [
                    'question_id'=>$this->properties->id,
                    'text'=>$option,
                    'sort_order'=>$i
                ]
            );
        }
    }
    abstract protected function type();

    public function delete(){
        $this->deleteQuestionEntry();
        $this->deleteQuestionOptions();
        $this->deleteBankEntry();
        $this->deleteQuizEntry();
    }
    private function deleteQuestionEntry(){
        if(!$this->properties->id){
            throw new Exception("Must provide a question id");
        }
        Utility::getInstance()->insert(
            QuestionDBSQL::$deleteQuestionWithId,
            ['questionId'=>$this->properties->id]
        );
    }
    private function checkPrompt(){
        if(!(@$this->properties->prompt)){
            throw new QuestionDBException(QuestionDBException::PROMPT_IS_MISSING);
        }
    }
    private function deleteBankEntry(){}
    private function deleteQuizEntry(){}

}
class QuestionDBSQL{
    public static $deleteQuestionWithId = <<<SQL
    DELETE questions WHERE id=:questionId
SQL;
}
