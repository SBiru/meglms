<?php

use Phinx\Migration\AbstractMigration;

class AddAttemptToQuizScore extends AbstractMigration
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
ALTER TABLE `quiz_scores`
ADD COLUMN `attempt_id` INT NULL DEFAULT 0 AFTER `highest_score`,
ADD COLUMN `highest_attempt_id` INT NULL AFTER `attempt_id`;
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