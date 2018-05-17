<?php
namespace English3\Controller\QuizzesAndQuestions\Banks;

use English3\Controller\Utility;

class BankController {
    public static function _getBank($bankId,$field=null){
        if($field){
            return Utility::getInstance()->fetchOne(self::$queryGetBank,['id'=>$bankId],$field);
        }
        return Utility::getInstance()->fetchRow(self::$queryGetBank,['id'=>$bankId]);
    }
    public static function _getLastQuestionPosition($bankId){
        return Utility::getInstance()->fetchOne('SELECT max(position) FROM bank_questions WHERE bank_id = :bankId',['bankId'=>$bankId]);
    }

    private static $queryGetBank = <<<SQL
    SELECT * FROM banks WHERE id = :id
SQL;

}