<?php

use Phinx\Migration\AbstractMigration;

class AddHideUnit extends AbstractMigration
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
        $table = $this->table('units');
        if(!$table->hasColumn('hide_from_student')){
            $table->addColumn('hide_from_student','integer',array('default' => '0'))->update();
        }

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('units');

        if($table->hasColumn('hide_from_student')){
            $table->removeColumn('hide_from_student')->update();
        }

    }
}