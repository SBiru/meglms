<?php

namespace English3\Controller;

use Doctrine\DBAL\Connection;

use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TranslationsController{

    public static function _getForUser($userId){
        $util = new Utility();

        $result = $util->fetch(self::$queryGetTranslations,['userId'=>$userId]);
        if (!$result) return FALSE;
        $translations = array(
            'en'=>array(),
            'user_language'=>array(),
            'language'=>''

        );
        foreach ($result as $row) {
            if($translations['language']==""){
                $translations['language']=$row['language'];
            }
            if($row['language']=='en'){
                $translations['en'][$row['nav_key']] = $row['translation'];
            }
            else{
                $translations['user_language'][$row['nav_key']] = $row['translation'];
            }
        }
        return $translations;
    }

    private static $queryGetTranslations = <<<SQL
          SELECT localize_navs.language, translation, nav_key
            FROM localize_navs
            JOIN user_preferences on user_preferences.value = localize_navs.language and user_preferences.user_id=:userId
            WHERE (user_preferences.preference = 'language' and user_preferences.user_id = :userId) or localize_navs.language = 'en'
SQL;

}
?>