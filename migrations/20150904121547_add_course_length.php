<?php

use Phinx\Migration\AbstractMigration;

class AddCourseLength extends AbstractMigration
{
    /**
     * Change Method.
     *
     * More information on this method is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-change-method
     *
     * Uncomment this method if you would like to use it.
     *
     * public function change()
     * {
     * }
     */

    /**
     * Migrate Up.
     */
    public function up()
    {
        $sql = <<<SQL
 ALTER TABLE `classes`
ADD COLUMN `course_length` INT NULL DEFAULT 90 AFTER `external_course_id`

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
DROP COLUMN `course_length`
SQL;
        $this->execute($sql);


    }
}