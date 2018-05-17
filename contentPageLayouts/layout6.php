<?php
$cpLayoutObj = json_decode($_POST['cpLayoutJson'],true);

echo "<!--cplayoutid:6-->
        <!--cplayoutblock:html1:{$cpLayoutObj["html1"]}-->
        <!--cplayoutblock:html2:{$cpLayoutObj["html2"]}-->
        <!--cplayoutblock:img1:{$cpLayoutObj["img1"]}-->
        <div class='cp-layout'>
            <div class='cp-layout-6'>
                <div>
                    <div class='cp-html-block layout-top'>{$cpLayoutObj["html1"]}</div>
                    <div class='cp-html-block layout-bottom'>{$cpLayoutObj["html2"]}</div>
                </div>
                <div class='cp-img-block'><img src='{$cpLayoutObj["img1"]}' /></div>
            </div>
        </div>";