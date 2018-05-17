<?php

use Phinx\Migration\AbstractMigration;

class AddFileUploadOnly extends AbstractMigration
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
        if(!$table->hasColumn('allow_upload_only_post')) {
            $table->addColumn('allow_upload_only_post', 'integer', array( 'limit'=>1,'null' => true,'default' => 0))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}