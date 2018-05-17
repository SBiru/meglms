<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 1/28/17
 * Time: 12:26 PM
 */
global $BASE_URL,$CLIENT;
$file1 = "client_config.json";
$client_config = json_decode(file_get_contents($file1));

$file2 = "database_config.json";
$db_config = json_decode(file_get_contents($file2));

$file3 = "sync_config.json";
$sync_config = json_decode(file_get_contents($file3));

$CLIENT = new \stdClass();
$CLIENT->id = $client_config->id;
$CLIENT->secret = $client_config->secret;

$BASE_URL = "https://edkey.powerschool.com";

$local_DB = new \stdClass();
$local_DB->host = $db_config->host;
$local_DB->password = $db_config->password;
$local_DB->user = $db_config->user;
$local_DB->database = $db_config->database;

$schoolids = $sync_config->schoolids;
$activeTermIds = $sync_config->activeTermIds;

$report_to = $sync_config->reportTo;