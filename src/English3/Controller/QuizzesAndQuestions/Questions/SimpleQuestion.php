<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.26.4
 * Time: 22:26
 */

namespace English3\Controller\QuizzesAndQuestions\Questions;


class SimpleQuestion extends Question{

    protected function prepareForDisplay()
    {

    }

    protected function initQuestionGrader()
    {
        $this->grader = new SimpleQuestionGrader($this->properties);
    }
}