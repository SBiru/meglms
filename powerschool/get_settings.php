<?php

require("config.php");

$obj = new \stdClass();
$obj->reportTo = implode(",",$report_to);
$obj->termids = implode(",",$activeTermIds);
$obj->schoolids = implode(",",$schoolids);

$json = json_encode($obj);

echo $json;