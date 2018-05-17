<?php

use Phinx\Migration\AbstractMigration;

class CreateGradebookTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `gradebook` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `pageid` int(11) NOT NULL,
  `post_feedback_id` int(11) DEFAULT NULL,
  `score` double DEFAULT NULL,
  `max_score` double DEFAULT NULL,
  `due_date` timestamp NULL DEFAULT NULL,
  `is_exempt` tinyint(1) DEFAULT NULL,
  `is_score_override` tinyint(1) DEFAULT NULL,
  `has_quiz_feedback` tinyint(1) DEFAULT NULL,
  `modified_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_page` (`pageid`,`userid`),
  KEY `user` (`userid`),
  KEY `page` (`pageid`)
);

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
    DROP TABLE gradebook
SQL;
        $this->execute($sql);


    }
}