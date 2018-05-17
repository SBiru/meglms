<?php

namespace English3\Controller\AutomatedAlerts\Alerts;


use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGrade;
use English3\Controller\AutomatedAlerts\Alerts\TargetGrade\TargetGradeType;
use English3\Controller\Utility;
use Phinx\Migration\Util;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\JsonResponse;

class GradeBelowTarget {
    private $util;
    private $students;
    private $target;
    private $sql;
    public function __construct(TargetGrade $target=null){
        $this->util = Utility::getInstance();
        $this->students=array();

        if(is_null($target)){
            $target = new TargetGrade(TargetGradeType::LETTER,'C');
        }

        $this->target = $target;
        $this->sql = new GradeBelowCSQL($target);
    }

    public function adviseesWithGradesBellowC($advisorId){
        $this->prepareStudents($this->sql->getAdviseesGradebookHistory($advisorId));
        return $this->students;
    }
    public function orgStudentsWithGradesBellowC($orgId){
        $this->prepareStudents($this->sql->getOrgStudentsGradebookHistory($orgId));
        return $this->students;
    }

    private function prepareStudents($students){
        foreach ($students as $entry) {
            $this->createStudentIfNotExist($entry);
            $this->createClassForStudentIfNotExist($entry);
            $this->checkDateWhenDroppedBelowC($entry);
        }
    }
    private function createStudentIfNotExist($entry){
        if(!array_key_exists($entry['user_id'], $this->students)){
            $this->students[$entry['user_id']] = array(
                'id'=>$entry['user_id'],
                'first_name' => $entry['fname'],
                'last_name' => $entry['lname'],
                'name'=>$entry['lname'].', '.$entry['fname'],
                'fullName'=>$entry['fname'].' '.$entry['lname'],
                'lastGrade'=>null,
                'classes' => array()
            );
        }
    }
    private function createClassForStudentIfNotExist($entry){
        if(!array_key_exists($entry['class_id'], $this->students[$entry['user_id']]['classes'])){
            $this->students[$entry['user_id']]['classes'][$entry['class_id']] = array(
                'id'=>$entry['class_id'],
                'name' => $entry['className'],
                'cMin' => intval($entry['c_min']),
                'dateWhenDropped'=>null,
                'found'=>false,
                'grades' => array()
            );

        }
    }
    private function checkDateWhenDroppedBelowC($entry){
        $found = &$this->students[$entry['user_id']]['classes'][$entry['class_id']]['found'];
        $found=$found?true:intval($entry['grade_percent'])>$this->students[$entry['user_id']]['classes'][$entry['class_id']]['cMin'];
        $lastGrade = &$this->students[$entry['user_id']]['lastGrade'];
        if(!$found){
            $this->students[$entry['user_id']]['classes'][$entry['class_id']]['dateWhenDropped']=strtotime($entry['date']	) * 1000;
        }
        if(intval($entry['grade_percent'])!==$lastGrade ||
            $this->students[$entry['user_id']]['classes'][$entry['class_id']]['dateWhenDropped']!=strtotime($entry['date']	) * 1000){
            // under student's class object, add history of grades
            $this->students[$entry['user_id']]['classes'][$entry['class_id']]['grades'][] = array(
                'date' => strtotime($entry['date']	) * 1000,
                'gradePercent' => intval($entry['grade_percent']),
                'gradeLetter' => $entry['grade_letter']
            );
            $lastGrade=intval($entry['grade_percent']);
        }
    }

}
class GradeBelowCSQL{
    private $target;
    public function __construct(TargetGrade $target){
        $this->target = $target;
    }
    public function getAdviseesGradebookHistory($advisorId){
        return Utility::getInstance()->fetch(
            $this->replaceTargetGrade(self::$queryGetAdviseesGradebookHistory),
            array('advisorId' => $advisorId)
        );
    }

    public function getAllStudentsGradebookHistory (){
        return Utility::getInstance()->fetch(
            $this->replaceTargetGrade(self::$queryAllStudentsGradebookHistory)
        );
    }
    public function getOrgStudentsGradebookHistory ($orgId){
        return Utility::getInstance()->fetch(
            $this->replaceTargetGrade(self::$queryOrgStudentsGradebookHistory),
            ['orgId'=>$orgId]
        );
    }
    private function replaceTargetGrade($query){
        if($this->target->type==TargetGradeType::PERCENTAGE){
            return str_replace(':targetGrade',$this->target->value,$query);
        }
        else if($this->target->type==TargetGradeType::LETTER){
            return str_replace(':targetGrade','c.'.$this->target->value,$query);
        }
    }

    private static $queryGetAdviseesGradebookHistory = <<<SQL
		SELECT hsc.*,
			hsc.perc_completed_score as grade_percent,
	 		hsc.letter_completed_score as grade_letter,
			u.fname,
			u.lname,
			c.name as className,
			c.c_min -- min score (in percent value) for a C grade
		FROM history_student_class hsc
		JOIN classes c ON (hsc.class_id = c.id)
		JOIN users u ON (u.id = hsc.user_id)
		JOIN user_classes uc on u.id = uc.userid and c.id = uc.classid
		JOIN progress_report pr ON pr.classid = hsc.class_id and pr.userid = hsc.user_id
		WHERE user_id IN
			(SELECT studentid
			 FROM user_advisors
			 WHERE userid = :advisorId)
			AND pr.perc_completed_score < :targetGrade
			AND hsc.date >= NOW() - INTERVAL 1 MONTH
		ORDER BY c.name,hsc.date DESC
SQL;
    private static $queryAllStudentsGradebookHistory = <<<SQL
		SELECT hsc.*,
			hsc.perc_completed_score as grade_percent,
	 		hsc.letter_completed_score as grade_letter,
			u.fname,
			u.lname,
			c.name as className,
			c.c_min -- min score (in percent value) for a C grade
		FROM history_student_class hsc
		JOIN classes c ON (hsc.class_id = c.id)
		JOIN users u ON (u.id = hsc.user_id)
		JOIN user_classes uc on u.id = uc.userid and c.id = uc.classid
		JOIN progress_report pr ON pr.classid = hsc.class_id and pr.userid = hsc.user_id
		WHERE  pr.perc_completed_score < :targetGrade
			AND hsc.date >= NOW() - INTERVAL 1 MONTH
		ORDER BY c.name,hsc.date DESC
SQL;
    private static $queryOrgStudentsGradebookHistory = <<<SQL
		SELECT hsc.*,
			hsc.perc_completed_score as grade_percent,
	 		hsc.letter_completed_score as grade_letter,
			u.fname,
			u.lname,
			c.name as className,
			c.c_min -- min score (in percent value) for a C grade
		FROM history_student_class hsc
		JOIN classes c ON (hsc.class_id = c.id)
		JOIN users u ON (u.id = hsc.user_id)
		JOIN user_classes uc on u.id = uc.userid and c.id = uc.classid
		JOIN progress_report pr ON pr.classid = hsc.class_id and pr.userid = hsc.user_id
		WHERE c.exclude_from_alerts = 0 and (pr.perc_completed_score < :targetGrade and pr.perc_completed_score is not null)
		    AND u.organizationid = :orgId
			AND hsc.date >= NOW() - INTERVAL 20 DAY
		ORDER BY c.name,hsc.date DESC
SQL;

}

