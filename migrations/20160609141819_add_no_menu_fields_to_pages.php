<?php

use Phinx\Migration\AbstractMigration;

class AddNoMenuFieldsToPages extends AbstractMigration
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
        if(!$table->hasColumn('no_menu_go_back')){
            $table->addColumn('no_menu_go_back','integer',array('limit'=>'1','null'=>true))->update();
        }if(!$table->hasColumn('new_post_text')){
            $table->addColumn('new_post_text','string',array('limit'=>'255','null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}