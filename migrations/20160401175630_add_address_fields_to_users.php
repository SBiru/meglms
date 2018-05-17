<?php

use Phinx\Migration\AbstractMigration;

class AddAddressFieldsToUsers extends AbstractMigration
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
        $table = $this->table('users');
        if(!$table->hasColumn('address')){
            $table->addColumn('address','string',array('limit' => 500,'null' => true))->update();
        }
        if(!$table->hasColumn('city')){
            $table->addColumn('city','string',array('limit' => 100,'null' => true))->update();
        }
        if(!$table->hasColumn('state')){
            $table->addColumn('state','string',array('limit' => 50,'null' => true))->update();
        }
        if(!$table->hasColumn('country')){
            $table->addColumn('country','string',array('limit' => 50,'null' => true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}