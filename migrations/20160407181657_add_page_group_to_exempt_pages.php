<?php

use Phinx\Migration\AbstractMigration;

class AddPageGroupToExemptPages extends AbstractMigration
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
        $table = $this->table('class_exempted');
        if(!$table->hasColumn('page_group')){
            $table->addColumn('page_group','integer',array('limit' => 1,'null'=>true))->update();
        }
        if(!$table->hasColumn('all_pages')){
            $table->addColumn('all_pages','integer',array('limit' => 1,'null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}