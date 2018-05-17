<?php

use Phinx\Migration\AbstractMigration;

class AddGradesDisplayOptionsToClasses extends AbstractMigration
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
    ALTER TABLE `classes`
ADD COLUMN `show_grades_as_score` TINYINT(1) NOT NULL DEFAULT '0' AFTER `chat_mode_code`,
ADD COLUMN `show_grades_as_letter` TINYINT(1) NOT NULL DEFAULT '0' AFTER `show_grades_as_score`,
ADD COLUMN `show_grades_as_percentage` TINYINT(1) NOT NULL DEFAULT '0' AFTER `show_grades_as_letter`;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `devmeglms`.`classes`
DROP COLUMN `show_grades_as_percentage`,
DROP COLUMN `show_grades_as_letter`,
DROP COLUMN `show_grades_as_score`;
SQL;
        $this->execute($sql);
    }
}