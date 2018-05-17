<?php

use Phinx\Migration\AbstractMigration;

class AddClassIdToQuizScores extends AbstractMigration
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
ADD COLUMN `class_id` INT(11) NOT NULL AFTER `attempts_completed`;
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE quiz_scores
DROP `class_id`
SQL;
        $this->execute($sql);
    }
}
