
<?php

use Phinx\Migration\AbstractMigration;

class AddExternalIdToUsers extends AbstractMigration
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
ALTER TABLE `users`
ADD COLUMN `external_id` VARCHAR(100) NULL;
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `users`
DROP COLUMN `external_id`;
SQL;
        $this->execute($sql);
    }
}