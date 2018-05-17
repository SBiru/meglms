<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.20.3
 * Time: 15:35
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


abstract class Tolerance
{
    protected $tolerance;
    public $decimals;
    public function __construct($tol,$decimals){
        $this->tolerance = $tol;
        $this->decimals = $decimals;
    }
    public static function isAnswerWithinTolerance($answer,$range){
        return $answer>=$range['min'] && $answer<=$range['max'];
    }

    protected function invertRangeIfNecessary($range){
        if($range['min']>$range['max']){
            $tmp = $range['min'];
            $range['min']=$range['max'];
            $range['max']=$tmp;
        }
        return $range;
    }
    public abstract function getRange($answer);
}