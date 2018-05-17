<?php

use Phinx\Migration\AbstractMigration;

class CreateProficiencyClasses extends AbstractMigration
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
        $exists = $this->hasTable('proficiency_classes');
        if(!$exists){
            $table = $this->table('proficiency_classes');
            $table->addColumn('classid','integer',['limit'=>1])
                ->addIndex(array('classid'), array('unique' => true))
                ->create();
        }

    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}