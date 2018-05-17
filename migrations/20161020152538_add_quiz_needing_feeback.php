<?php

use Phinx\Migration\AbstractMigration;

class AddQuizNeedingFeeback extends AbstractMigration
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
        $table = $this->table('gradebook');
        if(!$table->hasColumn('quiz_needing_grade')) {
            $table->addColumn('quiz_needing_grade', 'integer', array('limit' => 1,'null'=>true))
                ->update();
        }
    }
}
