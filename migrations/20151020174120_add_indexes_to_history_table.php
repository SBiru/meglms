<?php

use Phinx\Migration\AbstractMigration;

class AddIndexesToHistoryTable extends AbstractMigration
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
ALTER TABLE `history_student_class`
DROP COLUMN id,
CHANGE COLUMN `user_id` `user_id` INT(11) NOT NULL ,
CHANGE COLUMN `class_id` `class_id` INT(11) NOT NULL,
CHANGE COLUMN `date` `date` DATE NOT NULL,
ADD COLUMN  total_tasks INT(11),
ADD COLUMN  completed_tasks INT(11),
ADD COLUMN  expected_tasks INT(11),
ADD COLUMN  perc_completed_tasks INT(11),
ADD COLUMN  perc_expected_tasks INT(11),
ADD COLUMN  total_score DOUBLE,
ADD COLUMN  total_max_score DOUBLE,
ADD COLUMN  total_worked_score DOUBLE,
CHANGE COLUMN  grade_letter letter_completed_score VARCHAR(3),
CHANGE COLUMN  grade_percent perc_completed_score DOUBLE,
ADD COLUMN  letter_total_score VARCHAR(3),
ADD COLUMN  perc_total_score DOUBLE,
ADD COLUMN  expected_end_date DATE,
ADD COLUMN  projected_end_date DATE,
ADD COLUMN  enrollment_date DATE,
DROP COLUMN grade,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`user_id`, `class_id`, `date`);
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}