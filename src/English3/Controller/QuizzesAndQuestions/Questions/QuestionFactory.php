<?php

namespace English3\Controller\QuizzesAndQuestions\Questions;

use Symfony\Component\Debug\ErrorHandler;

class QuestionFactory {
    public static function createFromTypeWithProperties($type,QuestionProperties $properties = null){
        $evalStringFormat = "\$question = new %s(\$properties);";
        return self::createQuestion($type,$properties,$evalStringFormat);
    }
    public static function createFromTypeWithId($type,$id){
        $evalStringFormat = "\$question = (new %s())->initWithId(\$properties);";
        return self::createQuestion($type,$id,$evalStringFormat);
    }
    public static function createDBFromTypeWithProperties($type,QuestionProperties $properties){
        $evalStringFormat = "\$question = new %sDB(\$properties);";
        return self::createQuestion($type,$properties,$evalStringFormat);
    }
    private static function createQuestion($type,$properties,$evalStringFormat){
        $class = self::getClassWithType($type);
        if(!$class){
            return null;
        }
        $question = null;

        eval(sprintf($evalStringFormat,$class));
        return $question;
    }
    private static function getClassWithType($type){
        if(!array_key_exists($type,self::$availableTypesWithClasses)){
            return null;
        }
        else{
            return self::$availableTypesWithClasses[$type];
        }
    }

    public static $availableTypesWithClasses = [
        'dragintotext'=>'\English3\Controller\QuizzesAndQuestions\Questions\DragIntoText\DragIntoText',
        'calculatedsimple'=>'\English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimple',
        'calculatedmulti'=>'\English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice\CalculatedMultiChoice',
        'simplequestion'=>'\English3\Controller\QuizzesAndQuestions\Questions\SimpleQuestion',
        'equation'=>'\English3\Controller\QuizzesAndQuestions\Questions\EquationType\EquationType',
        'editingtask'=>'\English3\Controller\QuizzesAndQuestions\Questions\EditingTask\EditingTask',
        'grid'=>'\English3\Controller\QuizzesAndQuestions\Questions\GridType\GridType',
        'autograded'=>'\English3\Controller\QuizzesAndQuestions\Questions\Autograded\Autograded'
    ];
}
