<?php

use Phinx\Migration\AbstractMigration;

class IndexForSeveralTables extends AbstractMigration
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
ALTER TABLE class_assignments ADD index class_id ( page_id );
ALTER TABLE pages ADD index unitid ( unitid );
ALTER TABLE pages ADD index hide_activity ( hide_activity );
ALTER TABLE posts ADD index userid ( userid );
ALTER TABLE quiz_scores ADD index user_id ( user_id, quiz_id );
ALTER TABLE units ADD index courseid ( courseid );
ALTER TABLE activity_history ADD index userid ( userid, pageid );
SQL;
        $this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
ALTER TABLE class_assignments DROP key class_id;
ALTER TABLE pages DROP key unitid;
ALTER TABLE pages DROP key hide_activity;
ALTER TABLE posts DROP key userid;
ALTER TABLE quiz_scores DROP key user_id;
ALTER TABLE units DROP key courseid;
ALTER TABLE activity_history DROP key userid;
SQL;
        $this->execute($sql);
    }
}
