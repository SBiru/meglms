<?php

use Phinx\Migration\AbstractMigration;

class AddRequiredPagesToSuperUnit extends AbstractMigration
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
        $table = $this->table('super_units');
        if(!$table->hasColumn('required_pages')){
            $table->addColumn('required_pages','text',array('null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}