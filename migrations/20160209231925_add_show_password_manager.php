<?php

use Phinx\Migration\AbstractMigration;

class AddShowPasswordManager extends AbstractMigration
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
        $org = $this->table('organizations');
        if(!$org->hasColumn('show_password_manager')){
            $org->addColumn('show_password_manager','integer',array('limit' => 1,'null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}