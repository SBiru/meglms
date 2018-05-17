<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:30
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionDB;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionDBException;

class CalculatedMultiChoiceDB extends QuestionDB{

    protected function prepareForSaveInDB()
    {

    }

    protected function type()
    {
        return 'calculatedmulti';
    }
}