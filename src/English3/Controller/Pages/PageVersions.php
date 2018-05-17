<?php
/**
 * Created by IntelliJ IDEA.
 * User: root
 * Date: 16.13.10
 * Time: 15:41
 */
namespace English3\Controller\Pages;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class PageVersions {
    public function load(Request $request,$id){
        return new JsonResponse(Utility::getInstance()->fetch($this->queryGetVersions,['pageId'=>$id]));
    }
    public function save(Request $request,$id){
        Utility::clearPOSTParams($request);
        self::_save($id,$request->get('content'));
        return new JsonResponse(['ok'=>true]);
    }
    public static function _save($id,$content,$force=false){
        $old_content = Utility::getInstance()->fetchOne("SELECT content FROM pages WHERE id = :pageId",
            ['pageId'=>$id]);
        if($old_content !== $content || $force){
            Utility::getInstance()->reader->insert('page_versions',
                [
                    'content'=>$content,
                    'pageid'=>$id,
                    'modified_by'=>$_SESSION['USER']['ID']
                ]
            );
        }
    }
    private $queryGetVersions = <<<SQL
    SELECT p.*,if(u.id,concat(u.fname,' ', u.lname),'SYSTEM') as name from
     page_versions p 
     left join users u on u.id = p.modified_by
     where p.pageid=:pageId
SQL;


}