<?php

use Phinx\Migration\AbstractMigration;

class CreateUserGradebookCategories extends AbstractMigration
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
        $table = $this->table('gradebook_user_categories');
        if(!$table->exists()){
            $table->addColumn('userid','integer')
                ->addColumn('classid','integer')
                ->addColumn('categoryid','integer')
                ->addColumn('max_score','float')
                ->addColumn('actual_score','float')
                ->addColumn('modified_on','timestamp',['default'=>'CURRENT_TIMESTAMP'])
                ->create();
        }
    }
}
