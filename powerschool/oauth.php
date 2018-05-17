<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 1/28/17
 * Time: 12:38 PM
 */

/*
 *
from config import CLIENT_ID, CLIENT_SECRET, BASE_URL
import requests
from base64 import b64encode
from time import time
import json

url = BASE_URL + '/oauth/access_token'

def get_access_token():
    b64_string = b64encode(bytes(':'.join([CLIENT_ID,CLIENT_SECRET]),'utf-8'))
    payload = "grant_type=client_credentials"
    headers = {
        'authorization': "Basic "+b64_string.decode('utf-8'),
        'content-type': "application/x-www-form-urlencoded;charset=UTF-8",
    }
    response = requests.post(url, data=payload, headers=headers).json()
    response['timestamp'] = time()
    with open('token_data.json','w') as j:
        j.write(json.dumps(response))
    return response

 */

/*
$sURL = "http://beamtic.com/Examples/http-post.php"; // The POST URL
$sPD = "name=Jacob&bench=150"; // The POST Data
$aHTTP = array(
  'http' => // The wrapper to be used
    array(
    'method'  => 'POST', // Request Method
    // Request Headers Below
    'header'  => 'Content-type: application/x-www-form-urlencoded',
    'content' => $sPD
  )
);
$context = stream_context_create($aHTTP);
$contents = file_get_contents($sURL, false, $context);

echo $contents;
*/
/*
    'header'=>"Accept-language: en\r\n" .
              "Cookie: foo=bar\r\n"
'header'=>array("Accept-language: en\r\n" ,"Cookie: ".session_name()."=".session_id()."\r\n"," Content-type: application/x-www-form-urlencoded\r\n\r\n"),
*/
require_once("config.php");
require_once("requests.php");
function get_access_token() {
    global $BASE_URL,$CLIENT;
    $url = $BASE_URL . '/oauth/access_token';
    $b64_string = base64_encode($CLIENT->id.":".$CLIENT->secret);
    $headers =
        'authorization: Basic '.$b64_string.'\r\n' .
        'content-type:application/x-www-form-urlencoded;charset=UTF-8\r\n';
    $data = array('grant_type'=>'client_credentials');
    $data = http_build_query($data);
    $response = null;
    while(!$response) {
        $response = json_decode(getResponse($url, $headers, $data, "POST"),true);
    }
    $response['timestamp'] = time();

    $token_file = fopen("token_data.json", "w");
    fwrite($token_file, json_encode($response));

    return $response;
}