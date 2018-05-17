<?php

use Phinx\Migration\AbstractMigration;

class AddRequiredPages extends AbstractMigration
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
        $table = $this->table('pages');
        if(!$table->hasColumn('required_pages')){
            $table->addColumn('required_pages','string')->update();
        }

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('pages');

        if($table->hasColumn('required_pages')){
            $table->removeColumn('required_pages')->update();
        }

    }
}