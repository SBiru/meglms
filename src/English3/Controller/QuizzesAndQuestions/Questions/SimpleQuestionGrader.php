<?php

namespace English3\Controller\QuizzesAndQuestions\Questions;


class SimpleQuestionGrader extends QuestionGrader {

    protected function getGradePercent()
    {
        // TODO: Implement getGradePercent() method.
    }

    protected function formatResponse()
    {
        return json_encode($this->studentResponse);
    }
    public function prepareForDisplay(){
        $display = (array)($this->properties);
        $display['response'] = $this->formatResponse();
        return $display;
    }
}