<?php
require("local_conn.php");
$postdata = file_get_contents("php://input");
$matches = json_decode($postdata,true);

foreach($matches as $match) {
    $query = "INSERT INTO lms_map (sectionid,lmsid) VALUES ({$match['sectionid']},{$match['lmsid']}) ON DUPLICATE KEY UPDATE lmsid = {$match['lmsid']}";
    $local_conn->query($query);
}

echo mysqli_error($local_conn);