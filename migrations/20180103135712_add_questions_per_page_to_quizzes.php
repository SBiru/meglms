<?php


use Phinx\Migration\AbstractMigration;

class AddQuestionsPerPageToQuizzes extends AbstractMigration
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

    /**
     * Migrate Up.
     */
    public function up()
    {
        $sql = <<<SQL
        ALTER TABLE quizzes
        ADD COLUMN questions_per_page INT(2) DEFAULT -1;
SQL;
        $this->execute($sql);
    }
    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        ALTER TABLE quizzes
        DROP questions_per_page;
SQL;
        $this->execute($sql);
    }
}
