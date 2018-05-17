<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.17.3
 * Time: 11:56
 */

namespace English3\Controller\QuizzesAndQuestions\Questions;


use MyProject\Proxies\__CG__\OtherProject\Proxies\__CG__\stdClass;

abstract class QuestionGrader {
    protected $properties;
    protected $studentResponse;
    public function __construct(QuestionProperties $properties){
        $this->properties=$properties;
    }
    public function setStudentResponse($response){
        $this->studentResponse=$response;
    }
    protected abstract function getGradePercent();
    protected abstract function formatResponse();
    public function prepareForDisplay(){

        return new \stdClass();
    }

}