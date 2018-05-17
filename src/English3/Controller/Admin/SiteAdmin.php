<?php
namespace English3\Controller\Admin;

use English3\Controller\Utility;
use Kahlan\Reporter\Json;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class SiteAdmin {
    public function save(Request $request,$siteId){
        Utility::clearPOSTParams($request);
        $userId = $request->request->get('userId');
        $db = Utility::getInstance()->reader;
        $db->insert('user_admin_sites',[
            'userid'=>$userId,
            'siteid'=>$siteId
        ]);
        return new JsonResponse($db->lastInsertId());
    }
    public function remove(Request $request,$siteId,$userId){
        Utility::getInstance()->reader->delete('user_admin_sites',[
            'userid'=>$userId,
            'siteid'=>$siteId
        ]);
        return new JsonResponse('ok');
    }
    public function getSitesForUser(Request $request,$userId){
        $sites = Utility::getInstance()->fetch($this->querySitesForUser,['userId'=>$userId]);
        return new JsonResponse($sites);
    }
    public function getUsersForSite(Request $request,$siteId){
        $users = Utility::getInstance()->fetch($this->queryUsersForSite,['siteId'=>$siteId]);
        return new JsonResponse($users);
    }
    public function removeAllSitesFromUser(Request $request, $userId){
        Utility::getInstance()->reader->delete('user_admin_sites',[
            'userid'=>$userId
        ]);
        return new JsonResponse('ok');
    }
    private $querySitesForUser = <<<SQL
    SELECT s.* FROM user_admin_sites us
    JOIN sites s ON us.siteid = s.id
    WHERE us.userid = :userId
SQL;
    private $queryUsersForSite = <<<SQL
    SELECT u.id,u.email,u.fname,u.lname FROM user_admin_sites us
    JOIN users u ON us.userid = u.id
    WHERE us.siteid = :siteId
SQL;

}