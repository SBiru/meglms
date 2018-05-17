<?php

use Phinx\Migration\AbstractMigration;

class AddOrgidDeptidUseridToBanks extends AbstractMigration
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
        $table = $this->table('banks');
        $column = $table->hasColumn('org_id');
        if (!$column) {
            $table->addColumn('org_id', 'integer', array('null' => false, 'default' => 0))
                  ->update();
        }
        $column = $table->hasColumn('department_id');
        if (!$column) {
            $table->addColumn('department_id', 'integer', array('null' => false, 'default' => 0))
                  ->update();
        }
        $column = $table->hasColumn('user_id');
        if (!$column) {
            $table->addColumn('user_id', 'integer', array('null' => false, 'default' => 0))
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