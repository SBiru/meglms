<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 5/15/17
 * Time: 3:52 PM
 */

namespace English3\Controller;


class Bitwise{

    static public function calculateBitwiseValues($values)
    {
        $response = array();
        foreach($values as $value)
        {
            array_push($response,1 << $value);
        }

        return $response;
    }

    public static function calculateInt($values,$enable,$existingValue=NULL)
    {
        if(empty($existingValue))
        {
            $existingValue = 0;
        }

        $response = $existingValue;
        if($enable)
        {
            foreach($values as $value)
            {
                $response = $response | $value;
            }
        }else{
            foreach($values as $value)
            {
                $response = $response & ~$value;
            }
        }
        return $response;
    }
    static function bitToArray($int, $array,$key=null,$cb= null){
        $response = array();
        foreach(array_keys($array) as $k){
            $bit = $key?$array[$k][$key]:$array[$k];
            $checked = $bit & $int;;
            if($cb){
                $response[$k] = call_user_func_array($cb,[$array[$k],$checked]);
            }else{
                if($checked){
                    $response[$k]=$bit;
                }
            }
        }
        return $response;
    }

}