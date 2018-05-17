<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.3
 * Time: 13:35
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Autograded;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionDB;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionDBException;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionProperties;

class AutogradedDB extends QuestionDB{
    private $question;
    public function __construct(QuestionProperties $properties){
        parent::__construct($properties);
        $this->question = new Autograded(null);
    }
    protected function prepareForSaveInDB()
    {
      }

    protected function type(){
        return 'autograded';
    }

}