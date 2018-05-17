<?php


namespace English3\Controller\AutomatedAlerts\AutomatedEmails {


    use English3\Controller\AutomatedAlerts\Alerts\GradeBelowTarget;
    use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGrade;
    use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGradeType;
    use English3\Controller\AutomatedAlerts\AutomatedEmails\EmailTemplates\GradeBelowTargetTemplate;


    class GradeBelowTargetEmail extends BaseAlertEmail
    {
        public $students;
        private $alertObj;
        private $target;
        public function __construct($orgId, $target, $testVersion = true)
        {
            if (is_numeric($target)) {
                $targetGrade = new TargetGrade(TargetGradeType::PERCENTAGE, $target);

            } else {
                $targetGrade = new TargetGrade(TargetGradeType::LETTER, $target);
            }
            $this->target = $targetGrade;
            $this->alertObj = new GradeBelowTarget($targetGrade);
            parent::__construct($orgId, 'Students with grades below ' . $targetGrade->printableVersion(), $testVersion);

        }

        public function getStudents()
        {
            $this->userGuardians = null;
            if($this->preview){
                return $this->students = $this->previewMockStudents();
            }
            $this->students = $this->alertObj->orgStudentsWithGradesBellowC($this->orgId);
        }
        public function emailUser($email)
        {
            $this->checkIfStudentsAreLoaded();

            $mailMessage = new GradeBelowTargetTemplate($this->orgId, ['name'=>'','email'=>$email], $this->students,$this->target, 'customEmail',$this->options);
            if($this->preview){
                $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
            }
            $this->sendEmail($mailMessage);
        }
        public function emailStudents()
        {
            $this->checkIfStudentsAreLoaded();
            $count = 0;
            foreach ($this->students as $student) {
                if ($count == $this->testLimit) {
                    break;
                }
                $count++;
                $mailMessage = new GradeBelowTargetTemplate($this->orgId, $student, [$student],$this->target, 'student',$this->options);
                if($this->preview){
                    $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
                }
                $this->sendEmail($mailMessage);
            }
        }

        protected function sendEmailToParentsOrAdvisors($addressees,$role)
        {
            $count = 0;
            foreach ($addressees as $addressee) {
                if ($count == $this->testLimit) {
                    break;
                }
                $count++;
                $mailMessage = new GradeBelowTargetTemplate($this->orgId, $addressee, $addressee['students'],$this->target, $role,$this->options);
                if($this->preview){
                    $mailMessage->setHeaderFromOrg();return $mailMessage->getTemplate();
                }
                $this->sendEmail($mailMessage);
            }
        }
        private function previewMockStudents(){
            return [
                '24'=>json_decode('{"id":"24","first_name":"Student","last_name":"Demo","name":"Demo, Student","fullName":"Student Demo","lastGrade":0,"classes":{"405":{"id":"405","name":"6th Grade English","cMin":73,"dateWhenDropped":1480557600000,"found":false,"grades":[{"date":1480557600000,"gradePercent":0,"gradeLetter":"F"}]}}}',true)
            ];

        }
        protected function mockPreviewParents($type='parents'){
            return [
                [
                    'id'=>1,
                    'name'=>$type.' Demo',
                    'email'=>'demo@'.$type.'.com',
                    'students'=>[json_decode('{"id":"24","first_name":"Student","last_name":"Demo","name":"Demo, Student","fullName":"Student Demo","lastGrade":0,"classes":{"405":{"id":"405","name":"6th Grade English","cMin":73,"dateWhenDropped":1480557600000,"found":false,"grades":[{"date":1480557600000,"gradePercent":0,"gradeLetter":"F"}]}}}',true)]
                ]
            ];

        }
    }
}
?>