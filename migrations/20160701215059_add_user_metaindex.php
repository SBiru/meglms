<?php

use Phinx\Migration\AbstractMigration;

class AddUserMetaindex extends AbstractMigration
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
        $table = $this->table('user_meta');
        $table->addIndex(array('userid','meta_key'), array('unique' => true, 'name' => 'idx_user_key'))
            ->save();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}