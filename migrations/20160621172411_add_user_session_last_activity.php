<?php

use Phinx\Migration\AbstractMigration;

class AddUserSessionLastActivity extends AbstractMigration
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
        $table = $this->table('user_sessions');
        if(!$table->hasColumn('last_session_start')) {
            $table->addColumn('last_session_start', 'timestamp', array( 'null' => true))->update();
        }if(!$table->hasColumn('current_session_start')) {
            $table->addColumn('current_session_start', 'timestamp', array( 'null' => true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}