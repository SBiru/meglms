<?php

use Phinx\Migration\AbstractMigration;

class AddAttendanceOnlyToAttentanceTable extends AbstractMigration
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
        if(!$table->hasColumn('attendance_only')){
            $table->addColumn('attendance_only','integer',array('limit' => 1,'null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}