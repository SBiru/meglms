<?php


use Phinx\Migration\AbstractMigration;

class AddQuizAdvancedSettings extends AbstractMigration
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
        $quizzes = $this->table('quizzes');
        if(!$quizzes->hasColumn('advanced')){
            $sql = <<<SQL
  
ALTER TABLE quizzes ADD advanced TEXT NULL;
SQL;
        $this->execute($sql);

        $this->updateTrueFalseOptions();
        }
    }
    private function updateTrueFalseOptions(){
        $sql = <<<SQL
update questions q join question_options qo on qo.question_id = q.id set qo.text = CONCAT(UCASE(MID(qo.text,1,1)),MID(qo.text,2)) where q.type = 'truefalse'
SQL;

    }
}
