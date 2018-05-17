<?php

use Phinx\Migration\AbstractMigration;

class AddAndFillCourseIdToQuestions extends AbstractMigration
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
        $table = $this->table('questions');
        if(!$table->hasColumn('class_id')) {
            $table->addColumn('class_id', 'integer',array('null'=>true))
                ->update();
            $fillClassId = <<<SQL
        update questions q
      join bank_questions bq on bq.question_id = q.id
      join banks b on b.id = bq.bank_id
      join classes c on b.course_id = c.courseid
    set q.class_id = c.id
SQL;
            $this->execute($fillClassId);
        }

    }
}
