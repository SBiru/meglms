<?php

use Phinx\Migration\AbstractMigration;

class AddCanEnterAttendaceToGuardians extends AbstractMigration
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
        $table = $this->table('user_guardians');
        if(!$table->hasColumn('can_enter_attendance')){
            $table->addColumn('can_enter_attendance','integer',array('limit' => 1,'null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}