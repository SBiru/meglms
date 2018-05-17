<?php

use Phinx\Migration\AbstractMigration;

class AddAssignmentSubmittedDate extends AbstractMigration
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
ALTER TABLE user_assignments
ADD submitted DATETIME DEFAULT NULL
COMMENT 'The date the student submitted their assignment'
SQL;

        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE user_assignments
DROP submitted
SQL;
        $this->execute($sql);
    }
}