<?php


namespace English3\Controller\QuizzesAndQuestions\Questions\EquationType;

use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class EquationTypeGrader extends QuestionGrader
{

    public function getGradePercent()
    {
        $is_correct = -1;
        $this->properties->extra = json_decode($this->properties->extra);
        if($this->properties->extra->gradeType == "automatic"){
            $possibleSoluns = $this->properties->extra->solutions;
            if(array_search($this->studentResponse,$possibleSoluns) === false){
                $is_correct = 0;
            }else{
                $is_correct = 1;
            }
        }
        return $is_correct;
    }

    public function formatResponse()
    {
        return str_replace('"',"",json_encode($this->studentResponse));
    }
}