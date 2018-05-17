<?php

use Phinx\Migration\AbstractMigration;

class AddingSearchQuizColumn extends AbstractMigration
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
ALTER TABLE `pages`
ADD COLUMN `searchquiz` VARCHAR(255) NULL DEFAULT '';
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
    $sql = <<<SQL
ALTER TABLE `pages`
DROP COLUMN `searchquiz`;
SQL;
        $this->execute($sql);
    }
}