<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.3.5
 * Time: 22:00
 */

namespace English3\Controller\Users;

use English3\Controller\Utility;

use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UserDueDates {
    public function setManualDueDatesFromRequest(Request $request, $userId){
        Utility::clearPOSTParams($request);
        $pages = $request->request->get('pages');
        if(!$pages){
            throw new Exception("pages parameter is required");
        }
        $this->setManualDueDates($userId,$pages);
        return new JsonResponse("ok");
    }
    public function setManualDueDates( $userId,$pages){
        UserDueDatesSQL::updateManualDueDates($userId,$pages);
    }
}
class UserDueDatesSQL {
    public static function updateManualDueDates($userId,$pages){
        $values = array_map(function($page) use($userId){
            $page["manual_due_date"]=$page["manual_due_date"]?sprintf('"%s"',$page["manual_due_date"]):'null';
            return sprintf('("%s","%s",%s,"%s")',$userId,$page['id'],$page['manual_due_date'],$page['page_duration']);
        },$pages);
        Utility::getInstance()->insert(sprintf(self::$queryUpdateManualDueDates,implode(",",$values)));
    }

    private static $queryUpdateManualDueDates = <<<SQL
    INSERT INTO user_due_dates (userid,pageid,manual_due_date,page_duration)
    VALUES %s
    ON DUPLICATE KEY UPDATE manual_due_date = values(manual_due_date), page_duration = values(page_duration)
SQL;


}
