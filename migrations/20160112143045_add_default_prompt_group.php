<?php

use Phinx\Migration\AbstractMigration;

class AddDefaultPromptGroup extends AbstractMigration
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
        if(!$table->hasColumn('default_prompt_group')){
            $table->addColumn('default_prompt_group','integer')->update();
        }

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('organizations');

        if($table->hasColumn('default_prompt_group')){
            $table->removeColumn('default_prompt_group')->update();
        }

    }
}