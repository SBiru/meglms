<?php

use Phinx\Migration\AbstractMigration;

class ChangeSiteExternalIdType extends AbstractMigration
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
        if ($this->hasTable('sites')) {
            $table = $this->table('sites');
            $table->removeColumn('externalId')
                ->update();
            $table->addColumn('externalId', 'string', array('null' => true))
                ->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}