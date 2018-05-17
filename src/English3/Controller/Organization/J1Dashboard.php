<?php
/**
 * Created by IntelliJ IDEA.
 * User: ubuntu
 * Date: 13/12/17
 * Time: 15:06
 */

namespace English3\Controller\Organization;



use English3\Controller\GradebookController;
use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class J1Dashboard extends Dashboard {
    protected $orgFlag = 'use_j1_dashboard';
    protected $roles = ['teacher','admin','school_admin','student'];
    public function dashboardSettings()
    {
        return true;
    }
    protected function getMyRoles(){
        parent::getMyRoles();
        if(Utility::getInstance()->fetchOne($this->queryIsJ1Student,[$_SESSION['USER']['ID']])){
            $this->myRoles[] = 'student';
        }

    }
    private $queryIsJ1Student = <<<SQL
    SELECT uc.classid from user_classes uc
    join classes c on c.id = uc.classid
    join proficiency_classes pc on pc.classid = c.id 
    where (c.is_j1_class = 1) and is_student=1 and userid = ? limit 1
    
SQL;
}