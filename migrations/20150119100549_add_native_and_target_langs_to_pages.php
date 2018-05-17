<?php

use Phinx\Migration\AbstractMigration;

class AddNativeAndTargetLangsToPages extends AbstractMigration
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
        $table->addColumn('native_lang', 'text', ['null' => true])
              ->addColumn('target_lang', 'text', ['null' => true])
              ->update();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('pages');
        $table->removeColumn('native_lang')
              ->removeColumn('target_lang')
              ->update();

    }
}
