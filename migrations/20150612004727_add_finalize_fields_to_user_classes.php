<?php

use Phinx\Migration\AbstractMigration;

class AddFinalizeFieldsToUserClasses extends AbstractMigration
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
        if (!$table->hasColumn('finalizedBy')) {
            $table->addColumn('finalizedBy', 'integer', array('null' => true))
                  ->update();
        }
        if (!$table->hasColumn('finalizedOn')) {
            $table->addColumn('finalizedOn', 'timestamp', array('null' => true))
                  ->update();
        }
        if (!$table->hasColumn('finalizedComments')) {
            $table->addColumn('finalizedComments', 'string', array('null' => true))
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