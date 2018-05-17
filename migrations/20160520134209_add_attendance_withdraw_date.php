<?php

use Phinx\Migration\AbstractMigration;

class AddAttendanceWithdrawDate extends AbstractMigration
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
        if(!$table->hasColumn('attendance_withdraw_date')){
            $table->addColumn('attendance_withdraw_date','date',array('null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}