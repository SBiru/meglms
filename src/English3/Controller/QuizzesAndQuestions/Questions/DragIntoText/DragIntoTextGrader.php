<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:33
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\DragIntoText;


use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class DragIntoTextGrader extends QuestionGrader{
    public function getGradePercent(){
        $this->orderOptions();
        $placeHolders = DragIntoText::parsePrompt($this->properties->orignalPrompt);
        $percentagePerOption = 1.0/count($placeHolders);
        $grade = 0;
        foreach($placeHolders as $i=>$placeHolder){
            $placeHolder = intval($placeHolder)-1;
            $correctAnswer = strtolower(trim($this->properties->options[$placeHolder]['text']));
            $studentResponse = strtolower(trim(@$this->studentResponse[$i]));
            if($correctAnswer==$studentResponse){
                $grade+=$percentagePerOption;
            }
        }
        return $grade;
    }
    private function orderOptions(){
        uasort($this->properties->options,function($a,$b){
            if ($a['order'] == $b['order']) {
                return 0;
            }
            return ($a['order'] < $b['order']) ? -1 : 1;
        });
        $options = array();
        foreach($this->properties->options as $o){
            $options[] = $o;
        }
        $this->properties->options = $options;
    }
    public function formatResponse(){
        return str_replace('\'',"\\'",json_encode($this->studentResponse));
    }
}