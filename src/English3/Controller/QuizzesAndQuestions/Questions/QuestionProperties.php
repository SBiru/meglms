<?php
namespace English3\Controller\QuizzesAndQuestions\Questions;
class QuestionProperties{
    public function __construct($propertiesArray = null){
        if(!is_null($propertiesArray)){
            $this->prompt=@$propertiesArray['prompt'];
            $this->options=@$propertiesArray['options'];
            $this->points=@$propertiesArray['points'];
            $this->extra=@$propertiesArray['extra'];
            $this->solution=@$propertiesArray['solution'];
            $this->id=@$propertiesArray['id'];
        }
    }
    public $prompt;
    public $options;
    public $points;
    public $extra;
    public $bankId;
    public $id;
    public $solution;

}