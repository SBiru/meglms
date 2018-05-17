<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:35
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CalculatedSimpleAPI {
    public function __construct(){

    }
    public function validateAndFindParameters(Request $request){
        $validator = new CalculatedSimpleValidator();
        $formula = $request->query->get('formula');
        try{
            $parameters = $validator->validateAndFindParameters($formula);
            return new JsonResponse($parameters);
        }catch(CalculatedSimpleException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }

    }
    public function generateSets(Request $request){
        try{
            $config = new CalculatedSimpleConfig($request->query->all());
            $generator = new CalculatedSimpleGenerator($config);
            return new JsonResponse($generator->generateRandomSets());
        }catch(CalculatedSimpleException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }

    }
    public function calculateSet(Request $request){
        try{
            $config = new CalculatedSimpleConfig($request->query->all());
            $generator = new CalculatedSimpleGenerator($config);
            $params = json_decode($request->query->get('set'),true);
            $answer = $generator->calculateFormulaWithSet($params);
            list($range, $isValid,$error) = $generator->checkAnswerRange($answer);
            $answer = is_numeric($answer)?$answer:'Error';
            return new JsonResponse(
                [
                    'answer'=>$answer,
                    'range'=>$range,
                    'isValid'=>$isValid,
                    'error'=>$error,
                    'formula'=>$generator->buildSetFormula($params,$answer)
                ]
            );
        }catch(CalculatedSimpleException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }

    }

}