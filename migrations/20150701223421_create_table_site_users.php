<?php

use Phinx\Migration\AbstractMigration;

class CreateTableSiteUsers extends AbstractMigration
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
        if (!$this->hasTable('site_users')) {
            $table = $this->table('site_users', array('id' => false, 'primary_key' => array('site_id','user_id')));
            $table->addColumn('site_id', 'integer', array('null' => false))
                ->addColumn('user_id', 'integer', array('null' => false))
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