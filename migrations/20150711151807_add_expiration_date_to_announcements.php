<?php

use Phinx\Migration\AbstractMigration;

class AddExpirationDateToAnnouncements extends AbstractMigration
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
ALTER TABLE `announcements`
ADD COLUMN `expiration_date` DATE NULL AFTER `created`;

SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `announcements`
DROP COLUMN `expiration_date`
SQL;
        $this->execute($sql);
    }


}