<?php


namespace English3\Controller\QuizzesAndQuestions\Questions\EquationType;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionDB;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionDBException;

class EquationTypeDB extends QuestionDB
{
    private $NO_SOLUTIONS = "Please add possible solutions for the automatically graded equation type question";

    protected function prepareForSaveInDB()
    {
        $extra = $this->properties->extra;
        if($extra->gradeType == 'automatic' && sizeof($extra->solutions) == 0){
            throw new QuestionDBException($this->NO_SOLUTIONS);
        }
    }

    protected function type()
    {
        return 'equation';
    }
}