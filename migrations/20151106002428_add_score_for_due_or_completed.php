<?php

use Phinx\Migration\AbstractMigration;

class AddScoreForDueOrCompleted extends AbstractMigration
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
ALTER TABLE `progress_report`
ADD COLUMN `letter_expected_or_completed_score` VARCHAR(3) NULL DEFAULT NULL,
ADD COLUMN `perc_expected_or_completed_score` DOUBLE NULL DEFAULT NULL,
ADD COLUMN `total_expected_or_completed_score` DOUBLE NULL DEFAULT NULL

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `progress_report`
DROP COLUMN `letter_expected_or_completed_score`,
DROP COLUMN `perc_expected_or_completed_score`,
DROP COLUMN `total_expected_or_completed_score`
SQL;
        $this->execute($sql);
    }


}