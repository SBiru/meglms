<?php
$cpLayoutObj = json_decode($_POST['cpLayoutJson'],true);

echo "<!--cplayoutid:2-->
    <!--cplayoutblock:img1:{$cpLayoutObj["img1"]}-->
    <!--cplayoutblock:html1:{$cpLayoutObj["html1"]}-->
    <div class='cp-layout'>
        <div class='cp-layout-2'>
                <div class='cp-img-block'><img src='{$cpLayoutObj["img1"]}' /></div>
                <div class='cp-html-block'>{$cpLayoutObj["html1"]}</div>
        </div>
    </div>";