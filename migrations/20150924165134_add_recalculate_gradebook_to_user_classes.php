<?php

use Phinx\Migration\AbstractMigration;

class AddRecalculateGradebookToUserClasses extends AbstractMigration
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
        $table = $this->table('user_classes');
        $column = $table->hasColumn('recalculate_gradebook');
        if (!$column) {
            $table->addColumn('recalculate_gradebook', 'integer', array('null' => true, 'default' => 0))
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