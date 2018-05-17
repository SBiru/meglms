<?php

use Phinx\Migration\AbstractMigration;

class AddDescriptionToQuizzes extends AbstractMigration
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
        ALTER TABLE quizzes
        ADD COLUMN `description` VARCHAR(900) NULL;
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
DROP `password`
SQL;
        $this->execute($sql);
    }
}
