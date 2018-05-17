<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.20.3
 * Time: 15:35
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


class ToleranceFactory{
    public static function createWithType($type,$tol,$decimals){
        if(strtolower($type)=='nominal'){
            return new NominalTolerance($tol,$decimals);
        }
        else if(strtolower($type)=='relative'){
            return new RelativeTolerance($tol,$decimals);
        }
    }
}
class RelativeTolerance extends Tolerance{


    public function getRange($answer)
    {
        if($answer==0){
            $range = [
                'min'=>-$this->tolerance,$this->decimals,
                'max'=>$this->tolerance,$this->decimals
            ];
        }else{
            $range = [
                'min'=>round($answer - $this->tolerance*1.0/$answer,$this->decimals),
                'max'=>round($answer + $this->tolerance*1.0/$answer,$this->decimals)
            ];
        }

        return $this->invertRangeIfNecessary($range);

    }
}
class NominalTolerance extends Tolerance{

    public function getRange($answer)
    {
        $range = [
            'min'=>round($answer - $this->tolerance,$this->decimals),
            'max'=>round($answer + $this->tolerance,$this->decimals)
        ];
        return $this->invertRangeIfNecessary($range);

    }
}