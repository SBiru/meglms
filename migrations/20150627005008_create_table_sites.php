<?php

use Phinx\Migration\AbstractMigration;

class CreateTableSites extends AbstractMigration
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
        if (!$this->hasTable('sites')) {
            $table = $this->table('sites');
            $table->addColumn('name', 'string', array('null' => false))
                ->addColumn('externalId', 'integer', array('null' => false))
                ->addColumn('orgId', 'integer', array('null' => false))
                ->save();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}