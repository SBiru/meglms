<?php

use Phinx\Migration\AbstractMigration;

class AddListeningContentTypes extends AbstractMigration
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
        $table->addColumn('listen_course', 'text', ['null' => true])
              ->addColumn('listen_lesson', 'text', ['null' => true])
              ->addColumn('listen_numEx', 'integer')
              ->changeColumn('layout', 'text', ['null' => false])
              ->update();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('pages');
        $table->removeColumn('listen_course')
              ->removeColumn('listen_lesson')
              ->removeColumn('listen_numEx')
              ->update();
    }
}
