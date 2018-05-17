<?php

use Phinx\Migration\AbstractMigration;

class AddCustomProgressBarToOrg extends AbstractMigration
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
        $table = $this->table('organizations');
        if(!$table->hasColumn('use_custom_progress_bar')){
            $table->addColumn('use_custom_progress_bar','integer',array('limit' => 1,'default' => '0'))->update();
        }
        if(!$table->hasColumn('custom_progress_bar')){
            $table->addColumn('custom_progress_bar','string',array('null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}