<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates;
class MissingAttendanceTemplate extends BaseTemplate{
    private $students;
    private $options = array();
    public function __construct($orgId,$to,$students,$role='parent',$options=array()){
        parent::__construct($orgId,$to,$role);
        $this->role = $role;
        $this->tableStyles = new BorderedStripedTable();
        $this->students = $students;
        $this->mailMessage='';
        $this->options = $options;
        $this->genarateTemplate();

    }
    private function tableDescription(){
        $descriptions = @$this->options['descriptions']?:$this->defaultDescriptionOptions;
        if(array_key_exists($this->role,$descriptions['roles'])){
            $dIndex = $descriptions['roles'][$this->role];
        }else{
            $dIndex = $descriptions['roles']['all'];
        }
        $text = $this->replacePeriod($descriptions['texts'][$dIndex]);

        return $text;
    }
    private function replacePeriod($text){
        return str_replace('{period}',$this->options['period']['value'],$text);
    }


    private function createTable($students){
        $table = new HtmlElement('table','',['font-size'=>'15px','width'=>'100%','border'=>'1px solid #ddd','border-spacing'=>0,'border-collapse'=>'collapse']);
        $tbody = new HtmlElement('tbody','');
        $tbody->content.=$this->createTableHeader();
        $tbody->content.=$this->createTableBody($students);
        $table->content = $tbody->getHtml();
        return $table->getHtml();
    }
    private function createTableHeader(){
        return '<tr>'.
            (new HtmlElement('th','Student name',array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
            (new HtmlElement('th','Phone',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
        '       </tr>
        ';
    }

    private function createTableBody($students){
        $body = '';
        foreach($students as $student){
            $body.=$this->createTableRow($student);
        }
        return $body;
    }
    private function createTableRow($student){
        $this->tableStyles->currentRow++;
        return '
        <tr>'.
            (new HtmlElement('td',$student['name'],array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml().
            (new HtmlElement('td',$student['phone'],array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml().
        '</tr>';
    }


    protected function emailData()
    {
        $this->mailMessage.= $this->createTable($this->students);
    }

    protected function emailDescription()
    {
        $this->mailMessage.= $this->tableDescription();
    }

    protected function emailWelcome()
    {
        parent::setHi( 'Hello '.$this->to['name']);
    }
    private $defaultDescriptionOptions = [
        'texts'=>[
            "<p>The following students' attendance report is {period} week(s) late</p>"
        ],
        'roles'=>[
            'all'=>0
        ]
    ];
}
