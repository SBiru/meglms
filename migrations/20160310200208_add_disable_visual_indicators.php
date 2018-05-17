<?php

use Phinx\Migration\AbstractMigration;

class AddDisableVisualIndicators extends AbstractMigration
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
        $org = $this->table('pages');
        if(!$org->hasColumn('disable_visual_indicators')){
            $org->addColumn('disable_visual_indicators','integer',array('limit' => 1,'default' => '0'))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}