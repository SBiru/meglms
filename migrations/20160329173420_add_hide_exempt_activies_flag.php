<?php

use Phinx\Migration\AbstractMigration;

class AddHideExemptActiviesFlag extends AbstractMigration
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
        $table = $this->table('classes');
        if(!$table->hasColumn('hide_exempted_activities')){
            $table->addColumn('hide_exempted_activities','integer',array('limit' => 1,'default' => '0'))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}