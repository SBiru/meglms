<?php

use Phinx\Migration\AbstractMigration;

class AddTotalScoreIncludingNonDue extends AbstractMigration
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
        $table = $this->table('progress_report');
        if(!$table->hasColumn('total_score_including_non_due')){
            $table->addColumn('total_score_including_non_due','float',array('null'=>true))
                ->addColumn('completed_score','float',array('null'=>true))
                ->update();
        }
    }

}
