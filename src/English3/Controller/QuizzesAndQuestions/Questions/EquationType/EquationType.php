<?php
namespace English3\Controller\QuizzesAndQuestions\Questions\EquationType;


use English3\Controller\QuizzesAndQuestions\Questions\Question;

class EquationType extends Question
{

    protected function prepareForDisplay()
    {
        // TODO: Implement prepareForDisplay() method.
    }

    protected function initQuestionGrader()
    {
        $this->grader = new EquationTypeGrader($this->properties);
    }
}