<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.16.3
 * Time: 13:46
 */

namespace English3\Controller\QuizzesAndQuestions\Questions;
use Exception;

class QuestionDBException extends Exception{
    const PROMPT_IS_MISSING = "Question prompt must not be empty";
}