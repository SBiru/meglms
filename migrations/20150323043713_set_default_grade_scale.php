<?php

use Phinx\Migration\AbstractMigration;

class SetDefaultGradeScale extends AbstractMigration
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
UPDATE classes SET a_plus_max = 100, a_plus_min = 96, a_max = 95, a_min = 93, a_minus_max = 92, a_minus_min = 90,
b_plus_max = 89, b_plus_min = 86, b_min = 83, b_max = 85, b_minus_max = 82, b_minus_min = 80, c_plus_max = 79, c_plus_min = 76,
c_max = 75, c_min = 73, c_minus_max = 72, c_minus_min = 70, d_plus_max = 69, d_plus_min = 66,d_max = 65, d_min = 63,
d_minus_max = 62, d_minus_min = 60
SQL;
$this->execute($sql);
    }

    /**
     * Migrate Down.
     */
    public function down()
    {
        $sql = <<<SQL
UPDATE classes SET a_plus_max = NULL, a_plus_min = NULL, a_max = NULL, a_min = NULL, a_minus_max = NULL, a_minus_min = NULL,
b_plus_max = NULL, b_plus_min = NULL, b_min = NULL, b_max = NULL, b_minus_max = NULL, b_minus_min = NULL, c_plus_max = NULL, c_plus_min = NULL,
c_max = NULL, c_min = NULL, c_minus_max = NULL, c_minus_min = NULL, d_plus_max = NULL, d_plus_min = NULL,d_max = NULL, d_min = NULL,
d_minus_max = NULL, d_minus_min = NULL
SQL;
        $this->execute($sql);
    }
}