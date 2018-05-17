<?php

use Phinx\Migration\AbstractMigration;

class AddIsDeletedToOverride extends AbstractMigration
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
        $org = $this->table('scores_overrides');
        if(!$org->hasColumn('is_deleted')){
            $org->addColumn('is_deleted','integer',array('limit' => 1,'null'=>true,'default'=>0))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}