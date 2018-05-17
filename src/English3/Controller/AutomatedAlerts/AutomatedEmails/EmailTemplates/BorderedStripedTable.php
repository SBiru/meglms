<?php


namespace English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates;


class BorderedStripedTable {
    public $currentRow;
    public function __construct(){
        $currentRow=0;
    }
    public function tableStyles(){
        return [
            'font-size'=>'15px',
            'width'=>'100%',
            'border'=>'1px solid #ddd',
            'border-spacing'=>0,
            'border-collapse'=>'collapse'];
    }
    public function firstThOrTdStyles(){
        return [
            'border-top'=>'0'
        ];
    }
    public function thStyles(){
        return [
            'border-bottom-width'=>'2px',
            'border-bottom'=>'2px solid #ddd'
        ];
    }
    public function tdStyles(){
        $styles=[];
        if($this->currentRow % 2 !=0){
            $styles['background-color']='#f9f9f9';
        }

        return $styles;
    }
    public function thAndTdStyles(){
        return [
            'padding'=>'8px',
            'border-top'=>'1px solid #ddd',
            'border'=>'1px solid #ddd'
        ];
    }
}