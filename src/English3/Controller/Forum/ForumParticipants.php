<?php
/**
 * Created by IntelliJ IDEA.
 * User: denny
 * Date: 9/6/17
 * Time: 2:59 PM
 */

namespace English3\Controller\Forum;


use English3\Controller\Utility;

class ForumParticipants
{
    private $pageId;
    public function __construct($pageId)
    {
        $this->pageId = $pageId;
    }
    public function load(){
        return Utility::getInstance()->fetch($this->queryLoadForumParticipants,['pageId'=>$this->pageId]);
    }

    private $queryLoadForumParticipants = <<<SQL
    SELECT
      u.id as userId,
      concat(u.fname, ' ',u.lname) as userName,
      sum(if(fp.rootid=0,1,0)) as posts,
      sum(if(fp.rootid>0,1,0)) as replies,
      fp.created as last_post
     FROM (select * from forum_posts order by created desc) fp
    JOIN forums f on f.id = fp.forumid
    JOIN users u on u.id = fp.userid
    WHERE f.pageid = :pageId
    group by u.id
SQL;

}