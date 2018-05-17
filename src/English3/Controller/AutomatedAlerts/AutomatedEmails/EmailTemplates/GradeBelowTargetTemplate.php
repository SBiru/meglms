<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates;
use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGrade;
use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGradeType;

class GradeBelowTargetTemplate extends BaseTemplate{
    protected $mailMessage;
    private $target;
    protected $students;
    protected $options;
    public function __construct($orgId,$to,$students,TargetGrade $target,$role='parent',$options){
        parent::__construct($orgId,$to,$role);
        $this->target=$target;
        $this->tableStyles = new BorderedStripedTable();
        $this->students = $students;
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
        $text = $this->replaceGrade($descriptions['texts'][$dIndex]);

        return $text;

    }
    private function replaceGrade($text){
        return str_replace('{targetGrade}',$this->target->printableVersion(),$text);
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
            (new HtmlElement('th','Course / Grade',array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->thStyles())))->getHtml().
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
            (new HtmlElement('td',$this->buildStudentGradeColumn($student),array_merge($this->tableStyles->thAndTdStyles(),$this->tableStyles->tdStyles())))->getHtml().
        '</tr>';
    }
    private function buildStudentGradeColumn($student){
        $classes = new HtmlElement('table','',['width'=>'100%']);

        foreach($student['classes'] as $class){
            if(count($class['grades']) && @$class['grades']['gradePercent']<$class['cMin']){
                $tr = new HtmlElement('tr');
                $className = new HtmlElement('td',$class['name'].': ',['width'=>'80%']);
                $gradeText = $this->target->type==TargetGradeType::LETTER?$class['grades'][0]['gradeLetter']:$class['grades'][0]['gradePercent'].'%';
                $grade = new HtmlElement('td',$gradeText);
                $tr->content= $className->getHtml().$grade->getHtml() ;
                $classes->content.=$tr->getHtml();
            }
        }
        return $classes->getHtml();
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
            "<p>Students with grades below {targetGrade}</p>"
        ],
        'roles'=>[
            'all'=>0
        ]
    ];
}
