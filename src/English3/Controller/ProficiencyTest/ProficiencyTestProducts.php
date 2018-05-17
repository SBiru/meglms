<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.19.10
 * Time: 16:19
 */

namespace English3\Controller\ProficiencyTest;


use English3\Controller\Utility;

class ProficiencyTestProducts {
    public static function commercialUrlForClassId($classId){
        $abbr = Utility::getInstance()->fetchOne("SELECT abbreviation FROM products WHERE classid = ?",[$classId]);
        return '/studentCheckout.php?buy='.$abbr;
    }
    private static function serverTag(){
        if($_SERVER['HTTP_HOST']=='elearn.english3.com'){
            return 'us';
        }else{
            return 'china';
        }
    }
    private static $commercial_url_per_server = [
        'us'=>[
            '981'=>'/studentCheckout.php',
            '958'=>'/proficiencytest/tamuj1/'
        ],
        'china'=>[
            '981'=>'/studentCheckoutChina.php',
            '958'=>'/proficiencytest/tamuj1/',
            '262'=>'/proficiencytest/tamuj1/'
        ]
    ];
}