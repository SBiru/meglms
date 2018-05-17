<?php

use Phinx\Migration\AbstractMigration;

class AddMaxPointsToQuestionsTable extends AbstractMigration
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
ALTER TABLE `questions`
ADD COLUMN `max_points` INT(11) NULL DEFAULT '1';
SQL;
        $this->execute($sql);


    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `questions`
DROP COLUMN `max_points`;
SQL;
        $this->execute($sql);
    }
}