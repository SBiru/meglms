<?php

use Phinx\Migration\AbstractMigration;

class AddColumnsToAttendance extends AbstractMigration
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
        $table = $this->table('attendance');
        if(!$table->hasColumn('reason')){
            $table->addColumn('reason','string',array('limit' => 100,'null'=>true))->update();
        }
        if(!$table->hasColumn('modified_on')){
            $table->addColumn('modified_on','timestamp',array('default'=>'CURRENT_TIMESTAMP'))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}