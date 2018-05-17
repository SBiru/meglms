<?php

use Phinx\Migration\AbstractMigration;

class AddForumGradeTables extends AbstractMigration
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
        $this->addForumGrade();
        $this->addForumPostsGrade();
    }
    private function addForumGrade(){
        $sql = <<<SQL
    CREATE TABLE IF NOT EXISTS `forum_grade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forumid` int(11) NOT NULL,
  `studentid` int(11) NOT NULL,
  `teacherid` int(11) NOT NULL,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `grade` double NOT NULL,
  `message` text,
  `read_on` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `forum_grade_forumid_pk` (`forumid`)
)
SQL;
    $this->execute($sql);
    }
    private function addForumPostsGrade(){
        $sql = <<<SQL
    CREATE TABLE IF NOT EXISTS `forum_posts_grade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `postid` int(11) NOT NULL,
  `studentid` int(11) NOT NULL,
  `teacherid` int(11) NOT NULL,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `grade` double DEFAULT NULL,
  `message` text,
  `read_on` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `forum_posts_grade_postid_pk` (`postid`),
  KEY `forum_posts_grade_postid_index` (`postid`)
)
SQL;
        $this->execute($sql);

    }
}
