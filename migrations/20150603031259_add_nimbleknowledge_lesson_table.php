<?php

use Phinx\Migration\AbstractMigration;

class AddNimbleknowledgeLessonTable extends AbstractMigration
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
        CREATE TABLE `nimbleknowledge_lesson` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `pageid` INT(10) NOT NULL,
        `email` VARCHAR(150) NOT NULL,
        `score` INT(8) NULL,
        `date_created` DATETIME NULL,
        `date_scored` DATETIME NULL,
        PRIMARY KEY (`id`));
SQL;

        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
        DROP TABLE `meglms`.`nimbleknowledge_lesson`;
SQL;
        $this->execute($sql);
    }
}