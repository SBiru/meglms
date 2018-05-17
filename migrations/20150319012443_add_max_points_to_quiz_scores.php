<?php

use Phinx\Migration\AbstractMigration;

class AddMaxPointsToQuizScores extends AbstractMigration
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
ALTER TABLE quiz_scores
ADD COLUMN `max_points` INT(11) NULL DEFAULT NULL AFTER `score`,
ADD COLUMN `randomquiz_id` INT(11) NULL DEFAULT NULL;
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
DROP COLUMN `max_points`,
DROP COLUMN `randomquiz_id`;
SQL;
        $this->execute($sql);

    }
}