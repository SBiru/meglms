<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.2.9
 * Time: 08:31
 */

namespace English3\Controller\TimedReview\Test;


class Logger{
    private $steps = array();
    public function addStep($text,$result){
        $this->steps[]=['text'=>$text,'isOk'=>$result];
    }
    public function hasErrors(){
        foreach($this->steps as $step){
            if(!$step['isOk']) return true;
        }
        return false;
    }
    public function writeResponse(){
        return $this->wrapperEl(
            $this->table(
                $this->rows()
            )
        );
    }
    private function wrapperEl($table){
        return
            "<div style='display: inline-block;padding: 10px;border: 2px solid #ccc;'>
                {$table};
            </div>";
    }
    private function table($rows){
        return "<table>{$rows}</table>";
    }
    private function rows(){
        $rows = '';
        foreach($this->steps as $step){
            $text = $step['text'];
            $result = $this->isOk(boolval($step['isOk']));
            $rows.="<tr><td>{$text}</td>{$result}</tr>";
        }
        return $rows;
    }
    private function isOk($r){
        return $r?'<td style="color:green">Ok</td>':'<td style="color:red">Error</td>';
    }
}