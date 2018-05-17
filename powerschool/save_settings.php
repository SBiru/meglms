<?php

$postdata = file_get_contents("php://input");
$settings = json_decode($postdata,true);

$file = "sync_config.json";
$sync_config = json_decode(file_get_contents($file));

$sync_config->schoolids = explode(",",$settings["schoolids"]);
$sync_config->activeTermIds = explode(",",$settings["termids"]);
$sync_config->reportTo = explode(",",$settings["reportTo"]);

$file_conn = fopen("sync_config.json", "w");
fwrite($file_conn, json_encode($sync_config));
