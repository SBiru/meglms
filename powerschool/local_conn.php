<?php
/**
 * Created by PhpStorm.
 * User: root
 * Date: 1/28/17
 * Time: 12:19 PM
 */
require('../config.php');

// Create connection
global $local_conn,$DB;
$local_conn = new mysqli($DB->host, $DB->user, $DB->password);

// Check connection

if ($local_conn->connect_error) {

    die("Connection failed: " . $local_conn->connect_error);

}

mysqli_select_db($local_conn,$DB->database);

/*
$testQuery = "SELECT * FROM pages ORDER BY id DESC LIMIT 1";
$result = $local_conn->query($testQuery);
$row = $result->fetch_assoc();
echo print_r($row,true);
*/