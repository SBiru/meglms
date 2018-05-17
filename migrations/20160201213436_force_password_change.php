<?php

use Phinx\Migration\AbstractMigration;

class ForcePasswordChange extends AbstractMigration
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
        $page = $this->table('pages');
        if(!$page->hasColumn('last_password_change')){
            $page->addColumn('last_password_change','timestamp',array('null'=>true))->update();
        }
        $org = $this->table('organizations');
        if(!$org->hasColumn('page_password_config')){
            $org->addColumn('page_password_config','string',array('null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}