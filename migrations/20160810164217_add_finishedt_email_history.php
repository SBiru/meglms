<?php

use Phinx\Migration\AbstractMigration;

class AddFinishedtEmailHistory extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $table = $this->table('user_classes_history');
        if(!$table->hasColumn('completion_email_sent')) {
            $table->addColumn('completion_email_sent', 'text', array( 'limit'=>255,'null' => true))->update();
        }
        if(!$table->hasColumn('is_test_admin')) {
            $table->addColumn('is_test_admin', 'integer', array( 'limit'=>1,'null' => true,'default' => 0))->update();
        }
    }
}
