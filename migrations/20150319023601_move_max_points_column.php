<?php

use Phinx\Migration\AbstractMigration;

class MoveMaxPointsColumn extends AbstractMigration
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
ALTER TABLE `quiz_scores`
CHANGE COLUMN `max_points` `max_points` INT(11) NULL AFTER `submitted`;
SQL;
        $this->execute($sql);

    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE `quiz_scores`
CHANGE COLUMN `max_points` `max_points` INT(11) NULL AFTER `score`;
SQL;
        $this->execute($sql);
    }
}