<?php

use Phinx\Migration\AbstractMigration;

class AddAttemptIdToQuizFeedback extends AbstractMigration
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
ALTER TABLE `quiz_feedback`
ADD COLUMN `attempt_id` INT NOT NULL DEFAULT 0 AFTER `quiz_question_id`,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`user_id`, `quiz_id`, `question_id`, `attempt_id`);

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
SQL;
        $this->execute($sql);


    }
}
