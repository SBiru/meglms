<?php

use Phinx\Migration\AbstractMigration;

class AddQuestionColumnToPage extends AbstractMigration
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
        if(!$table->hasColumn('question')){
            $table->addColumn('question','string')->update();
        }

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $table = $this->table('pages');

        if($table->hasColumn('question')){
            $table->removeColumn('question')->update();
        }

    }
}