<?php
global $PATHS, $DB;
require_once('sql.php');
function generate_unique($unique_end_length)
{
    $unique_end_length = intval($unique_end_length);
    $rand              = array(
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'k',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z'
    );
    $date              = date("Y-m-d-s-");
    $str               = '';
    $length            = count($rand) - 1;
    for ($i = 0; $i < $unique_end_length; $i++) {
        $str .= $rand[mt_rand(0, $length)];
    }
    return $date . $str;
}

$uri        = strtok($_SERVER['REQUEST_URI'], '?');
$uri        = str_replace('/filesandfolders/', '', $uri);
$json_input = file_get_contents('php://input');
$input      = json_decode($json_input);
$user_id    = intval($_SESSION['USER']['ID']);
$data       = new \stdClass();
$fllefolder = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/";

//viewing files

if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN'])) {
    if ($uri == 'download') {
        $id        = preg_replace('/\s/xsi', '', $_GET['name']);
        $extension = strrpos(preg_replace('/\s/xsi', '', $_GET['path']), '.');
        if ($extension > 0) {
            $extension = substr(preg_replace('/\s/xsi', '', $_GET['path']), $extension);
        } else {
            $extension = '';
        }
        $file = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $id . $extension;
        
        switch ($extension) {
            case ".gif":
                $ctype = "image/gif";
                break;
            case ".png":
                $ctype = "image/png";
                break;
            case ".bmp":
                $ctype = "image/bmp";
                break;
            case ".jpeg":
            case ".jpg":
                $ctype = "image/jpeg";
                break;
            case ".pdf":
                $ctype = "image/pdf";
                break;
            case ".doc":
                $ctype = "application/msword";
                break;
            case ".txt":
            case ".js":
                $ctype = "text/plain";
                break;
            case ".html":
                $ctype = "text/html";
                break;
            case ".zip":
                $ctype = "application/zip";
                break;
            default:
                if (file_exists($file)) {
                    header('Content-Description: File Transfer');
                    header('Content-Type: application/octet-stream');
                    header('Content-Disposition: attachment; filename=' . basename($file));
                    header('Expires: 0');
                    header('Cache-Control: must-revalidate');
                    header('Pragma: public');
                    header('Content-Length: ' . filesize($file));
                    readfile($file);
                    exit;
                }
        }
        header('Content-type: ' . $ctype);
        header("Content-Length: " . (string) (filesize($file)));
        echo file_get_contents($file);
        exit;
    }
    
}

if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {
    
    $fllefolder = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/";
    $orgfolder  = substr(md5('org_' . org_id($DB, $user_id)), -10, -5) . org_id($DB, $user_id) . '/';
    $fllefolder .= $orgfolder;
    checkcreatefolder($fllefolder);
    $userfolder = substr(md5('user_' . $_SESSION['USER']['ID']), -11, -5) . $_SESSION['USER']['ID'] . '/';
    $fllefolder .= $userfolder;
    $org_user_path = $orgfolder . $userfolder;
    checkcreatefolder($fllefolder);
    $uri                  = strtok($_SERVER['REQUEST_URI'], '?');
    $uri                  = str_replace('/filesandfolders/', '', $uri);
    $json_input           = file_get_contents('php://input');
    $input                = json_decode($json_input);
    $user_id              = intval($_SESSION['USER']['ID']);
    $data                 = new \stdClass();
    $PATHS->org_user_path = $org_user_path;
    
    switch ($uri) {
        case 'show':
            checkAddClassFolders($DB, $user_id);
            $PATHS->base_site_public_path = preg_replace('@^\/@', '../', $PATHS->base_site_public_path);
            header('Location: ' . $PATHS->base_site_public_path . 'views/FileManagerApp.html');
            exit;
        case 'initial':
            if (!isset($input->params)) {
                $folder = '';
                $class_id = '';
            } else {
                $folder = $input->params->path;

                if (!isset($input->params->class_id)){
                $class_id = '';
                }
                else{
                $class_id = $input->params->class_id;
        }
            }
            $folder       = preg_replace('@^\/@', '', $folder);
            $data->result = array();


            /*
                Classes folders and files Start
            */

                if ($class_id != '')
                {
                    if (!classpermission($DB, $user_id,$class_id)){
                    }
                }


            $class_folders = checkAddClassFolders($DB, $user_id, $folder);
            if ($class_folders){
            foreach ($class_folders as $row) {
                $tmp         = new \stdClass();
                $tmp->name   = $row->filename;
                $tmp->class_id   = $row->class_id;
                $tmp->rights = '';
                $tmp->size = '4';
                $tmp->time = $row->pdate;
                $tmp->date = $row->pdate;
                if ($row->ptype == 'folder') {
                    $tmp->type    = 'dir';
                    $tmp->urlpath = '';
                }
                $data->result[] = $tmp;
            }
        }

            /*
                Classes folders and files End
            */

            $query  = "select * from filesuploaded where (user_id='$user_id' or class_id = '".$class_id."') and folder = '" . $folder . "'";
            //$query  = "select * from filesuploaded where (user_id='$user_id') and folder = '" . $folder . "'";

            $result = $DB->mysqli->query($query);
            
            if ($result && $result->num_rows > 0) {

                while ($row = $result->fetch_object()) {
                    if (($row->filename == 'My Folder') && ($row->user_id != $user_id)) {
                        continue;
                    }else if ((preg_match('@^My\sFolder@',$row->folder))  && ($row->user_id != $user_id)) {
                        continue;
                    }
                    $tmp         = new \stdClass();
                    $tmp->name   = $row->filename;
                    $tmp->class_id   = $row->class_id;
                    $tmp->rights = '';
                    if (!preg_match('/\d/', $row->size)) {
                        $tmp->size = '4096';
                    } else {
                        $tmp->size = intval($row->size / 1000);
                    }
                    
                    if ($tmp->size == 0)
                        $tmp->size = 4;
                    
                    $tmp->time = $row->pdate;
                    $tmp->date = $row->pdate;
                    $tmp->id   = $row->id;
                    if ($row->ptype == 'folder') {
                        $tmp->type    = 'dir';
                        $tmp->urlpath = '';
                    } else {
                        $tmp->type    = 'file';
                        $tmp->urlpath = $org_user_path . $row->folder . '/' . $row->filename;
                    }
                    $data->result[] = $tmp;
                }
            }
            header('Content-Type: application/json');
            print json_encode($data);
            exit;
            break;
        case 'createfolder':
            $folder     = $DB->mysqli->real_escape_string($input->params->path);
            $id         = generate_unique(10);
            $foldername = $DB->mysqli->real_escape_string($input->params->name);
            $class_id = $DB->mysqli->real_escape_string($input->params->class_id);

            create_folder($DB, $id, $folder, $foldername, $user_id, $fllefolder,$class_id);
            break;
        case 'upload': //Upload Start
            if (isset($_FILES['file-1']['name'])) {
                
                //Dealing with Zip Start
                if (preg_match('/(\.zip)/xsi', $_FILES['file-1']['name']) && $_POST['unzip'] == "yes") {
                    $destination = preg_replace('@^\/@', '', $_POST['destination']);
                    if (isset($_POST['class_id'])){
                    $class_id = $_POST['class_id'];
                    }
                    else{
                     $class_id = '';   
                    }
                    $zip         = zip_open($_FILES['file-1']['tmp_name']);
                    while ($zip_handle = zip_read($zip)) {
                        $id             = generate_unique(10);
                        $folder         = preg_replace('@\/$@', '', zip_entry_name($zip_handle));
                        $locationfolder = $folder;
                        
                        echo '$locationfolder = ' . $locationfolder . "\n\n";
                        
                        $filename = '';
                        preg_match('@\/(?:.(?!\/))+$@', $folder, $matches);
                        if (isset($matches[0])) {
                            $filename = preg_replace('@\/@', '', $matches[0]);
                        }
                        
                        if (!preg_match('@\/@', $folder)) {
                            $filename = $folder;
                            $folder   = '';
                        }
                        
                        $folder = preg_replace('/' . $filename . '/', '', $folder);
                        $folder = preg_replace('@\/$@', '', trim($folder));
                        
                        if (preg_match('/\w/', $destination)) {
                            $folder = $destination . '/' . $folder;
                            $folder = preg_replace('@\/$@', '', trim($folder));
                        }
                        //file or folder
                        if (preg_match('@\.@', $filename)) {
                            $extension = strrpos($filename, '.');
                            if ($extension > 0) {
                                $extension = substr($filename, $extension);
                            } else {
                                $extension = '';
                            }
                            $destination_file = $fllefolder . $locationfolder;
                            
                            echo '$destination_file = ' . $destination_file . "\n\n";
                            $size = zip_entry_filesize($zip_handle);
                            $open = fopen($destination_file, 'w+');
                            fwrite($open, zip_entry_read($zip_handle, zip_entry_filesize($zip_handle)));
                            zip_entry_close($zip_handle);
                            fclose($open);
                            
                            if (preg_match('/thumbs\.db/xsi', $destination_file)) {
                                continue;
                            }
                            $query = "insert into filesuploaded set id='$id',filename='" . $filename . "',class_id='" . $class_id . "',ext='$extension',size='" . $size . "',user_id='" . $user_id . "',folder='" . $folder . "'";
                            $DB->mysqli->query($query);
                            
                        } else {
                            create_folder($DB, $id, $folder, $filename, $user_id, $fllefolder,$class_id);
                        }
                        echo $folder . ' = ' . $filename . "\n";
                    }
                    exit;
                }
                //Dealing with Zip End
                
            }
            
            require_once('filesupload.php');
            break; //Upload End
        case 'remove': //Remove Start
            if ($input->params->type == 'file') {
                $filelocation = $fllefolder . preg_replace('@^\/@', '', trim($input->params->path));
                $extension    = strrpos($input->params->name, '.');
                if ($extension > 0) {
                    $extension = substr($input->params->name, $extension);
                    $file      = $input->params->id . $extension;
                } else {
                    $extension = '';
                }
                if (file_exists($filelocation))
                    unlink($filelocation);
                removerow($DB, $input->params->id);
            } else {
                $path    = preg_replace('@^\/@', '', $input->params->path);
                $results = checkfolder($DB, $path, $user_id, $input);
                
                $folderarray = array();
                $lastfolder  = '';
                $count       = 0;
                foreach ($results as $row) {
                    if ($row->ptype == 'file') {
                        if (file_exists($fllefolder . $row->id . $row->ext))
                            unlink($fllefolder . $row->id . $row->ext);
                    } elseif ($row->ptype == 'folder') {
                        $explodecount = count(explode('/', $row->folder));
                        if ($explodecount > $count) {
                            $lastfolder = $row->filename;
                            $count      = $explodecount;
                        }
                        $folderarray[] = $row->folder;
                    }
                    removerow($DB, $row->id);
                }
                folder_ordering($folderarray, $fllefolder, $lastfolder);
            }
            exit(1);
            break; //Remove End
        default:
            echo "nothing";
    }
}
exit();

Function checkfolder($DB, $path, $user_id, $input)
{
    $rowClass    = array();
    $patchsearch = '';
    preg_match('@\/(?:.(?!\/))+$@', $path, $matches);
    if (isset($matches[0])) {
        $filename    = preg_replace('@\/@', '', $matches[0]);
        $patchsearch = preg_replace('@' . $matches[0] . '$@', '', $path);
    } else {
        $filename    = $path;
        $path_search = '';
    }
    
    $query  = "select  id,ext,ptype,folder,filename from filesuploaded where folder = '$path' and user_id='{$user_id}' limit 1";
    $result = $DB->mysqli->query($query);
    if ($result && $result->num_rows == 1) {
        $rowClass[] = $result->fetch_object();
    }
    
    $query  = "select  id,ext,ptype,folder,filename from filesuploaded where filename = '$filename' and folder = '$patchsearch' and user_id='{$user_id}' limit 1";
    $result = $DB->mysqli->query($query);
    if ($result && $result->num_rows == 1) {
        $rowClass[] = $result->fetch_object();
    }
    
    $query  = "select  id,ext,ptype,folder,filename from filesuploaded where folder like '" . $path . "/%' and user_id='{$user_id}'";
    $result = $DB->mysqli->query($query);
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_object()) {
            $rowClass[] = $row;
        }
    }
    return $rowClass;
}

Function removerow($DB, $id)
{
    $query = "delete from filesuploaded where id = '" . $id . "'";
    $DB->mysqli->query($query);
}

function create_folder($DB, $id, $folder, $foldername, $user_id, $fllefolder,$class_id)
{
    $explode = explode('/', $folder);
    foreach ($explode as $key => $value) {
        $fllefolder .= $value . '/';
        checkcreatefolder($fllefolder);
    }
    checkcreatefolder($fllefolder . $foldername . '/');
    $query = "insert into filesuploaded SET id='{$id}',folder='{$folder}',filename='{$foldername}',class_id='{$class_id}',user_id='{$user_id}',ptype='folder',ext='',size='0'";
    $DB->mysqli->query($query);
}

function org_id($DB, $user_id)
{
    $query  = "select organizationid from users where id='{$user_id}' limit 1";
    $result = $DB->mysqli->query($query);
    if ($result->num_rows > 0) {
        $row = $result->fetch_object();
        return $row->organizationid;
    }
    exit('no org');
}

function checkcreatefolder($fllefolder)
{
    $fllefolder = preg_replace('@\/\/$@', '/', $fllefolder);
    if (!file_exists($fllefolder)) {
        mkdir($fllefolder, 0777, true);
    }
}

function folder_ordering($folderarray, $fllefolder, $lastfolder)
{
    if (!isset($folderarray[0]))
        return;
    $ordered = array();
    $count   = 0;
    foreach ($folderarray as $key => $value) {
        $explode = explode('/', $value);
        if (count($explode) > $count) {
            array_push($ordered, $value);
        } else {
            array_unshift($ordered, $value);
        }
        $count = count($explode);
    }
    checkremovefolder(array_reverse($ordered), $fllefolder, $lastfolder);
}

function checkremovefolder($ordered, $fllefolder, $lastfolder)
{
    $last = $ordered[0];
    array_unshift($ordered, $last . '/' . $lastfolder);
    foreach ($ordered as $key => $value) {
        if (!file_exists($fllefolder . $value))
            continue;
        
        if ($handle = opendir($fllefolder . $value)) {
            $hasfiles = 0;
            while (false !== ($entry = readdir($handle))) {
                if ($entry != "." && $entry != "..") {
                    $hasfiles = 1;
                }
            }
            closedir($handle);
        }
        if ($hasfiles === 0) {
            if (file_exists($fllefolder . $value)) {
                rmdir($fllefolder . $value);
                usleep(50000);
            }
        }
    }
}

function checkAddClassFolders($DB, $user_id, $folder='')
{
$return = 0;
    checkcratepersonal($DB, $user_id);
    if ($folder != ''){
        return false;
    }
    /*
    $query = "select classes.id,classes.name
from 
users , user_classes , classes , courses , departments , organizations
where 
users.id = " . $user_id . "
AND
user_classes.userid = users.id
AND
user_classes.is_teacher = 1
AND
classes.id = user_classes.classid
AND
courses.id = classes.courseid
AND
departments.id = classes.id
group by classes.id";
*/
  $query = "select classes.id,classes.name
from 
users , user_classes , classes , courses 
where 
users.id = " . $user_id . "
AND
user_classes.userid = users.id
AND
user_classes.is_teacher = 1
AND
classes.id = user_classes.classid
group by classes.id";    
    $data   = array();
    $result = $DB->mysqli->query($query);
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_object()) {
            $query = "select * from filesuploaded where class_id = '" . $row->id . "' and filename = '" . addslashes($row->name) . "'";
            $resultfileuploaded = $DB->mysqli->query($query) or die($query);
            if ($resultfileuploaded && $resultfileuploaded->num_rows == 0) {
                $return = 0;
                $id     = generate_unique(10);
                $query  = "
insert into filesuploaded 
SET id='{$id}',
class_id='" . $row->id . "',
filename='" . $row->name . "',
folder='',
user_id='0',
ptype='folder',
ext='',size='0'
";

                $DB->mysqli->query($query);
            } else {
                $return = 1;
                $data[] = $resultfileuploaded->fetch_object();
            }
        }
    }
    if ($return == 1) {
        return $data;
    }
    else {return false;}
}

function checkcratepersonal($DB, $user_id){
$id     = generate_unique(10);
    $query = "select * from filesuploaded where user_id = '" . $user_id . "' and filename = 'My Folder'";
$resultfileuploaded = $DB->mysqli->query($query) or die($query);
            if ($resultfileuploaded && $resultfileuploaded->num_rows == 0) {
                $query  = "
insert into filesuploaded 
SET id='{$id}',
class_id='0',
filename='My Folder',
folder='',
user_id='" . $user_id . "',
ptype='folder',
ext='',size='4096'
";

                $DB->mysqli->query($query);


            }


}

function classpermission($DB, $user_id,$class_id){

    $query = "select classes.id
from 
users , user_classes , classes , courses , departments , organizations
where 
users.id = '".$user_id."'
AND
user_classes.userid = users.id
AND
user_classes.is_teacher = 1
AND
classes.id = user_classes.classid
AND
courses.id = classes.courseid
AND
classes.id = '".$class_id."'
group by classes.id";

 $result = $DB->mysqli->query($query);
 if ($result->num_rows > 0) {
 }
 return false;
}