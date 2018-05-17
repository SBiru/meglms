<?php

use Phinx\Migration\AbstractMigration;

class AddExcludeClassFromAlerts extends AbstractMigration
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
        $table = $this->table('classes');
        if(!$table->hasColumn('exclude_from_alerts')) {
            $table->addColumn('exclude_from_alerts', 'integer', array( 'limit'=>1,'null' => true,'default' => 0))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}