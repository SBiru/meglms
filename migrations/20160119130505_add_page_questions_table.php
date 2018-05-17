<?php

use Phinx\Migration\AbstractMigration;

class AddPageQuestionsTable extends AbstractMigration
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
        CREATE TABLE IF NOT EXISTS `page_question_reponses` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `grade` int(11) DEFAULT NULL,
  `waiting_for_grade` tinyint(1) DEFAULT NULL,
  `response` text,
  `feedback` text,
  `graded_by` int(11) DEFAULT NULL,
  `graded_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`,`page_id`,`user_id`,`question_id`)
)
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}