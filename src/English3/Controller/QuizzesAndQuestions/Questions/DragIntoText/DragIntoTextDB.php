<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.3
 * Time: 13:35
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\DragIntoText;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionDB;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionDBException;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties;

class DragIntoTextDB extends QuestionDB{
    private $question;
    public function __construct(QuestionProperties $properties){
        parent::__construct($properties);
        $this->question = new DragIntoText(null);
    }
    protected function prepareForSaveInDB()
    {
        $this->checkChoices();
    }
    private function checkChoices(){
        $placeHolders = DragIntoText::parsePrompt($this->properties->prompt);
        if(!count($placeHolders)){
            throw new QuestionDBException($this->EMPTY_PLACEHOLDERS);
        }
        $this->validatePlaceHolders($placeHolders);
    }
    private function validatePlaceHolders($placeHolders){
        foreach($placeHolders as&$placeHolder){
            $placeHolder = $this->checkIsInteger($placeHolder);
            $this->checkChoiceExists($placeHolder);
        }
    }
    private function checkIsInteger($placeHolder){
        if(intval($placeHolder)==0){
            throw new QuestionDBException(sprintf($this->INVALID_PLACEHODER,$placeHolder));
        }
        return intval($placeHolder);
    }
    private function checkChoiceExists($placeHolder){
        if(is_null(@$this->properties->options[$placeHolder-1]) || @$this->properties->options[$placeHolder-1]==''){
            throw new QuestionDBException(sprintf($this->INVALID_PLACEHODER,$placeHolder));
        }
    }
    protected function type(){
        return 'dragintotext';
    }

    private $INVALID_PLACEHODER = "[[%s]] is not a valid placeholder. It must be a number representing one of the valid choices";
    private $EMPTY_PLACEHOLDERS = "Make sure you have at least one place holder in the prompt. Ex: [[1]]";

}