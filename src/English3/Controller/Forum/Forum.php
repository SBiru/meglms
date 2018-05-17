<?php

namespace English3\Controller\Forum;
use English3\Controller\ClassesController;
use English3\Controller\Utility;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class Forum
{

    public function __construct(){

    }
    public function savePost(Request $r){return ForumPost::savePost($r);}
    public function editPost(Request $r){return ForumPost::editPost($r);}
    public function deletePost(Request $r,$id){return ForumPost::deletePost($id);}
    public function loadTopics(Request $r,$pageId){return ForumTopic::loadTopics($pageId);}
    public function loadTopic(Request $r,$id){return ForumTopic::loadTopic($id);}
    public function exportTopic(Request $r,$id){$exporter = new ForumHTMLExporter($id);return $exporter->export();}
    public function loadParticipants(Request $r,$id){$ctrl = new ForumParticipants($id);return new JsonResponse($ctrl->load());}


    public function loadForums(Request $r,$classId){
        return new JsonResponse(Utility::getInstance()->fetch($this->queryLoadForums,['classId'=>$classId]));
    }
    public function _createForum(Request $request,$classId){
        Utility::clearPOSTParams($request);
        return new JsonResponse($this->createForum($request->request->all()));
    }
    public function _saveSettings(Request $request,$forumId){
        Utility::clearPOSTParams($request);
        $settingsCtrl = new ForumSettings($forumId);
        $settingsCtrl->save($request->request->all());
        return new JsonResponse('ok');
    }
    public function _saveUserSettings(Request $request,$forumId,$userId){
        Utility::clearPOSTParams($request);
        $settingsCtrl = new ForumSettings($forumId);
        $settingsCtrl->saveUserSettings($request->request->get('settings'),$userId);
        return new JsonResponse('ok');
    }

    public function createForum($forum,$settings=null){
        Utility::getInstance()->reader->insert('forums',
            [
                'pageid'=>$forum['pageId'],
                'classid'=>$forum['classId'],
                'title'=>$forum['title'],
                'description'=>$forum['description'],
                'author'=>$forum['author'],
            ]
        );
        $id = Utility::getInstance()->reader->lastInsertId();
        if($settings){
            $settingsCtrl = new ForumSettings($id);
            $settingsCtrl->save($settings);
        }
        return $id;
    }
    public function saveSettingsFromPage($pageId,$settings){
        $forumId = $this->getForumIdFromPage($pageId);
        $settingsCtrl = new ForumSettings($forumId);
        $settingsCtrl->save($settings);
    }
    public function  createForumFromPage($pageId,$settings=null){
        $classId = ClassesController::_getFromPage(null,$pageId);
        $pageData = Utility::getInstance()->fetchRow("SELECT * FROM pages where id = :id",['id'=>$pageId]);

        return ($this->createForum(
            [
                'pageId'=>$pageId,
                'classId'=>$classId,
                'title'=>$pageData['name'],
                'description'=>$pageData['content'],
                'author'=>$_SESSION['USER']['ID']
            ],
                $settings
        ));
    }
    public function loadSettingsFromPage($pageId){
        $forumId = $this->getForumIdFromPage($pageId);
        $settingsCtrl = new ForumSettings($forumId);
        return $settingsCtrl->load();
    }
    public function loadUserSettingsFromPage($pageId,$userId){
        $forumId = $this->getForumIdFromPage($pageId);
        $settingsCtrl = new ForumSettings($forumId);
        return $settingsCtrl->loadUserSettings($userId);
    }
    public function getForumIdFromPage($pageId){
        return Utility::getInstance()->fetchOne("SELECT id FROM forums where pageid = :pageid",
            ['pageid'=>$pageId]);
    }
    private $queryLoadForums = <<<SQL
    SELECT forums.*,p.name,p.content,
    concat(u.fname,' ',u.lname) as lastPostUser,if(lp.modified < '2000-01-01',lp.created,lp.modified) as 
    lastActivityTime
     FROM forums
     join pages p on p.id = forums.pageid
     left join forum_posts lp on lp.id = forums.last_postid
     left join users u on u.id = lp.userid
     WHERE classid = :classId
SQL;

}


