<?php

use Phinx\Db\Adapter\MysqlAdapter;
use Phinx\Migration\AbstractMigration;

class PasswordExpirationColumns extends AbstractMigration
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
        $users = $this->table('users');
        if(!$users->hasColumn('password_set_on')){
            $users->addColumn('password_set_on','date')->update();
        }
        if(!$users->hasColumn('password_expires_on')){
            $users->addColumn('password_expires_on','date')->update();
        }
        $org = $this->table('organizations');
        if(!$org->hasColumn('enable_password_expiration')){
            $org->addColumn('enable_password_expiration','integer',array('limit' => 1))->update();
        }
        if(!$org->hasColumn('password_expiration_type')){
            $org->addColumn('password_expiration_type','string',array('limit' => 45))->update();
        }
        if(!$org->hasColumn('password_expiration_time')){
            $org->addColumn('password_expiration_time','string')->update();
        }
        if(!$org->hasColumn('password_expiration_users')){
            $org->addColumn('password_expiration_users','string')->update();
        }


    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}