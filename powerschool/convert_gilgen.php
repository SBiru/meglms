<?php
$gilgen_json = json_decode(file_get_contents("gilgen_files/original.json"),true);
ksort($gilgen_json["students"]);
ksort($gilgen_json["withdrawals"]);

$export = new \stdClass();
$export->students = $gilgen_json["students"];
$export->withdrawals = $gilgen_json["withdrawals"];

$sorted = fopen("gilgen_files/sorted.json","w");
fwrite($sorted,json_encode($export));
