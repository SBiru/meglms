<?php

use Phinx\Migration\AbstractMigration;

class AddUniqueKeyToSectionsLmsId extends AbstractMigration
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
            ALTER TABLE sections_LMS_id ADD CONSTRAINT lms_id_section_id UNIQUE (LMS_id, section_id);
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {

    }
}