<?php

use Phinx\Migration\AbstractMigration;

class AddGradeScaleToClasses extends AbstractMigration
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
ADD COLUMN `a_plus_max` TINYINT(1) NULL AFTER `show_grades_as_percentage`,
ADD COLUMN `a_plus_min` TINYINT(1) NULL AFTER `a_plus_max`,
ADD COLUMN `a_max` TINYINT(1) NULL AFTER `a_plus_min`,
ADD COLUMN `a_min` TINYINT(1) NULL AFTER `a_max`,
ADD COLUMN `a_minus_max` TINYINT(1) NULL AFTER `a_min`,
ADD COLUMN `a_minus_min` TINYINT(1) NULL AFTER `a_minus_max`,
ADD COLUMN `b_plus_max` TINYINT(1) NULL AFTER `a_minus_min`,
ADD COLUMN `b_plus_min` TINYINT(1) NULL AFTER `b_plus_max`,
ADD COLUMN `b_max` TINYINT(1) NULL AFTER `b_plus_min`,
ADD COLUMN `b_min` TINYINT(1) NULL AFTER `b_max`,
ADD COLUMN `b_minus_max` TINYINT(1) NULL AFTER `b_min`,
ADD COLUMN `b_minus_min` TINYINT(1) NULL AFTER `b_minus_max`,
ADD COLUMN `c_plus_max` TINYINT(1) NULL AFTER `b_minus_min`,
ADD COLUMN `c_plus_min` TINYINT(1) NULL AFTER `c_plus_max`,
ADD COLUMN `c_max` TINYINT(1) NULL AFTER `c_plus_min`,
ADD COLUMN `c_min` TINYINT(1) NULL AFTER `c_max`,
ADD COLUMN `c_minus_max` TINYINT(1) NULL AFTER `c_min`,
ADD COLUMN `c_minus_min` TINYINT(1) NULL AFTER `c_minus_max`,
ADD COLUMN `d_plus_max` TINYINT(1) NULL AFTER `c_minus_min`,
ADD COLUMN `d_plus_min` TINYINT(1) NULL AFTER `d_plus_max`,
ADD COLUMN `d_max` TINYINT(1) NULL AFTER `d_plus_min`,
ADD COLUMN `d_min` TINYINT(1) NULL AFTER `d_max`,
ADD COLUMN `d_minus_max` TINYINT(1) NULL AFTER `d_min`,
ADD COLUMN `d_minus_min` TINYINT(1) NULL AFTER `d_minus_max`;
SQL;
$this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `classes`
DROP COLUMN `d_minus_min`,
DROP COLUMN `d_minus_max`,
DROP COLUMN `d_min`,
DROP COLUMN `d_max`,
DROP COLUMN `d_plus_min`,
DROP COLUMN `d_plus_max`,
DROP COLUMN `c_minus_min`,
DROP COLUMN `c_minus_max`,
DROP COLUMN `c_min`,
DROP COLUMN `c_max`,
DROP COLUMN `c_plus_min`,
DROP COLUMN `c_plus_max`,
DROP COLUMN `b_minus_min`,
DROP COLUMN `b_minus_max`,
DROP COLUMN `b_min`,
DROP COLUMN `b_max`,
DROP COLUMN `b_plus_min`,
DROP COLUMN `b_plus_max`,
DROP COLUMN `a_minus_min`,
DROP COLUMN `a_minus_max`,
DROP COLUMN `a_min`,
DROP COLUMN `a_max`,
DROP COLUMN `a_plus_min`,
DROP COLUMN `a_plus_max`;
SQL;
        $this->execute($sql);
    }
}