<?php

use Phinx\Migration\AbstractMigration;

class TimedReviewPage extends AbstractMigration
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
        $table->addColumn('timed_id', 'integer')
              ->addColumn('timed_limit', 'integer')
              ->addColumn('timed_pause', 'integer')
              ->update();
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('pages');
        $table->removeColumn('timed_id')
              ->removeColumn('timed_limit')
              ->removeColumn('timed_pause')
              ->update();
    }
}
