<?php

use Phinx\Migration\AbstractMigration;

class AddLmsIdExternalCourseIdToClasses extends AbstractMigration
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
        $table = $this->table('classes');
        $column1 = $table->hasColumn('LMS_id');
        $column2 = $table->hasColumn('external_course_id');
        if (!$column1) {
            $table->addColumn('LMS_id', 'integer', array('null' => true))
                  ->update();
        }
        if (!$column2) {
            $table->addColumn('external_course_id', 'integer', array('null' => true))
                  ->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}