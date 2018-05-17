<?php
/*
	EXAMPLE config.php FILE
*/
global $PATHS, $DB, $SECURITY;
$PATHS = new \stdClass();
$PATHS->base_site_public_path   = "/public/";
$PATHS->views_path              = "/public/views";
$PATHS->data_path               = "/public/data";
$PATHS->app_path                = "/var/www/meglms/html";
$PATHS->libre_path		= "/opt/libreoffice4.4/program/soffice.bin";
$PATHS->wowza_url = "rtmp://ec2-52-8-129-175.us-west-1.compute.amazonaws.com/webcamrecording";
$PATHS->wowza_content = "/wowzaMediaContent/content/";

$DB = new \stdClass();
$DB->host       = "localhost";
$DB->user       = "[USER]";
$DB->password   = "[PASSWORD]";
$DB->database   = "[DATABASE]";


$SECURITY = new \stdClass();
$SECURITY->salt = "[LONG_SALT_STRING]";
?>
