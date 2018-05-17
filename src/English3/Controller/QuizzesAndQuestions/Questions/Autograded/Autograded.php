<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.3
 * Time: 13:48
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Autograded;


use English3\Controller\QuizzesAndQuestions\Questions\Question;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class Autograded extends Question{
    protected function prepareForDisplay()
    {}

    protected function initQuestionGrader()
    {
        $this->grader = new AutogradedGadrer($this->properties);
    }
}

class AutogradedException extends \Exception{}