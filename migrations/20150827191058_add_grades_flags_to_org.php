<?php

use Phinx\Migration\AbstractMigration;

class AddGradesFlagsToOrg extends AbstractMigration
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
ALTER TABLE `organizations`
ADD COLUMN `hide_actual_score` TINYINT(1) NULL DEFAULT '0' AFTER `disable_account_emails`,
ADD COLUMN `hide_grade_clompleted_word` TINYINT(1) NULL DEFAULT '0' AFTER `hide_actual_score`,
ADD COLUMN `hide_expected_by_today` TINYINT(1) NULL DEFAULT '0' AFTER `hide_grade_clompleted_word`,
ADD COLUMN `hide_completed_so_far` TINYINT(1) NULL DEFAULT '0' AFTER `hide_expected_by_today`,
ADD COLUMN `hide_progress` TINYINT(1) NULL DEFAULT '0' AFTER `hide_completed_so_far`,
ADD COLUMN `hide_projected_end_date` TINYINT(1) NULL DEFAULT '0' AFTER `hide_progress`,
ADD COLUMN `hide_expected_end_date` TINYINT(1) NULL DEFAULT '0' AFTER `hide_projected_end_date`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `organizations`
DROP COLUMN `hide_expected_end_date`,
DROP COLUMN `hide_projected_end_date`,
DROP COLUMN `hide_progress`,
DROP COLUMN `hide_completed_so_far`,
DROP COLUMN `hide_expected_by_today`,
DROP COLUMN `hide_grade_clompleted_word`,
DROP COLUMN `hide_actual_score`;
SQL;
        $this->execute($sql);


    }
}