<?php
namespace English3\Controller\Forum;
class Util
{

    public static function loadFromFile($fileName){
        return json_decode(file_get_contents(dirname(__FILE__).'/'.$fileName),true);
    }
    public static function saveToFile($fileName,$obj){
        $f = fopen(dirname(__FILE__).'/'.$fileName,'w');
        fwrite($f,json_encode($obj));
        fclose($f);
    }
}