<?php

use Phinx\Migration\AbstractMigration;

class AddIndexQuestionOptions extends AbstractMigration
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
        $sql = <<<SQL
ALTER TABLE `question_options` ADD INDEX `question_id` ( `question_id` )
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
DROP TABLE quiz_scores;
SQL;
        $this->execute($sql);
    }
}
