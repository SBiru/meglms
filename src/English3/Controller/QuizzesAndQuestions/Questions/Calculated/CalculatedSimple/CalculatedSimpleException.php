<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.3
 * Time: 15:41
 */

namespace English3\Controller\QuizzesAndQuestions\Questions\Calculated\CalculatedSimple;


use Symfony\Component\Config\Definition\Exception\Exception;

class CalculatedSimpleException extends Exception{
    const EMPTY_PARAMETERS = "At least one parameter must be provided. Ex: ({y}-{b})/{a}";
    const INVALID_FORMULA = "Error evaluating %s. The formula is invalid";
    const INVALID_FORMULA_REASON = "Error evaluating %s. %s";
    const EMPTY_FIELD = "%s must be provided";
    const OUT_OF_RANGE= "The right answer is outside the tolerance range";
    const EMPTY_SUBFORMULA= "Answer should contain at least one formula of type {={x}..}";

}