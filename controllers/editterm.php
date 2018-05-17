<?php
require_once'_utils.php';
global $PATHS, $DB;
$user_id = is_admin_user(is_valid_user($_SESSION,true),$DB,true);


class EditTerm {
    public $DB;
    public $user_id;

    function __construct($db,$user_id) {
        $this->DB=$db;
        $this->user_id=$user_id;
    }

    public function get($term_id){
        $DB = $this->DB;
        $data = new \stdClass();
        if($term_id > 0) {

            $query = "SELECT id,name,start_date,end_date FROM terms where id = {$term_id}";

            $result = $DB->mysqli->query($query);

            if($result && $result->num_rows > 0) {
                while($row = $result->fetch_object()) {
                    $data->term = clone $row;
                }
            }
        }
        header('Content-Type: application/json');
        print json_encode($data);

    }

    public function save($input)
    {
        $DB = $this->DB;
        $data = new \stdClass();
        if(!(isset($input->name) && $input->name != "")){
            throwError("Term name must not be empty");
        }
        if(!(isset($input->start_date) && $input->start_date != "")){
            throwError("Start date must not be empty");
        }
        $date = date_parse($input->start_date);
        if (!($date["error_count"] == 0 && checkdate($date["month"], $date["day"], $date["year"]))){
            throwError("Start date is invalid");
        }

        if(!(isset($input->end_date) && $input->end_date != "")){
            throwError("Start date must not be empty");
        }
        $date = date_parse($input->end_date);
        if (!($date["error_count"] == 0 && checkdate($date["month"], $date["day"], $date["year"]))){
            throwError("End date is invalid");
        }

        $mysql_name   = $DB->mysqli->real_escape_string($input->name);

        $query = "INSERT INTO terms (name, start_date, end_date)
                  VALUES ('{$mysql_name}','{$input->start_date}','{$input->end_date}')";

        $DB->mysqli->query($query);
        if($DB->mysqli->errno!=0){
            throwError("An unexpected error has occurred");
        }
        else{
            $data->message="successful";
            $data->term_id=$DB->mysqli->insert_id;
            header('Content-Type: application/json');
            print json_encode($data);
        }

    }
    public function update($input)
    {
        $DB = $this->DB;
        $data = new \stdClass();
        $term_id = $input->id;

        $set = 'SET ';
        if((isset($input->name) && $input->name != "")){
            $mysql_name   = $DB->mysqli->real_escape_string($input->name);
            $set .= " name = '{$mysql_name}',";
        }
        if((isset($input->start_date) && $input->start_date != "")){
            $date = date_parse($input->start_date);
            if ($date["error_count"] == 0 && checkdate($date["month"], $date["day"], $date["year"])){
                $set .= " start_date = '{$input->start_date}',";
            }
        }
        if((isset($input->end_date) && $input->end_date != "")){
            $date = date_parse($input->end_date);
            if ($date["error_count"] == 0 && checkdate($date["month"], $date["day"], $date["year"])){
                $set .= " end_date = '{$input->end_date}',";
            }
        }

        $set = substr($set,0,-1);

        $query = "UPDATE terms {$set} WHERE id={$term_id}";
        $DB->mysqli->query($query);
        if($DB->mysqli->errno!=0){
            throwError("An unexpected error has occurred");
        }
        else{
            $data->message="successful";
            header('Content-Type: application/json');
            print json_encode($data);
        }

    }
    public function addclass($input)
    {
        $DB = $this->DB;
        $data = new \stdClass();
        if(!(isset($input->termId) && is_numeric($input->termId) && $input->termId >0 )){
            throwError("Invalid term id");
        }
        if(!(isset($input->classId) && is_numeric($input->classId) && $input->classId >0 )){
            throwError("Invalid class id");
        }
        $query = "SELECT id from terms where id = {$input->termId}";
        $result = $DB->mysqli->query($query);
        if($result->num_rows==0){
            throwError("Term does not exist");
        }

        $query = "UPDATE classes set term_id = {$input->termId} where id = {$input->classId}";
        $DB->mysqli->query($query);
        if($DB->mysqli->errno!=0){
            throwError("An unexpected error has occurred");
        }
        else{
            $data->message="successful";
            header('Content-Type: application/json');
            print json_encode($data);
        }

        $data = new \stdClass();
    }
    public function delete_($input)
    {
        $DB = $this->DB;
        $term_id = $input->id;
        $data = new \stdClass();

        $query = "SELECT id FROM classes where term_id = {$term_id}";
        $result = $DB->mysqli->query($query);
        if($result->num_rows > 0){
            throwError("This term can't be deleted. It has classes associated to it");
        }
        $query = "DELETE FROM terms where id = {$term_id}";
        $DB->mysqli->query($query);
        throwError("successful");
    }

}

function main($uri,$user_id){
    global $DB;
    $action = get_action('/editterm/',$uri);
    $editterm = new EditTerm($DB,$user_id);

    if(is_numeric($action) && $action > 0){
        $editterm->get($action);
    }
    else if ($action == 'save'){
        $editterm->save(get_input());
    }
    else if ($action == 'update'){
        $editterm->update(get_input());
    }
    else if ($action == 'delete'){
        $editterm->delete_(get_input());
    }
    else if ($action == 'addclass'){
        $editterm->addclass(get_input());
    }
}


$uri = strtok($_SERVER['REQUEST_URI'], '?');
if (substr($uri,0,9)=='/editterm'){
    main($uri,$user_id);
}
?>