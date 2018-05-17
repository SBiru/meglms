<?php

use Phinx\Migration\AbstractMigration;

class CreateForumTables extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $this->addForumNotifications();
        $this->addForumPostRead();
        $this->addForumPosts();
        $this->addForums();
        $this->addForumSettings();
        $this->addForumUserSettings();
    }
    private function addForumNotifications(){
        $sql = <<<SQL
    CREATE TABLE IF NOT EXISTS `forum_notifications` (
  `forumid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `notification` varchar(255) NOT NULL,
  `created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `forum_notifications_forumid_userid_index` (`forumid`,`userid`)
)
SQL;
    $this->execute($sql);
    }
    private function addForumPosts(){
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS `forum_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forumid` int(11) NOT NULL,
  `rootid` int(11) NOT NULL DEFAULT '0',
  `parentid` int(11) NOT NULL DEFAULT '0',
  `userid` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `replies` int(11) DEFAULT NULL,
  `last_postid` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) 
SQL;
    $this->execute($sql);
    }
    private function addForumSettings(){
        $sql = <<<SQL
    CREATE TABLE IF NOT EXISTS `forum_settings` (
  `forumid` int(11) NOT NULL,
  `setting` varchar(50) DEFAULT NULL,
  `value` varchar(50) DEFAULT NULL
)
SQL;
    $this->execute($sql);
    }
    private function addForums(){
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS `forums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pageid` int(11) NOT NULL,
  `classid` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `author` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_postid` int(11) DEFAULT NULL,
  `topics` int(11) DEFAULT '0',
  `posts` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `forums_pageid_uindex` (`pageid`)
)
SQL;
        $this->execute($sql);
    }
    private function addForumUserSettings(){
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS `forum_user_settings` (
  `forumid` int(11) NOT NULL,
  `setting` varchar(50) DEFAULT NULL,
  `value` varchar(50) DEFAULT NULL,
  `userid` int(11) NOT NULL
)
SQL;
        $this->execute($sql);
    }
    private function addForumPostRead(){
        $sql = <<<SQL
CREATE TABLE IF NOT EXISTS `forum_post_read` (
  `postrootid` int(11) NOT NULL,
  `userid` int(11) NOT NULL,
  `last_read` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `forum_post_read_postrootid_userid_uindex` (`postrootid`,`userid`)
)
SQL;
        $this->execute($sql);
    }



}
