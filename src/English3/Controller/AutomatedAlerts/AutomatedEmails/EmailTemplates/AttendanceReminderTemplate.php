<?php
namespace English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates;
class AttendanceReminderTemplate extends BaseTemplate{
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
        return $descriptions['texts'][$dIndex];
    }





    protected function emailData()
    {

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
            "<p>Attendance reminder</p>"
        ],
        'roles'=>[
            'all'=>0
        ]
    ];
}
