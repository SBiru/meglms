<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:33
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Autograded;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class AutogradedGadrer extends QuestionGrader{
    public function getGradePercent(){

        return 1;
    }

    public function formatResponse(){
        return $this->studentResponse;
    }
}