<?php
require_once('orm.php');


class bitwise{

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
    static function bitToArray($int, $array){
        $response = array();
        foreach(array_keys($array) as $key){
            $bit = $array[$key];
            if($bit & $int){
                $response[$key]=$bit;
            }
        }
        return $response;
    }

}



////usage
//$requiredPermissions = array('user'=>1,'admin'=>2); //permission values would increment as 1,2,4,8,16...
////in the case of quizzes, each value could represent a question!
//
//$requiredInt = bitwise::calculateInt(bitwise::calculateBitwiseValues($requiredPermissions),true);
//
//$userPermissionCalculatedInt = 1;
////comes from giving user calculated permission like this:
////$userPermissionCalculatedInt = bitwise::calculateInt(bitwise::calculateBitwiseValues(array('user'=>1)),true);
//
////check if user should have access
//if($userPermission & $requiredInt)
//{
//    echo 'You have access!';
//}else{
//    echo 'You dont have access!';
//}
?>