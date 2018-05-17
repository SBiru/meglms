<?php

use Phinx\Migration\AbstractMigration;

class CreateQuizFeedbackTable extends AbstractMigration
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
CREATE TABLE IF NOT EXISTS `quiz_feedback` (
    `user_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `feedback` text,
  `by_user` int(11) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `viewed` tinyint(1) DEFAULT '0',
  `quiz_question_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`,`quiz_id`,`question_id`))
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE `quiz_feedback`;
SQL;
        $this->execute($sql);
    }
}
