<?php

use Phinx\Migration\AbstractMigration;

class CreateSectionsLmsId extends AbstractMigration
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
        if (!$this->hasTable('sections_LMS_id')) {
            $table = $this->table('sections_LMS_id');
            $table->addColumn('LMS_id', 'integer', array('null' => false))
                ->addColumn('section_id', 'integer', array('null' => false))
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