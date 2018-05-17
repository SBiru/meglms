<?php

use Phinx\Migration\AbstractMigration;

class AddMaunallySetDueDates extends AbstractMigration
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
        $table = $this->table('user_due_dates');
        if(!$table->hasColumn('manual_due_date')){
            $table->addColumn('manual_due_date','date',array('null'=>true))->update();
        }
        if(!$table->hasColumn('page_duration')){
            $table->addColumn('page_duration','integer',array('null'=>true))->update();
        }
        $sql = <<<SQL
        ALTER TABLE `user_due_dates`
CHANGE COLUMN `due_date` `due_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ;
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}