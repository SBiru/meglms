<?php

use Phinx\Migration\AbstractMigration;

class CreateTimedPrompts extends AbstractMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-change-method
     *
     * Uncomment this method if you would like to use it.
     *
    public function change()
    {
    }
    */
    
    /**
     * Migrate Up.
     */
    public function up()
    {
        $sql = <<<SQL
        CREATE TABLE IF NOT EXISTS `timed_review_prompts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prompt` mediumtext NOT NULL,
  `answer` text,
  `type` varchar(45) NOT NULL,
  `time_limit` int(11) DEFAULT NULL,
  `time_pause` int(11) DEFAULT NULL,
  `options` text COMMENT 'Used to add extra content like audio or video files. JSON format',
  `groupid` int(11) NOT NULL DEFAULT '1',
  `modified_by` int(11) NOT NULL,
  `modified_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `index2` (`groupid`),
  KEY `index3` (`type`)
)

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        drop table timed_review_prompts;
)
SQL;
        $this->execute($sql);
    }
}