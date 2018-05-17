<?php

use Phinx\Migration\AbstractMigration;

class ChangingLanguageColumnName extends AbstractMigration
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
ALTER TABLE modules
CHANGE COLUMN target_languange target_language VARCHAR(2) NULL DEFAULT 'en'
SQL;
      $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE modules
CHANGE COLUMN target_language target_languange VARCHAR(2) NULL DEFAULT 'en'
SQL;
        $this->execute($sql);
    }
}