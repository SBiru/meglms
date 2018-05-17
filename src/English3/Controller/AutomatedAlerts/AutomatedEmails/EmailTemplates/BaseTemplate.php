<?php

namespace English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates;


use English3\Controller\Organization\OrganizationController;

abstract class BaseTemplate
{
    private $orgId;
    private $header;
    private $footer;
    private $orgProperties;
    protected $mailMessage;
    protected $logo;
    protected $role;
    protected $to;
    protected $testVersion;
    protected $preview;
    public function __construct($orgId = null,$to,$role,$testVersion=true,$preview=false)
    {
        $this->role = $role;

        $this->to = $to;
        $this->orgId = $orgId;
        $this->orgProperties = OrganizationController::_get($orgId,false);
        $this->header = '<div style="width:100%!important;min-width:100%;color:#222222;font-family:Helvetica,Arial,sans-serif;font-weight:normal;text-align:left;line-height:18px;font-size:12px;margin:0;padding:0">'.$this->orgProperties['email_header_template'];
        $this->footer = $this->orgProperties['email_footer_template'];
        $this->testVersion = $testVersion;
        $this->preview = $preview;
    }

    public function getTemplate()
    {
        return '<div style="max-width: 700px;margin: auto;">'.$this->header . $this->body . $this->footer.'</div>';
    }
    public function getHeader(){
        return $this->header;
    }
    public function setHeaderFromOrg(){
        $this->header = OrganizationController::_getField($this->orgId,'email_header_template');
    }
    public function getBody()
    {
        return $this->body . $this->footer;
    }

    public function setHi($hiMessage)
    {
        if($this->testVersion){
            $hiMessage = $hiMessage.$this->testMessage();
        }
        $this->body = str_replace("##hi##", $hiMessage, $this->body);
    }

    public function setMailMessage($mailMessage=null,$role=null)
    {
        $this->mailMessage=$mailMessage?:$this->mailMessage;
        $this->body = str_replace("##mail_message##", $this->mailMessage, $this->body);
    }

    public function setSenderMail($senderMail)
    {
        $this->footer = str_replace("##sender_mail##", $senderMail, $this->footer);
    }
    protected function testMessage(){
        $message = ". This is a test, please ignore it.";
        if($this->role=='customEmail')
        {
            return $message."
        <p><b>In this test, you are receiving the email that would be sent to ".$this->to['email']."</b></p>
        ";
        }else{
            return $message."
        <p><b>In this test, you are receiving the email that would be sent to the ".$this->role.", limited to 2 ".$this->role."s</b></p>
        ";
        }

    }
    protected abstract function emailData();
    protected abstract function emailDescription();
    protected abstract function emailWelcome();
    protected function genarateTemplate(){
        $this->emailWelcome();
        $this->emailDescription();
        $this->emailData();
        $this->setMailMessage();
        $this->setSenderMail('support@english3.com');
    }
    protected $body = '
        <table style="width:100%;margin:auto;font-size:20px">
            <tr>
                <td>
                    ##hi##
                    <br>
                    <br>
                    ##mail_message##
                    <p><br></p>
                </td>
            </tr>
        </table>
    </div>';

}
class HtmlElement{
    public $tag;
    public $content;
    public $styles;
    public function __construct($tag,$content='',$styles=array()){
        $this->tag = $tag;
        $this->content = $content;
        $this->styles = $styles;
    }
    public function getHtml(){
        return
            '<'.
            $this->tag.
            $this->buildStyles().
            '>'.
            $this->content.
            '</'.
            $this->tag.
            '>';
    }
    private function buildStyles(){
        $styleList = array();
        foreach($this->styles as $property=>$value){
            $styleList[]=$property.': '.$value;
        }
        if(count($styleList)){
            return ' style="'.implode(';',$styleList).'"';
        }else return '';
    }
    public function addStyle($property,$value){
        $this->styles[$property]=$value;
    }
    public function addStyles($styles){
        $this->styles = array_merge($this->styles,$styles);
    }

}