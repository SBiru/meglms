<?php

use Phinx\Migration\AbstractMigration;

class AddChatModeCodeToClasses extends AbstractMigration
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
ALTER TABLE `classes`
ADD COLUMN `chat_mode_code` TINYINT(1) NOT NULL DEFAULT 2;
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `classes`
DROP COLUMN `chat_mode_code`;
SQL;
        $this->execute($sql);
    }
}