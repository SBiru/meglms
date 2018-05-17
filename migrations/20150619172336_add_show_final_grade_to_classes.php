<?php

use Phinx\Migration\AbstractMigration;

class AddShowFinalGradeToClasses extends AbstractMigration
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
        $column = $table->hasColumn('show_final_grade');
        if (!$column) {
            $table->addColumn('show_final_grade', 'integer', array('null' => true, 'default' => 0))
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