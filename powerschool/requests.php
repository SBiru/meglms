<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 1/28/17
 * Time: 4:17 PM
 */
function getResponse($url,$headers,$data,$method="GET") {
    $aHTTP = array(
        'http' => // The wrapper to be used
            array(
                'method'  => $method, // Request Method
                // Request Headers Below
                'header'  => $headers,
                'content' => $data
            )
    );
    $context = stream_context_create($aHTTP);
    return file_get_contents($url, false, $context);
}

function useCurl($url,$headers,$data,$method,$add_opts=array()) {

    $ch = curl_init($url);
    $default_opts = array(
        CURLOPT_CUSTOMREQUEST=>$method,
        CURLOPT_POSTFIELDS=>$data,
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_HTTPHEADER=>$headers,
        CURLOPT_FAILONERROR=>true
    );
    $all_opts = $default_opts;
    foreach($add_opts as $key=>$value) $all_opts[$key] = $value;
    curl_setopt_array($ch, $all_opts);

    $result = curl_exec($ch);
    if(curl_error($ch)) $result = curl_error($ch);
    curl_close($ch);
    return $result;
}

