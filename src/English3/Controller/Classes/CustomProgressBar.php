<?php
namespace English3\Controller\Classes;


class CustomProgressBar{
    protected function __construct(
        $aheadRanges,
        $behindRanges,
        $gradeTypeSplashPage,
        $gradeTypeCourseView
    ){
        $this->aheadRanges = $aheadRanges;
        $this->behindRanges = $behindRanges;
        $this->gradeTypeSplashPage = $gradeTypeSplashPage;
        $this->gradeTypeCourseView = $gradeTypeCourseView;

    }
    public static function fromString($jsonString){
        $jsonString = is_null($jsonString)?self::$defaultRawValue:$jsonString;
        $rangesArray = json_decode($jsonString,true);
        return self::fromArray($rangesArray);
    }
    public static function fromArray($array){
        return new CustomProgressBar(
            @$array['ranges']['Ahead'],
            @$array['ranges']['Behind'],
            @$array['gradeTypeCourseView'],
            @$array['gradeTypeSplashPage']
        );
    }
    public function toArray(){
        return [
            'Ahead'=>$this->aheadRanges,
            'Behind'=>$this->behindRanges,
            'gradeTypeCourseView'=>$this->gradeTypeCourseView,
            'gradeTypeSplashPage'=>$this->gradeTypeSplashPage
        ];
    }
    protected $aheadRanges;
    protected $behindRanges;
    protected $gradeTypeCourseView;
    protected $gradeTypeSplashPage;
    protected static $defaultRawValue = '{"gradeTypeCourseView":"completed","gradeTypeSplashPage":"completed","ranges":{"Ahead":[{"min":0,"max":100,"color":"#32cd32"}],"Behind":[{"min":0,"max":20,"color":"#f7f025"},{"min":21,"max":50,"color":"#f7a120"},{"min":51,"max":100,"color":"#ff0505"}]}}';
}