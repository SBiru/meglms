<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates;
class BehindInCoursesTemplate extends BaseTemplate{
    private $percBehind;
    private $tableStyles;
    private $students;
    private $options;
    public function __construct($orgId,$to,$students,$percBehind,$role='parent',$options=array()){
        parent::__construct($orgId,$to,$role);
        $this->tableStyles = new BorderedStripedTable();
        $this->percBehind=$percBehind;
        $this->mailMessage = '';
        $this->students  = $students;
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
        return $this->replacePercBehind($descriptions['texts'][$dIndex]);
    }
    private function replacePercBehind($text){
        return str_replace('{percBehind}',$this->percBehind,$text);
    }
    private function createTable($students,$role){
        $table = new HtmlElement('table','',$this->tableStyles->tableStyles());
        $tbody = new HtmlElement('tbody','');
        $tbody->content.=$this->createTableHeader($role);
        $tbody->content.=$this->createTableBody($students,$role);
        $table->content = $tbody->getHtml();
        return $table->getHtml();
    }
    private function createTableHeader($role){
        if($role=='teacher'){
            return '<tr>'.
            (new HtmlElement('th','Class name',array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
            (new HtmlElement('th','Student / Behind(%)',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
            '       </tr>
        ';
        }else{
            return '<tr>'.
            (new HtmlElement('th','Student name',array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
            (new HtmlElement('th','Course / Behind(%)',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
            '       </tr>
        ';
        }

    }


    private function createTableBody($students,$role){
        $body = '';
        foreach($students as $student){
            $body.=$this->createTableRow($student,$role);

        }
        return $body;
    }
    private function createTableRow($student,$role){
        $this->tableStyles->currentRow++;
        return '
        <tr>'.
            (new HtmlElement('td',$student['name'],array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml().
        (new HtmlElement('td',$this->buildClassesBehindPerc($student,$role),array_merge($this->tableStyles->firstThOrTdStyles(),$this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml().
        '</tr>';
    }
    private function buildClassesBehindPerc($item,$role){
        $classes = new HtmlElement('table','',['width'=>'100%']);
        $rows = $role=='teacher'?$item['students']:$item['classes'];
        foreach($rows as $row){
            $tr = new HtmlElement('tr');
            $className = new HtmlElement('td',$row['name'],['width'=>'80%']);
            $percBehind = new HtmlElement('td',$row['percBehind'].'%');
            $tr->content= $className->getHtml().$percBehind->getHtml() ;
            $classes->content.=$tr->getHtml();
        }
        return $classes->getHtml();
    }

    private function previewTable(){
        return '';
    }
    protected function emailData()
    {
        if($this->preview){
            return $this->mailMessage.=$this->previewTable();
        }
        $this->mailMessage.= $this->createTable($this->students,$this->role);
    }


    protected function emailDescription()
    {
        $this->mailMessage.= $this->tableDescription();
    }

    protected function emailWelcome()
    {
        parent::setHi( 'Hello '.$this->to['name'] . '');
    }
    private $defaultDescriptionOptions = [
        'texts'=>[
            '<p>The following students are more than {percBehind}% behind in their courses</p>',
            '<p>You are more than {percBehind}% behind in the following courses</p>'
        ],
        'roles'=>[
            'student'=>1,
            'all'=>0
        ]
    ];
}
