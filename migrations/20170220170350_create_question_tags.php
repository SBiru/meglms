<?php

use Phinx\Migration\AbstractMigration;

class CreateQuestionTags extends AbstractMigration
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
        $exists = $this->hasTable('tags');
        if(!$exists){
            $table = $this->table('tags');
            $table->addColumn('org_id','integer')
                ->addColumn('name', 'string', array('limit' => 100))
                ->addColumn('created_by', 'integer')
                ->addColumn('created_on', 'timestamp',array('default'=>"CURRENT_TIMESTAMP"))
                ->addIndex(array('org_id', 'name'), array('unique' => true))
                ->create();
            $this->createInitialTagsUsingBankNames();
        }
        $exists = $this->hasTable('question_tags');
        if(!$exists){
            $table = $this->table('question_tags',array('id' => false,'primary_key' =>array('question_id','tag_id')));
            $table->addColumn('question_id','integer')
                ->addColumn('tag_id','integer')
                ->create();
            $this->assignQuestionToInitialTags();

        }

    }
    private function createInitialTagsUsingBankNames(){
        $sql = <<<SQL
  insert into tags (id,name,org_id,created_by) select
  id,title,org_id,created_by
from banks where org_id > 0
on duplicate key update name = concat(values(name),floor(rand() * 10000));
SQL;
        $this->execute($sql);
    }
    private function assignQuestionToInitialTags(){
        $sql = <<<SQL
  insert into question_tags (question_id, tag_id) select question_id,bank_id from bank_questions
SQL;
        $this->execute($sql);
    }
}

