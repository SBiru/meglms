<?php
namespace English3\Controller;

use Doctrine\DBAL\Connection;
use English3\Controller\Utility;
use Exception;
use Phinx\Migration\Util;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Serializer\Encoder\JsonEncode;


class PasswordBankController
{
    /**
     * @var Connection
     */
    private $read;
    private $util;


    public function __construct(Connection $read)
    {
        $this->read = $read;
        $this->util = Utility::getInstance();
    }
    public function allWords(Request $request,$orgId){

        return new JsonResponse($this->util->fetch($this->queryAllWords,['orgId'=>$orgId]));
    }
    public function addWord(Request $request,$orgId){
        Utility::clearPOSTParams($request);
        try {
            $this->read->insert('word_bank',
                array(
                    'word'=>$request->request->get('word'),
                    'orgId'=>$orgId
                )
            );
        } catch (Exception $e) {
            return Utility::buildHTTPError(method_exists($e,'getErrorCode')?$e->getErrorCode():'Undefined error',500);
        }

        return new JsonResponse(['id'=>$this->read->lastInsertId(),'word'=>$request->request->get('word'),'orgId'=>$orgId]);
    }
    public function deleteWord(Request $request,$orgId,$wordId){
        $this->read->delete('word_bank',array('id'=>$wordId));
        return new JsonResponse('ok');
    }
    public function getRandomWords(Request $request,$orgId,$limit){
        return new JsonResponse($this->util->fetch($this->queryRandomWords . ' limit '.$limit,['orgId'=>$orgId]));
    }

    private $queryAllWords = <<<SQL
    SELECT * FROM word_bank WHERE orgId = :orgId
SQL;
    private $queryRandomWords = <<<SQL
    SELECT * FROM word_bank WHERE orgId = :orgId order by RAND()
SQL;


}