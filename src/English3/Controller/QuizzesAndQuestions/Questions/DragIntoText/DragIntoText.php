<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.3
 * Time: 13:48
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\DragIntoText;


use English3\Controller\QuizzesAndQuestions\Questions\Question;
use English3\Controller\QuizzesAndQuestions\Questions\QuestionGrader;

class DragIntoText extends Question{
    protected function prepareForDisplay()
    {
        $this->replacePlaceHoldersWithBlanks();
        $this->shuffleOptionsIfNeeded();
    }

    protected function initQuestionGrader()
    {
        $this->grader = new DragIntoTextGrader($this->properties);
    }
    private function replacePlaceHoldersWithBlanks(){
        $prompt = $this->properties->prompt;
        $pattern = '/\[\[([^\]]+)\]\]/';
        $replacement = '[[_]]';
        $this->properties->orignalPrompt = $this->properties->prompt;
        $this->properties->prompt = preg_replace($pattern,$replacement,$prompt);
    }
    private function shuffleOptionsIfNeeded(){
        $this->properties->extra = json_decode($this->properties->extra,true);
        if(boolval(@$this->properties->extra['shuffle'])){
            shuffle($this->properties->options);
        }
    }
    public static function parsePrompt($prompt){
        $pattern = '/\[\[([^\]]+)\]\]/';
        preg_match_all($pattern, $prompt, $matches);
        return $matches[1];
    }

}

class DragIntoTextException extends \Exception{}