<?php

use Phinx\Migration\AbstractMigration;

class ChangeTablesToAcceptDoubleValues extends AbstractMigration
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
ALTER TABLE `class_assignments` CHANGE COLUMN `points` `points` DOUBLE NOT NULL ;

ALTER TABLE `quiz_scores`
CHANGE COLUMN `max_points` `max_points` DOUBLE NOT NULL,
CHANGE COLUMN `score` `score` DOUBLE NOT NULL ;

ALTER TABLE `questions` CHANGE COLUMN `max_points` `max_points` DOUBLE NOT NULL ;

ALTER TABLE `grade_posts` CHANGE COLUMN `grade` `grade` DOUBLE NOT NULL ;

ALTER TABLE `rubric_items` CHANGE COLUMN `score` `score` DOUBLE NOT NULL ;

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