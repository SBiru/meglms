<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 6/10/17
 * Time: 12:11 PM
 */
$json = file_get_contents("advisor_map.json");
$obj = json_decode($json,true);
$keys = array_keys($obj);
$openingSQL = "INSERT INTO advisor_map (name,id,first_name,last_name,email) VALUES ";
$values = [];
foreach($keys as $key) {
    $value = "('$key',{$obj[$key]['id']},'{$obj[$key]['firstname']}','{$obj[$key]['lastname']}','{$obj[$key]['email']}')";
    array_push($values,$value);
}
$closingSQL = implode(",",$values);
$fullSQL = $openingSQL . $closingSQL;
echo $fullSQL;