<?php

use Phinx\Migration\AbstractMigration;

class AddEmailTemplates extends AbstractMigration
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
        if(!$table->hasColumn('email_header_template')){
            $table->addColumn('email_header_template','string',array('null'=>true))->update();
        }
        if(!$table->hasColumn('email_footer_template')){
            $table->addColumn('email_footer_template','string',array('null'=>true))->update();
        }
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}