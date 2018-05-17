<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.8.3
 * Time: 13:59
 */

namespace English3\Controller\Organization;


class OrganizationEmailTemplate {
    private $logoUrl;
    private $orgUrl;
    private $hasLogo;
    public function __construct($logoUrl=null,$orgUrl=null){
        $this->orgUrl=is_null($orgUrl)?'http://elearn.english3.com':$orgUrl;
        $this->hasLogo = is_null($logoUrl);
        $this->logoUrl=is_null($logoUrl)?$this->orgUrl.'/public/img/e3-green-logo.png':$this->orgUrl.$logoUrl;

    }
    public function defaultHeaderTemplate(){
        $subText = $this->hasLogo?('<div style="margin-left: 37px;font-size: 14px;">Results that speak for themselves</div>'):'';
        return '
        <table style="width:100%;margin: 50px auto">
            <tr>
                <td style = "padding: 20px 30px;background: rgb(244, 244, 244);">
                    <div><a href="'.$this->orgUrl.'"> <img src="'.$this->logoUrl.'" width="150px"></a></div>
                    '.$subText.
                '</td>
            </tr>
        </table>';
    }
    public function defaultFooterTemplate(){
        return '
        <div style="width:100%;margin: 70px auto;padding:10px 0;color:white;background-color: black">
            <div style="padding: 0 10px">

                <div>
                    Do not reply this email.
                     <br>
                    If you want to contact the person who sent this email, you can use this address <<span style="color:#9aff97">##sender_mail##</span>>.
                </div>
                <div>
                    Copyright © 2016 English3. All rights reserved.
                </div>
            </div>
        </div>';
    }
}
