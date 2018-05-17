<?php

use Phinx\Migration\AbstractMigration;

class CreateHistoryStudentClass extends AbstractMigration
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
        if (!$this->hasTable('history_student_class')) {
            $table = $this->table('history_student_class');
            $table->addColumn('user_id', 'integer', array('null' => false))
                ->addColumn('class_id', 'integer', array('null' => false))
                ->addColumn('date', 'timestamp', array('default' => 'CURRENT_TIMESTAMP', 'null' => false))
                ->addColumn('grade', 'integer', array())
                ->addColumn('grade_percent', 'integer', array())
                ->addColumn('grade_letter', 'string', array('limit' => 1))
                ->save();
        }    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}