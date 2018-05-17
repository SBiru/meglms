<?php
$cpLayoutObj = json_decode($_POST['cpLayoutJson'],true);

echo "<!--cplayoutid:7-->
        <!--cplayoutblock:html1:{$cpLayoutObj["html1"]}-->
        <!--cplayoutblock:html2:{$cpLayoutObj["html2"]}-->
        <!--cplayoutblock:html3:{$cpLayoutObj["html3"]}-->
        <div class='cp-layout'>
            <div class='cp-layout-7'>
                <div class='cp-html-block'>{$cpLayoutObj["html1"]}</div>
                <div>
                    <div class='cp-html-block layout-top'>{$cpLayoutObj["html2"]}</div>
                    <div class='cp-html-block layout-bottom'>{$cpLayoutObj["html3"]}</div>
                </div>
            </div>
        </div>";