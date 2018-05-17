<?php

use Phinx\Migration\AbstractMigration;

class AddLetterGradeConditionalsToClasses extends AbstractMigration
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
ADD COLUMN `use_grade_a_plus` TINYINT(1) NULL DEFAULT '1' AFTER `c_minus_min`,
ADD COLUMN `use_grade_a` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_a_plus`,
ADD COLUMN `use_grade_a_minus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_a`,
ADD COLUMN `use_grade_b_plus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_a_minus`,
ADD COLUMN `use_grade_b` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_b_plus`,
ADD COLUMN `use_grade_b_minus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_b`,
ADD COLUMN `use_grade_c_plus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_b_minus`,
ADD COLUMN `use_grade_c` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_c_plus`,
ADD COLUMN `use_grade_c_minus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_c`,
ADD COLUMN `use_grade_d_plus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_c_minus`,
ADD COLUMN `use_grade_d` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_d_plus`,
ADD COLUMN `use_grade_d_minus` TINYINT(1) NULL DEFAULT '1' AFTER `use_grade_d`;

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
DROP COLUMN `use_grade_d_minus`,
DROP COLUMN `use_grade_d`,
DROP COLUMN `use_grade_d_plus`,
DROP COLUMN `use_grade_c_minus`,
DROP COLUMN `use_grade_c`,
DROP COLUMN `use_grade_c_plus`,
DROP COLUMN `use_grade_b_minus`,
DROP COLUMN `use_grade_b`,
DROP COLUMN `use_grade_b_plus`,
DROP COLUMN `use_grade_a_minus`,
DROP COLUMN `use_grade_a`,
DROP COLUMN `use_grade_a_plus`;
SQL;
$this->execute($sql);
    }
}