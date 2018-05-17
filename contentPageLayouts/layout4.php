<?php
$cpLayoutObj = json_decode($_POST['cpLayoutJson'],true);

echo "<!--cplayoutid:4-->
    <!--cplayoutblock:html1:{$cpLayoutObj["html1"]}-->
    <!--cplayoutblock:html2:{$cpLayoutObj["html2"]}-->
    <div class='cp-layout'>
        <div class='cp-layout-4'>
            <div class='cp-html-block'>{$cpLayoutObj["html1"]}</div>
            <div class='cp-html-block'>{$cpLayoutObj["html2"]}</div>
        </div>
    </div>";