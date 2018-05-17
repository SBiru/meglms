<?php

use Phinx\Migration\AbstractMigration;

class AddSuperUnitToUnit extends AbstractMigration
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
        if(!$table->hasColumn('superunitid')){
            $table->addColumn('superunitid','integer',array('default'=>'0'))
            ->addIndex(array('courseid', 'name','superunitid'), array('unique' => true,'name'=>'class_superunit'))
            ->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('units');
        if($table->hasColumn('superunitid')){
            $table->removeColumn('superunitid')->update();
        }
    }
}