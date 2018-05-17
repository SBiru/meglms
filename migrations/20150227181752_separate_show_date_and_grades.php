<?php

use Phinx\Migration\AbstractMigration;

class SeparateShowDateAndGrades extends AbstractMigration
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
ALTER TABLE classes 
ADD show_dates tinyint(1) NOT NULL DEFAULT 1,
ADD show_grades tinyint(1) NOT NULL DEFAULT 1,
DROP COLUMN show_dates_and_grades
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE classes 
ADD show_dates_and_grades tinyint(1) NOT NULL DEFAULT 1,
DROP COLUMN show_grades,
DROP COLUMN show_dates
SQL;
        $this->execute($sql);
    }
}