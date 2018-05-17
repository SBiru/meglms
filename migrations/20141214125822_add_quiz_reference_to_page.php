<?php

use Phinx\Migration\AbstractMigration;

class AddQuizReferenceToPage extends AbstractMigration
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
        ALTER TABLE pages
        ADD COLUMN quiz_id INT(11) NULL;
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE pages
DROP quiz_id
SQL;
        $this->execute($sql);
    }
}