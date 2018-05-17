<?php
namespace English3\Controller;

use XMLReader;
use SimpleXML;
use Doctrine\DBAL\Connection;
use English3\Controller\UserController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpKernel\Exception\HttpException;
class Permissions
{

    protected $reader;
    protected $me;
    protected $util;

    public function __construct(Connection $reader)
    {
        $this->util = new Utility($reader);
        $this->reader = $reader;

    }

    //Permissions
    protected function calcLoggedIn($throwError=true)
    {
        $this->me = UserController::me($this->reader);
        if (!$this->me) {
            if($throwError){
                throw new HttpException(401, 'Not logged in');
            }else{
                return false;
            }
        }
        return true;
    }

    protected function checkAdmin($orgId = null, $acceptOrgAdmin = true,$throwError=true)
    {
        $this->calcLoggedIn();
        if (!($this->me->amISuperUser() ||
            ($acceptOrgAdmin && $this->me->amIOrgAdmin($orgId))
        )
        ) {
            if($throwError){
                throw new HttpException(403, 'Must be an admin');
            }
            else {
                return false;
            }

        }
        return true;
    }

    protected function checkTeacher($classid, $orgid,$throwError=true)
    {
        $this->calcLoggedIn();
        if (!$this->me->isTeacher($classid, true, $orgid)) {
            if($throwError){
                throw new HttpException(403, 'Not a teacher for this class');
            }else{
                return false;
            }
        }
        return true;
    }
}