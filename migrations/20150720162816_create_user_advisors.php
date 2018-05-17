<?php

use Phinx\Migration\AbstractMigration;

class CreateUserAdvisors extends AbstractMigration
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
        if (!$this->hasTable('user_advisors')) {
            $table = $this->table('user_advisors', array('id' => false, 'primary_key' => array('userid','studentid')));
            $table->addColumn('userid', 'integer', array('null' => false))
                ->addColumn('studentid', 'integer', array('null' => false))
                ->addColumn('created', 'timestamp', array('default' => 'CURRENT_TIMESTAMP', 'null' => false))
                ->save();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}