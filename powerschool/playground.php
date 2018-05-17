<?php
function getTableTest(){
    require("powerSchoolApi.php");
    require("local_conn.php");
    $ps = new powerSchoolApi();
    $ps->get_table();
}
//require('../config.php');
//require_once("../src/English3/Controller/Mailer/E3Mailer.php");
//$mailer = new English3\Controller\Mailer\Mailer();
//$mailer->sendEmail(['dennyserejom@gmail.com'],'oi','Sync Error Report');
//require("requests.php");
//
//$url = "http://dev.english3.com/signin/";
//$headers = array(
//    "cache-control: no-cache",
//    "content-type: application/x-www-form-urlencoded",
//);
//$data = "username=mikegriffiths11@hotmail.com&password=aloha123";
//$add_opts = array(CURLOPT_HEADER => 1);
//$response = useCurl($url,$headers,$data,"POST",$add_opts);
//
//preg_match('/PHPSESSID=(.*?);/', $response, $matches);
//$phpsessid = $matches[1];
//
//$url = "http://dev.english3.com/api/organizations/10/imports/powerschool";
//$headers = array(
//    "cache-control: no-cache",
//    "content-type: application/json",
//    "Cookie: PHPSESSID={$phpsessid}"
//);
//$response = useCurl($url,$headers,"","POST");
//$json = json_decode($response);
getTableTest();