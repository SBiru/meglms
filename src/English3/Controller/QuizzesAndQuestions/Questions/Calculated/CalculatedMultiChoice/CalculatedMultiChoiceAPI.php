<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.22.3
 * Time: 06:50
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedMultiChoice;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleConfig;
use English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple\CalculatedSimpleException;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class CalculatedMultiChoiceAPI {
    public function validateAndFindParameters(Request $request){
        Utility::clearPOSTParams($request);
        $validator = new CalculatedMultiChoiceValidator();
        $choices = $request->request->get('choices');
        try{
            $parameters = $validator->validateAndFindParameters($choices);
            return new JsonResponse($parameters);
        }catch(CalculatedSimpleException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }
    }
    public function generateSets(Request $request){
        Utility::clearPOSTParams($request);
        try{
            $config = new CalculatedSimpleConfig($request->request->all());
            $config->choices = $request->request->get('choices');
            $generator = new CalculatedMultiChoiceGenerator($config);
            return new JsonResponse($generator->generateRandomSets());
        }catch(CalculatedSimpleException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }
    }
    public function calculateSet(Request $request){
        Utility::clearPOSTParams($request);
        try{
            $config = new CalculatedSimpleConfig($request->request->all());
            $config->choices = $request->request->get('choices');
            $generator = new CalculatedMultiChoiceGenerator($config);
            $params = json_decode($request->request->get('set'),true);
            return new JsonResponse($generator->calculateChoiceFormulasWithSet($params));
        }catch(CalculatedSimpleException $e){
            return Utility::buildHTTPError($e->getMessage(),500,['showToUser'=>true]);
        }

    }

}