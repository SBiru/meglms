<?php

global $PATHS, $DB,$app;

use English3\Controller\ClassesController;
use English3\Controller\GradebookController;
use English3\Controller\Grader\GraderActivity;
use English3\Controller\Grader\GraderActivitySQL;
use English3\Controller\Organization\OrganizationController;
use English3\Controller\Posts\SiblingServerFinder;
use English3\Controller\PostsController;
use English3\Controller\QuizzesAndQuestions\AfterLeavePageQuestions;
use English3\Controller\Utility;

require_once('sql.php');
require_once('usertools/orm.php');
$reader = $app['dbs']['mysql_read'];
function generate_unique($unique_end_length)
{
    $unique_end_length = intval($unique_end_length);
    
    $rand = array(
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
    
    $date = date("Y-m-d-s-");
    $str  = '';
    
    $length = count($rand) - 1;
    
    for ($i = 0; $i < $unique_end_length; $i++) {
        $str .= $rand[mt_rand(0, $length)];
    }
    
    return $date . $str;
}

function orderPostMessages($messages, $user_id, $user_is_teacher)
{
    //print "NEED TO ORDER: ";
    //print_r($messages);
    
    
    $temp_data = array();
    
    foreach ($messages as $message) {
        $tmp = new \stdClass();
        
        $tmp = clone $message;
        
        
        if ($tmp->is_private) {
            if ($user_is_teacher) {
                $temp_data["{$message->id}"]                 = $tmp;
                $temp_data["{$message->id}"]->replying_posts = array();
            } else {
                if ($user_id == $tmp->user_id) {
                    $temp_data["{$message->id}"]                 = $tmp;
                    $temp_data["{$message->id}"]->replying_posts = array();
                } else {
                    if ($tmp->is_teacher) {
                        $temp_data["{$message->id}"]                 = $tmp;
                        $temp_data["{$message->id}"]->replying_posts = array();
                    } else {
                        ;
                    }
                }
            }
        } else {
            $temp_data["{$message->id}"]                 = $tmp;
            $temp_data["{$message->id}"]->replying_posts = array();
        }
    }
    
    foreach ($messages as $message) {
        if (isset($temp_data["{$message->post_reply_id}"]) && $message->post_reply_id != $message->id && $message->post_reply_id > 0) {
            $tmp = new \stdClass();
            
            $tmp = clone $message;
            
            $temp_data["{$message->post_reply_id}"]->replying_posts[] = $tmp;
        }
    }
    
    //print "NEED TO WALK: ";
    //print_r($temp_data);
    //print "END NEED TO WALK";
    
    return orderPostMessagesWalk($temp_data);
}

function orderPostMessagesWalk($temp_data)
{
    $temp_array = array();
    
    foreach ($temp_data as $data) {
        if ($data->post_reply_id == $data->id || $data->post_reply_id == 0) {
            $tmp = new \stdClass();
            
            $tmp->id                  = $data->id;
            $tmp->post_reply_id       = $data->post_reply_id;
            $tmp->postrootparentid    = $data->postrootparentid;
            $tmp->video_url           = $data->video_url;
            $tmp->video_thumbnail_url = $data->video_thumbnail_url;
            $tmp->upload_url          = $data->upload_url;
            $tmp->upload_file_name    = $data->upload_file_name;
            $tmp->message             = $data->message;
            $tmp->is_teacher          = $data->is_teacher;
            $tmp->is_private          = $data->is_private;
            $tmp->created             = $data->created;
            $tmp->user_id             = $data->user_id;
            $tmp->fname               = $data->fname;
            $tmp->lname               = $data->lname;
            $tmp->unit_name           = $data->unit_name;
            $tmp->page_name           = $data->page_name;
            $tmp->indent_count        = 0;
            if (isset($data->teacher_notes)) {
                $tmp->teacher_notes = $data->teacher_notes;
            }
            
            //           $tmp->max_points = $data->max_points;
            
            $temp_array[] = $tmp;
            
            
            //print "Root ID: {$data->id}\n";
            //print_r($temp_array);
            //print "End Root\n\n";
            
            if (!empty($data->replying_posts)) {
                foreach ($data->replying_posts as $reply_post) {
                    $tmp = new \stdClass();
                    
                    $tmp->id                  = $reply_post->id;
                    $tmp->post_reply_id       = $reply_post->post_reply_id;
                    $tmp->postrootparentid    = $reply_post->postrootparentid;
                    $tmp->video_url           = $reply_post->video_url;
                    $tmp->video_thumbnail_url = $reply_post->video_thumbnail_url;
                    $tmp->upload_url          = $reply_post->upload_url;
                    $tmp->upload_file_name    = $reply_post->upload_file_name;
                    $tmp->message             = $reply_post->message;
                    $tmp->is_teacher          = $reply_post->is_teacher;
                    $tmp->is_private          = $reply_post->is_private;
                    $tmp->created             = $reply_post->created;
                    $tmp->user_id             = $reply_post->user_id;
                    $tmp->fname               = $reply_post->fname;
                    $tmp->lname               = $reply_post->lname;
                    $tmp->unit_name           = $reply_post->unit_name;
                    $tmp->page_name           = $reply_post->page_name;
                    
                    $tmp->indent_count = 1;
                    
                    $temp_array[] = $tmp;
                    
                    
                    //print "first level: \n";
                    //print_r($temp_array);
                    //print "end first level: \n";
                    
                    if (!empty($temp_data["{$reply_post->id}"]->replying_posts)) {
                        $result = orderPostMessageWalkerHelper($temp_data, $temp_data["{$reply_post->id}"], 2);
                        
                        $temp_array = array_merge($temp_array, $result);
                        
                        //print "finished walked for all levels for first:\n";
                        //print_r($temp_array);
                        //print "end finished walked for all levels for first:\n";
                    }
                }
            }
        }
    }
    
    return $temp_array;
}

function orderPostMessageWalkerHelper($temp_data, $root_reply_post, $indent_count)
{
    $temp_array = array();
    
    //print "helper $root_reply_post->id \n";
    
    if (isset($temp_data["{$root_reply_post->id}"])) {
        if (!empty($temp_data["{$root_reply_post->id}"]->replying_posts)) {
            foreach ($temp_data["{$root_reply_post->id}"]->replying_posts as $reply_post) {
                $tmp = new \stdClass();
                
                $tmp->id                  = $reply_post->id;
                $tmp->post_reply_id       = $reply_post->post_reply_id;
                $tmp->postrootparentid    = $reply_post->postrootparentid;
                $tmp->video_url           = $reply_post->video_url;
                $tmp->video_thumbnail_url = $reply_post->video_thumbnail_url;
                $tmp->upload_url          = $reply_post->upload_url;
                $tmp->upload_file_name    = $reply_post->upload_file_name;
                $tmp->is_teacher          = $reply_post->is_teacher;
                $tmp->is_private          = $reply_post->is_private;
                $tmp->message             = $reply_post->message;
                $tmp->created             = $reply_post->created;
                $tmp->user_id             = $reply_post->user_id;
                $tmp->fname               = $reply_post->fname;
                $tmp->lname               = $reply_post->lname;
                $tmp->unit_name           = $reply_post->unit_name;
                $tmp->page_name           = $reply_post->page_name;
                $tmp->indent_count        = $indent_count;
                
                $temp_array[] = $tmp;
                //print "buillding step:\n";
                //print_r($temp_array);
                //print "end building step\n";
                
                if (!empty($temp_data["{$reply_post->id}"]->replying_posts)) {
                    $result = orderPostMessageWalkerHelper($temp_data, $temp_data["{$reply_post->id}"], $indent_count + 1);
                    
                    $temp_array = array_merge($temp_array, $result);
                    
                    //print "stepping \n";
                    //print_r($temp_array);
                    //print "end step\n";
                }
            }
        }
    }
    
    return $temp_array;
}

function splitRootChildren($postmessages)
{
    $result    = array();
    $temp_root = array();
    
    
    
    foreach ($postmessages as $message) {
        if (!isset($message->indent_count))
            $message->indent_count = 0;
        if ($message->indent_count == 0) {
            if (!empty($temp_root)) {
                $result = array_merge($result, $temp_root);
            }
            
            $temp_root = array();
            
            $temp_obj = clone $message;
            
            $temp_obj->children = array();
            $temp_root[]        = $temp_obj;
        } else {
            $temp_root[0]->children[] = clone $message;
        }
    }
    
    if (!empty($temp_root)) {
        $result = array_merge($result, $temp_root);
    }
    
    return $result;
}

if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {
    $uri = strtok($_SERVER['REQUEST_URI'], '?');
    
    $uri = str_replace('/graderpost/', '', $uri);
    
    $post_action = strtok($uri, '/');
    
    if ($post_action == 'new') {
        $file_name = generate_unique(10);
        
        $widget = '<div>';
        $widget .= '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="272px" height="224px">';
        $widget .= '<param name="movie" value="/public/flash/megec2.swf?videofile=' . $file_name . '&amp;rtmpserver=' . $PATHS->wowza_url . '">';
        $widget .= '<param name="wmode" value="transparent">';
        $widget .= '<!--[if !IE]>-->';
        $widget .= '<object id="bob" type="application/x-shockwave-flash" data="/public/flash/megec2.swf?videofile=' . $file_name . '&amp;rtmpserver=' . $PATHS->wowza_url . '" width="272px" height="224px"">';
        $widget .= '<param name="wmode" value="transparent">';
        $widget .= '<!--<![endif]-->';
        $widget .= '<table style="margin-top:10px">';
        $widget .= '<tbody>';
        $widget .= '<tr>';
        $widget .= '<td><p>Flash object is not working on your browser. If your using a mobile device, click on upload to record your video. If not, then flash has not been set up correctly.</p></td>';
        $widget .= '</tr>';
        $widget .= '</tbody>';
        $widget .= '</table>';
        $widget .= '<!--[if !IE]>-->';
        $widget .= '</object>';
        $widget .= '<!--<![endif]-->';
        $widget .= '</object>';
        $widget .= '</div>';
        
        $button = '<img style="width:87px;height:25px;" src="/public/img/recordbttn.png" id="button" onclick="callAS(bob,\'' . $file_name . '\')">';
        
        
        $data               = new \stdClass();
        $data->video_widget = $widget;
        $data->button       = $button;
        $data->file_name    = $file_name;
        
        header('Content-Type: application/json');
        print json_encode($data);
    } else if ($post_action == 'save') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');
            
            $input = json_decode($json_input);
            
            if (isset($input->contentid) && $input->contentid > 0) {
                $content_id = intval($input->contentid);
            } else {
                $content_id = 0;
            }
            
            $user_id = intval($_SESSION['USER']['ID']);
            
            $query = "SELECT user_classes.classid, user_classes.is_teacher
                FROM `user_classes`
                JOIN classes ON (user_classes.classid=classes.id)
                JOIN units ON (classes.courseid=units.courseid)
                JOIN pages ON (pages.unitid=units.id)
                WHERE user_classes.userid={$user_id}
                and user_classes.is_observer=0
                AND pages.id={$content_id}
                LIMIT 1";
            
            $result = $DB->mysqli->query($query);
            
            if ($result && $result->num_rows == 1) {
                $row = $result->fetch_object();
                
                $class_id   = $row->classid;
                $is_teacher = $row->is_teacher;
            } else {
                $data = new \stdClass();
                
                $data->message = 'User Does Not Have Permission To Post On This Page.';
                
                header('Content-Type: application/json');
                print json_encode($data);
                exit();
            }
            
            
            $query = "SELECT allow_video_post, allow_text_post, is_private, is_gradeable FROM pages WHERE id={$content_id} LIMIT 1";
            
            
            $result = $DB->mysqli->query($query);
            
            if ($result && $result->num_rows == 1) {
                $row = $result->fetch_object();
                
                $allow_video_post    = $row->allow_video_post;
                $allow_text_post     = $row->allow_text_post;
                $master_is_private   = $row->is_private;
                $master_is_gradeable = $row->is_gradeable;
                
                if ($allow_video_post == 1) {
                    
                    if (isset($input->videoFileName) && strlen($input->videoFileName) > 0) {
                        $sanitized_video_file_name = str_replace('/', '', $input->videoFileName);
                        $sanitized_video_file_name = str_replace('.flv', '', $sanitized_video_file_name);
                        $sanitized_video_file_name = str_replace('.', '', $sanitized_video_file_name);
                        
                        $sanitized_video_file_name = preg_replace('/[^a-z0-9\-]/', '', $sanitized_video_file_name);
                        
                        $sanitized_video_file_name .= '.flv';
                        
                        $source_file      = $PATHS->wowza_content . $sanitized_video_file_name;
                        $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;
                        
                        $data = new \stdClass();
                        
                        if (file_exists($source_file)) {
                            if (!file_exists($destination_file)) {
                                //$data->message = "Moved File: " . $source_file . " To: " . $destination_file;
                                
                                if (rename($source_file, $destination_file)) {
                                    $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);
                                    
                                    $mp4_file_name = $destination_file;
                                    
                                    $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);
                                    
                                    $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                                    shell_exec("/usr/bin/ffmpeg -i " . $destination_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");
                                    
                                    $mp4convert = "/usr/bin/ffmpeg -i " . $destination_file . " -vcodec libx264 -crf 23 -preset medium -vsync 1 -r 25 -acodec aac -strict -2 -b:a 64k  -ar 44100 -ac 1 " . $mp4_file_name . " > /dev/null 2>/dev/null &";
                                    shell_exec($mp4convert);
                                    
                                    
                                    $user_id    = intval($_SESSION['USER']['ID']);
                                    $content_id = 0;
                                    
                                    $mysql_videofilename     = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
                                    $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name));
                                    
                                    if (isset($input->contentid) && $input->contentid > 0) {
                                        $content_id = intval($input->contentid);
                                    }
                                    
                                    
                                    
                                    if (isset($input->reply_to_id) && $input->reply_to_id > 0) {
                                        $reply_to_id = intval($input->reply_to_id);
                                    } else {
                                        $reply_to_id = 0;
                                    }
                                    
                                    if (isset($input->video_comment) && strlen($input->video_comment) > 0) {
                                        $mysql_video_comment = $DB->mysqli->real_escape_string($input->video_comment);
                                    } else {
                                        $mysql_video_comment = '';
                                    }
                                    
                                    if (isset($input->check_is_private) && $input->check_is_private == 1) {
                                        $is_private = 1;
                                    } else {
                                        $is_private = 0;
                                    }
                                    
                                    if ($master_is_private == 1) {
                                        $is_private = 1;
                                    }
                                    
                                    
                                    $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, video_url, video_thumbnail_url, message, is_private, is_teacher) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_videofilename}', '{$mysql_thumbnailfilename}', '{$mysql_video_comment}', {$is_private}, {$is_teacher})";
                                    
                                    $DB->mysqli->query($query);
                                    
                                    if ($DB->mysqli->affected_rows == 1) {
                                        $post_id = $DB->mysqli->insert_id;
                                        if ($reply_to_id != 0) {
                                            $query = "SELECT postrootparentid FROM posts WHERE id=$reply_to_id LIMIT 1";
                                            
                                            $result = $DB->mysqli->query($query);
                                            
                                            if ($result && $result->num_rows == 1) {
                                                $row = $result->fetch_object();
                                                
                                                $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";
                                                
                                                $DB->mysqli->query($query);
                                            }
                                        } else {
                                            $query = "UPDATE posts SET postrootparentid = {$DB->mysqli->insert_id},  post_reply_id = {$DB->mysqli->insert_id} WHERE id = {$DB->mysqli->insert_id}";
                                            
                                            $DB->mysqli->query($query);
                                        }
                                    }
                                    
                                    $data->message   = "successful";
                                    $data->post_id   = $post_id;
                                    $data->teacherid = $user_id;
                                    if(isset($input->grid)){
                                        $rubricCtrl = new \English3\Controller\RubricsController(Utility::getInstance()->reader);
                                        $rubricParams = json_decode(json_encode([
                                            'postid'=>$post_id,
                                            'teacherid'=>$user_id,
                                            'userid'=>$input->user_id,
                                            'grid'=>$input->grid,
                                            'rubricid'=>$input->rubric->info->id
                                        ]));
                                        $rubricCtrl->_saveGradeRubric($rubricParams);
                                    }
                                }
                            } else {
                                $data->message = "Could Not Save. Please Try Again";
                            }
                        } else {
                            $data->message = "File Does Not Exist";
                        }
                        
                        header('Content-Type: application/json');
                        print json_encode($data);
                        exit();
                    }
                }
                //quick change here for "No menu" course. Must come back here!!
                else if (true) {
                    //else if ($allow_text_post == 1) {
                    //text only post allowed
                    
                    $data = new \stdClass();
                    if (isset($input->contentid) && $input->contentid > 0) {
                        $content_id = intval($input->contentid);
                    }
                    
                    if (isset($input->reply_to_id) && $input->reply_to_id > 0) {
                        $reply_to_id = intval($input->reply_to_id);
                    } else {
                        $reply_to_id = 0;
                    }
                    
                    if (isset($input->check_is_private) && $input->check_is_private == 1) {
                        $is_private = 1;
                    } else {
                        $is_private = 0;
                    }
                    
                    if ($master_is_private == 1) {
                        $is_private = 1;
                    }
                    
                    if (isset($input->video_comment) && strlen($input->video_comment) > 0) {
                        $user_id             = intval($_SESSION['USER']['ID']);
                        $mysql_video_comment = $DB->mysqli->real_escape_string($input->video_comment);
                        
                        $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, message, is_private, is_teacher) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_video_comment}', {$is_private}, {$is_teacher})";
                        
                        $DB->mysqli->query($query);
                        
                        if ($DB->mysqli->affected_rows == 1) {
                            if ($reply_to_id != 0) {
                                $query = "SELECT postrootparentid FROM posts WHERE id=$reply_to_id LIMIT 1";
                                
                                $result = $DB->mysqli->query($query);
                                
                                if ($result && $result->num_rows == 1) {
                                    $row = $result->fetch_object();
                                    
                                    $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";
                                    
                                    $DB->mysqli->query($query);
                                }
                            } else {
                                $query = "UPDATE posts SET postrootparentid = {$DB->mysqli->insert_id},  post_reply_id = {$DB->mysqli->insert_id} WHERE id = {$DB->mysqli->insert_id}";
                                
                                $DB->mysqli->query($query);
                            }
                        }
                        
                        $data->message = "successful";
                    } else {
                        $data->message = "Please Provide A Text Message";
                    }
                    
                    header('Content-Type: application/json');
                    print json_encode($data);
                    exit();
                }
            } else {
                $data->message = "Error: 494";
            }
        }
    } else if ($post_action == 'upload') {
        $data = new \stdClass();
        
        if (isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0) {
            $data->error    = $_FILES['file']['error'];
            $data->name     = $_FILES['file']['name'];
            $data->size     = $_FILES['file']['size'];
            $data->type     = $_FILES['file']['type'];
            $data->tmp_name = $_FILES['file']['tmp_name'];
            $data->comment  = 'comment ' . (isset($_REQUEST['video_upload_comment']) ? $_REQUEST['video_upload_comment'] : '');
            
            $sanitized_video_file_name = generate_unique(10);
            
            $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;
            $converted_file   = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name . ".mp4";
            
            if (move_uploaded_file($data->tmp_name, $destination_file)) {
                $uploadconvert = "/usr/bin/ffmpeg -i " . $destination_file . " -s 160x120 -ar 11025 -r 15 -maxrate 5k  -vb 100k  " . $converted_file;
                
                shell_exec($uploadconvert);
                
                $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . $sanitized_video_file_name . ".jpg";
                
                shell_exec("/usr/bin/ffmpeg -i " . $converted_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");
                
                $user_id    = intval($_SESSION['USER']['ID']);
                $content_id = 0;
                
                $mysql_videofilename     = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name . ".mp4");
                $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . $sanitized_video_file_name . ".jpg");
                
                if (isset($_REQUEST['contentid']) && $_REQUEST['contentid'] > 0) {
                    $content_id = intval($_REQUEST['contentid']);
                }
                
                if (isset($_REQUEST['reply_to_id']) && $_REQUEST['reply_to_id'] > 0) {
                    $reply_to_id = intval($_REQUEST['reply_to_id']);
                } else {
                    $reply_to_id = 0;
                }
                
                if (isset($_REQUEST['video_upload_comment']) && strlen($_REQUEST['video_upload_comment']) > 0) {
                    $mysql_video_comment = $DB->mysqli->real_escape_string($_REQUEST['video_upload_comment']);
                } else {
                    $mysql_video_comment = '';
                }
                
                if (isset($_REQUEST['check_is_private']) && $_REQUEST['check_is_private'] == 1) {
                    $is_private = 1;
                } else {
                    $is_private = 0;
                }
                
                if ($master_is_private == 1) {
                    $is_private = 1;
                }
                
                $query = "SELECT user_classes.classid, user_classes.is_teacher  FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$content_id} LIMIT 1";
                
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();
                    
                    $class_id   = $row->classid;
                    $is_teacher = $row->is_teacher;
                } else {
                    $data = new \stdClass();
                    
                    $data->message = 'User Does Not Have Permission To Post On This Page.';
                    
                    header('Content-Type: application/json');
                    print json_encode($data);
                    exit();
                }
                
                
                $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, video_url, video_thumbnail_url, message, is_private, is_teacher) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_videofilename}', '{$mysql_thumbnailfilename}', '{$mysql_video_comment}', {$is_private}, {$is_teacher})";
                
                $DB->mysqli->query($query);
                
                if ($DB->mysqli->affected_rows == 1) {
                    if ($reply_to_id != 0) {
                        $query = "SELECT postrootparentid FROM posts WHERE id=$reply_to_id LIMIT 1";
                        
                        $result = $DB->mysqli->query($query);
                        
                        if ($result && $result->num_rows == 1) {
                            $row = $result->fetch_object();
                            
                            $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";
                            
                            $DB->mysqli->query($query);
                        }
                    } else {
                        $query = "UPDATE posts SET postrootparentid = {$DB->mysqli->insert_id},  post_reply_id = {$DB->mysqli->insert_id} WHERE id = {$DB->mysqli->insert_id}";
                        
                        $DB->mysqli->query($query);
                    }
                }
                
                $data->message = "successful";
            }
        }
        
        header('Content-Type: application/json');
        print json_encode($data);
    } else if ($post_action == 'fileupload') {
        $data = new \stdClass();
        
        if (isset($_FILES['file']['error']) && $_FILES['file']['error'] == 0) {
            $data->error    = $_FILES['file']['error'];
            $data->name     = $_FILES['file']['name'];
            $data->size     = $_FILES['file']['size'];
            $data->type     = $_FILES['file']['type'];
            $data->tmp_name = $_FILES['file']['tmp_name'];
            $data->name     = $_FILES['file']['name'];
            $data->comment  = 'comment ' . (isset($_REQUEST['file_upload_comment']) ? $_REQUEST['file_upload_comment'] : '');
            
            $sanitized_video_file_name = generate_unique(10);
            
            $extension = strrpos($_FILES['file']['name'], '.');
            
            if ($extension > 0) {
                $extension = substr($_FILES['file']['name'], $extension);
            } else {
                $extension = '';
            }
            
            $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "useruploads/" . $sanitized_video_file_name . $extension;
            $file_upload_url  = "/public/useruploads/" . $sanitized_video_file_name . $extension;
            
            if (move_uploaded_file($data->tmp_name, $destination_file)) {
                $user_id    = intval($_SESSION['USER']['ID']);
                $content_id = 0;
                
                $mysql_uploadurl = $DB->mysqli->real_escape_string($file_upload_url);
                $mysql_filename  = $DB->mysqli->real_escape_string($_FILES['file']['name']);
                
                if (isset($_REQUEST['contentid']) && $_REQUEST['contentid'] > 0) {
                    $content_id = intval($_REQUEST['contentid']);
                }
                
                if (isset($_REQUEST['reply_to_id']) && $_REQUEST['reply_to_id'] > 0) {
                    $reply_to_id = intval($_REQUEST['reply_to_id']);
                } else {
                    $reply_to_id = 0;
                }
                
                if (isset($_REQUEST['file_upload_comment']) && strlen($_REQUEST['file_upload_comment']) > 0) {
                    $mysql_video_comment = $DB->mysqli->real_escape_string($_REQUEST['file_upload_comment']);
                } else {
                    $mysql_video_comment = '';
                }
                
                if (isset($_REQUEST['check_is_private']) && $_REQUEST['check_is_private'] == 1) {
                    $is_private = 1;
                } else {
                    $is_private = 0;
                }
                
                if ($master_is_private == 1) {
                    $is_private = 1;
                }
                
                $query = "SELECT user_classes.classid, user_classes.is_teacher  FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) WHERE user_classes.userid={$user_id} AND pages.id={$content_id} LIMIT 1";
                
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();
                    
                    $class_id   = $row->classid;
                    $is_teacher = $row->is_teacher;
                } else {
                    $data = new \stdClass();
                    
                    $data->message = 'User Does Not Have Permission To Post On This Page.';
                    
                    header('Content-Type: application/json');
                    print json_encode($data);
                    exit();
                }
                
                
                $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id, upload_url, upload_file_name, message, is_private, is_teacher) VALUES($class_id, $user_id, $content_id, $reply_to_id, $reply_to_id, '{$mysql_uploadurl}', '{$mysql_filename}', '{$mysql_video_comment}', {$is_private}, {$is_teacher})";
                
                $DB->mysqli->query($query);
                
                if ($DB->mysqli->affected_rows == 1) {
                    if ($reply_to_id != 0) {
                        $query = "SELECT postrootparentid FROM posts WHERE id=$reply_to_id LIMIT 1";
                        
                        $result = $DB->mysqli->query($query);
                        
                        if ($result && $result->num_rows == 1) {
                            $row = $result->fetch_object();
                            
                            $query = "UPDATE posts SET postrootparentid = {$row->postrootparentid},  post_reply_id = {$reply_to_id} WHERE id = {$DB->mysqli->insert_id}";
                            
                            $DB->mysqli->query($query);
                        }
                    } else {
                        $query = "UPDATE posts SET postrootparentid = {$DB->mysqli->insert_id},  post_reply_id = {$DB->mysqli->insert_id} WHERE id = {$DB->mysqli->insert_id}";
                        
                        $DB->mysqli->query($query);
                    }
                }
                
                $data->message = "successful";
            }
        }
        
        header('Content-Type: application/json');
        print json_encode($data);
    } else if ($post_action == 'grade') {
        $data = new \stdClass();
        
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');
            
            $input = json_decode($json_input);
            if($input->grade==='' && $input->feedback=='' && !isset($input->videoFileName)){
                $data = new \stdClass();

                $data->message = 'Please, provide a feedback or a grade.';

                header('Content-Type: application/json');
                print json_encode($data);
                exit();
            }
            if(isset($input->nonSubmittablePage)&& !isset($input->post_id)){
                $u = Utility::getInstance();
                $u->reader->insert(
                    'posts',
                    array(
                        'classid'=>$input->class_id,
                        'pageid'=>$input->page_id,
                        'userid'=>$input->user_id,
                        'message'=>'This is an automatic message',
                        'is_private'=>1
                    )
                );
                $input->post_id=$u->reader->lastInsertId();
                $u->reader->update(
                    'posts',
                    ['postrootparentid'=>$input->post_id],
                    ['id'=>$input->post_id]
                );
            }
            if (isset($input->post_id) && $input->post_id > 0) {
                $group_id = 'null';
                if(isset($input->courseId)){
                    $courseId = $input->courseId;
                    if(preg_match("/[0-9]+-[0-9]+/", $courseId)){
                        $group_id = intval(explode('-',$courseId)[1]);
                        $courseId = intval(explode('-',$courseId)[0]);

                    }
                }

                $post_id = intval($input->post_id);
                
                $user_id = intval($_SESSION['USER']['ID']);
                
                //        $query = "SELECT posts.classid, posts.pageid, posts.postrootparentid FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) JOIN posts ON (posts.pageid=pages.id) LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)  WHERE user_classes.userid={$user_id} AND posts.id={$post_id} AND user_classes.is_teacher=1 AND grade_posts.id IS NULL LIMIT 1";
                
                $query = "SELECT posts.classid, posts.pageid, posts.postrootparentid FROM `user_classes` JOIN classes ON (user_classes.classid=classes.id) JOIN units ON (classes.courseid=units.courseid) JOIN pages ON (pages.unitid=units.id) JOIN posts ON (posts.pageid=pages.id) LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)  WHERE user_classes.userid={$user_id} AND posts.id={$post_id} AND user_classes.is_teacher=1 LIMIT 1";
                
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();
                    
                    $class_id          = $row->classid;
                    $page_id           = $row->pageid;
                    $postrootparent_id = $row->postrootparentid;
                } else {
                    $data = new \stdClass();
                    
                    $data->message = 'User Does Not Have Permission To Post On This Page.';
                    
                    header('Content-Type: application/json');
                    print json_encode($data);
                    exit();
                }
                
                //if(isset($input->grade)) {
                $mysql_videofilename     = isset($input->videoFileNameReady)?$input->videoFileNameReady:'';
                $mysql_thumbnailfilename = isset($input->videoThumbnailFileNameReady)?$input->videoThumbnailFileNameReady:'';
                $mysql_comment           = '';
                
                if (isset($input->videoFileName)) {
                    if (strlen($input->videoFileName) > 0) {
                        
                        $sanitized_video_file_name = str_replace('/', '', $input->videoFileName);
                        $sanitized_video_file_name = str_replace('.flv', '', $sanitized_video_file_name);
                        $sanitized_video_file_name = str_replace('.', '', $sanitized_video_file_name);
                        $sanitized_video_file_name = preg_replace('/[^a-z0-9\-]/', '', $sanitized_video_file_name);
                        $sanitized_video_file_name .= '.flv';
                        
                        /*
                        GETTING AROUND TO UPLOAD ON LOCAL MACHINE.
                        Basically you set the paths as below so that
                        local video is in the right folders you can
                        download mp4 from the net just type in sample mp4s
                        golabs tmp file so can run on local machine.....
                        */
                        if (!isset($PATHS->wowza_content)) {
                            //If running local you will need to set these links below..
                            if (file_exists('E:/meglms/public/uservids/sample.mp4')) {
                                $source_file               = 'E:/meglms/public/uservids/sample.mp4';
                                $sanitized_video_file_name = 'sample.mp4';
                                $destination_file          = 'E:/meglms/public/uservids/sample.mp4';
                                $mysql_videofilename       = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
                                $mysql_thumbnailfilename   = $DB->mysqli->real_escape_string("/public/uservidthumbnails/sample.jpg");
                            } else {
                                exit('Running local host you Need to set local video link for graderpost.php see around line ' . __LINE__);
                            }
                        } else {
                            $source_file      = $PATHS->wowza_content . $sanitized_video_file_name;
                            $destination_file = $PATHS->app_path . $PATHS->base_site_public_path . "uservids/" . $sanitized_video_file_name;
                        }
                        
                        
                        
                        
                        if (file_exists($source_file)) {
                            
                            if (!file_exists($destination_file)) {
                                //$data->message = "Moved File: " . $source_file . " To: " . $destination_file;
                                
                                if (rename($source_file, $destination_file)) {
                                    $sanitized_video_file_name = str_replace('.flv', '.mp4', $sanitized_video_file_name);
                                    
                                    $mp4_file_name = $destination_file;
                                    
                                    $mp4_file_name = str_replace('.flv', '.mp4', $destination_file);
                                    
                                    $thumbfile = $PATHS->app_path . $PATHS->base_site_public_path . "uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name);
                                    shell_exec("/usr/bin/ffmpeg -i " . $destination_file . " -deinterlace -an -ss 1 -t 00:00:10 -r 1 -y -vcodec mjpeg -f mjpeg $thumbfile 2>&1");
                                    
                                    $mp4convert = "/usr/bin/ffmpeg -i " . $destination_file . " -vcodec libx264 -crf 23 -preset medium -vsync 1 -r 25 -acodec aac -strict -2 -b:a 64k  -ar 44100 -ac 1 " . $mp4_file_name . " > /dev/null 2>/dev/null &";
                                    shell_exec($mp4convert);
                                    $mysql_videofilename     = $DB->mysqli->real_escape_string("/public/uservids/" . $sanitized_video_file_name);
                                    $mysql_thumbnailfilename = $DB->mysqli->real_escape_string("/public/uservidthumbnails/" . str_replace('.mp4', '.jpg', $sanitized_video_file_name));
                                }
                            }
                        }
                    }
                } else {
                    if(isset($input->feedback)){
                        $mysql_comment = $DB->mysqli->real_escape_string($input->feedback);
                    }else{
                        $mysql_comment ='';
                    }

                }


                $mysql_uploadedfileid = json_encode($input->uploadedfileid);

                $teacher_post_id = 0;
                
                if (!isset($input->archive)) {
                    $input->archive = 0;
                }

                if ($input->archive > 0) {
                    $query = "UPDATE  posts
      SET   
      message =  '{$mysql_comment}',
      video_thumbnail_url='{$mysql_thumbnailfilename}',
      video_url='{$mysql_videofilename}',
      created = CURRENT_TIMESTAMP()
      WHERE
      id = '" . $input->archive . "'
      LIMIT 1";
                } else {
                    $query = "INSERT INTO posts(classid, userid, pageid, postrootparentid, post_reply_id,fileuploadid, video_url, video_thumbnail_url, message, is_private, is_teacher,groupid) VALUES($class_id, $user_id, $page_id, $postrootparent_id, $post_id, '$mysql_uploadedfileid', '{$mysql_videofilename}', '{$mysql_thumbnailfilename}', '{$mysql_comment}', 1, 1,{$group_id})";
                }
                $sql = new BaseSQL();
                $teacher_post_id = $sql->query_ReturnId($query);

                if ($teacher_post_id) {
                    $data->message   = "successful";
                    $data->teacherid = $user_id;
                    $data->post_id   = $teacher_post_id;
                }else{
                    $data->post_id   = $input->archive;
                    $teacher_post_id=$input->archive;
                    $data->teacherid = $user_id;
                }
                
                
                
                //If we do not have a $input->videoFileName....
                if (!isset($input->videoFileName)) {
                    
                    if (!isset($input->grade)) {
                        $input->grade = '';
                    }
                    $mysql_grade = $DB->mysqli->real_escape_string($input->grade);
                    $points      = intval($input->grade);
                    
                    $mysql_teacher_notes = $DB->mysqli->real_escape_string($input->notes);
                    
                    if (!isset($input->class_assignment_id))
                        $input->class_assignment_id = 0;
                    
                    $class_assignment_id = intval($input->class_assignment_id);
                    
                    if ($input->archive > 0) {
                        $query = "UPDATE  grade_posts SET
      grade =  '{$mysql_grade}',
      teacher_notes = '{$mysql_teacher_notes}',
      viewed = '0',
      created = CURRENT_TIMESTAMP()
      WHERE
      post_id = '$post_id'
      LIMIT 1";

                    } else {
                        $query = "INSERT INTO grade_posts(post_id, teacher_post_id, user_id, grade, teacher_notes) VALUES($post_id, $teacher_post_id, $user_id, '{$mysql_grade}', '{$mysql_teacher_notes}')";

                    }
                    $rootPost = PostsController::_get($reader,$post_id);
                    $reader->delete('scores_overrides',['userId'=>$rootPost['userid'],'pageId'=>$rootPost['pageid']]);
                    $DB->mysqli->query($query);
                    
                    $updateUserAssignmentQuery = "INSERT INTO user_assignments(userid, class_assignment_id, points) VALUES($user_id, $class_assignment_id, $points)";
                    $DB->mysqli->query($updateUserAssignmentQuery);

                    if(isset($input->grid)){
                        $rubricCtrl = new \English3\Controller\RubricsController(Utility::getInstance()->reader);
                        $rubricParams = json_decode(json_encode([
                            'postid'=>$post_id,
                            'teacherid'=>$user_id,
                            'userid'=>$input->user_id,
                            'grid'=>$input->grid,
                            'rubricid'=>$input->rubric->info->id
                        ]));
                        $rubricCtrl->_saveGradeRubric($rubricParams);
                    }

                    GradebookController::_recalculate($rootPost['userid'],$rootPost['pageid']);
                    \English3\Controller\Notifications\GradePostEmailNotification::sendIfNeeded($user_id,$rootPost['userid'],$class_id,$input->post_id);
                    
                    
                    //          $updateUserAssignmentQuery = "INSERT INTO user_assignments(userid, class_assignment_id, points) VALUES($user_id, $class_assignment_id, $points)";
                    //
                    //          $DB->mysqli->query($updateUserAssignmentQuery);
                    
                    
                    $data->message = "successful";
                    
                    require_once('email.php');
                    $rubric = isset($input->rubric)?$input->rubric:false;
                    sendFeedBack($teacher_post_id==0?$input->archive:$teacher_post_id,$rubric);
                }

                header('Content-Type: application/json');
                print json_encode($data);
            }
        }
    } else if ($post_action == 'delete') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');
            
            $input = json_decode($json_input);
            
            if (isset($input->delete_id) && $input->delete_id > 0) {
                $user_id   = intval($_SESSION['USER']['ID']);
                $delete_id = intval($input->delete_id);
                
                $query = "SELECT id FROM posts WHERE id={$delete_id} AND userid={$user_id} LIMIT 1";
                
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();
                    
                    $query = "SELECT id FROM posts WHERE id!={$delete_id} AND post_reply_id={$delete_id} AND is_deleted=0 LIMIT 1";
                    
                    $result = $DB->mysqli->query($query);
                    
                    if ($result && $result->num_rows == 1) {
                        $data->message = "Can Not Delete Post. Post Has Active Replies.";
                    } else {
                        $query = "UPDATE posts SET is_deleted=1 WHERE id={$delete_id}";
                        
                        $DB->mysqli->query($query);
                        
                        if ($DB->mysqli->affected_rows == 1) {
                            $data->message = "successful";
                        } else {
                            $data->message = "successful";
                        }
                    }
                } else {
                    $data->message = "You Do Not Have Permission To Delete This Video.";
                }
            } else {
                $data->message = "No Post Selected For Deletion.";
            }
        } else {
            $data->message = "No Post Selected For Deletion.";
        }
        
        header('Content-Type: application/json');
        print json_encode($data);
    } else if ($post_action == 'all') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');
            
            $input = json_decode($json_input);
            $num_posts = $input->num_posts;
            if (isset($input->courseid) && $input->courseid > 0) {
                $group_id = 'null';

                $post_action = $input->courseid;
                if(preg_match("/[0-9]+-[0-9]+/", $post_action)){
                    $group_id = intval(explode('-',$post_action)[1]);
                    $post_action = intval(explode('-',$post_action)[0]);

                }
                $user_id     = intval($_SESSION['USER']['ID']);
                $util = new Utility();
                $class = $util->fetchRow(ClassesController::$queryGetClassFromCourseId,['courseId'=>$post_action]);


                $util->checkTeacher($class['id'],$class['orgId']);


                $sortOrder = OrganizationController::_getField(OrganizationController::_getOrgFromClassId($class['id']),'sort_posts_grader');
                $sortOrder = $input->sortOrder?:$sortOrder;$sortOrder=$sortOrder=='desc'?$sortOrder:'';
                if($sortOrder == 'alphabet'){
                    $sortOrder = "fname";
                }
                else{
                    $sortOrder = "posts.id,pages.id $sortOrder";
                }
                $query = "SELECT posts.id, posts.post_reply_id, posts.postrootparentid, posts.video_url,
            posts.video_thumbnail_url, posts.upload_url, posts.upload_file_name, posts.message, posts.is_private,pages.id as 'pageId',
            posts.is_teacher, posts.created, users.id as 'user_id', users.fname, users.lname, users.email,
            units.description as 'unit_name',  pages.name as 'page_name', class_assignments.points as 'max_points', class_assignments.id as 'class_assignment_id',
            pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post,pages.allow_upload_only_post, pages.allow_template_post,rubricid,pages.layout
          FROM posts
          JOIN users ON (posts.userid=users.id)
          JOIN user_classes uc ON uc.userid = users.id and uc.classid = posts.classid
          JOIN pages ON (posts.pageid=pages.id)
          JOIN units ON (pages.unitid=units.id)
          LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
          LEFT JOIN class_assignments ON (class_assignments.class_id = {$class['id']}) AND (class_assignments.page_id=pages.id)
          WHERE (posts.classid={$class['id']}
          AND units.courseid={$post_action} 
          AND posts.is_deleted=0
          AND posts.id = posts.postrootparentid
          )
          AND grade_posts.id IS NULL AND posts.is_teacher=0
          AND pages.is_gradeable=1
          AND (posts.groupid is null or posts.groupid='{$group_id}')
          group by posts.id
          ORDER BY $sortOrder ";


                
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows > 0) {
                    $data = new \stdClass();
                    
                    $data->postmessages = array();
                    
                    while ($row = $result->fetch_object()) {
                        $tmp                  = new \stdClass();
                        $tmp                  = clone $row;
                        $tmp->upload_url = Utility::urlencodepath($tmp->upload_url);
                        $data->postmessages[] = json_decode(json_encode(GraderActivitySQL::getchildren($tmp)),true);
                        $data->max_points     = $row->max_points;
                    }
                }
                
                $data->postmessages = GraderActivity::groupMessagesByUserAndPage($data->postmessages);
                $data->postmessages = GraderActivity::prepareTimedReviewTextPrompts($data->postmessages);
                $data->students = GraderActivity::getStudentsFromMessages($data->postmessages);
                
                //$data->postmessages = splitRootChildren($data->postmessages);
                
                header('Content-Type: application/json');
                print json_encode($data);
            }
        }
        exit();
    } else if ($post_action == 'showfile'){

      $file = pathinfo(preg_replace('@.*?showfile\?@', '', $_SERVER['REQUEST_URI']));
      $filelocation = $PATHS->app_path .$file['dirname'].'/'.urldecode($file['filename']).'.html';
      if (file_exists($filelocation)){
       exit(file_get_contents($filelocation)); 
      }
        exit('Error');
    } else if ($post_action == 'archive') {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            $json_input = file_get_contents('php://input');
            
            $input = json_decode($json_input);
            
            if (isset($input->courseid) && $input->courseid > 0) {
                
                $post_action = intval($input->courseid);
                $user_id     = intval($_SESSION['USER']['ID']);
                
                $query = "SELECT user_classes.classid, user_classes.is_teacher
FROM `user_classes`
JOIN classes ON (user_classes.classid=classes.id)
JOIN units ON (classes.courseid=units.courseid)
WHERE user_classes.userid={$user_id} AND units.courseid={$post_action} LIMIT 1";
                
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows == 1) {
                    $row = $result->fetch_object();
                    
                    $class_id   = $row->classid;
                    $is_teacher = $row->is_teacher;
                } else {
                    $data = new \stdClass();
                    
                    header('Content-Type: application/json');
                    print json_encode($data);
                    exit();
                }
                $sortOrder = OrganizationController::_getField(OrganizationController::_getOrgFromClassId($class_id),'sort_posts_grader');
                $sortOrder = $input->sortOrder?:$sortOrder;$sortOrder=$sortOrder=='desc'?$sortOrder:'';
                if($sortOrder == 'alphabet'){
                    $sortOrder = "fname";
                }
                else{
                    $sortOrder = "posts.id $sortOrder";
                }

                $query  = "SELECT posts.id, posts.post_reply_id, posts.postrootparentid, posts.video_url,
            posts.video_thumbnail_url, posts.upload_url, posts.upload_file_name, posts.message, posts.is_private,
            posts.is_teacher, posts.created, users.id as 'user_id', users.fname, users.lname,users.email,
            units.description as 'unit_name',  pages.name as 'page_name',pages.id as 'pageId', class_assignments.points as 'max_points',
            grade_posts.teacher_notes, grade_posts.grade, class_assignments.id as 'class_assignment_id',grade_posts.user_id as teacher_id,
            teachers.fname as teacher_fname, teachers.lname as teacher_lname,
            pages.allow_video_post, pages.allow_text_post, pages.allow_upload_post, pages.allow_upload_only_post,pages.allow_template_post,pages.rubricid,pages.automatically_grade,
            sov.score as scoreOverride, sov.byUserId as overrideBy, sov.date as overrideOn,pages.layout
          FROM posts
          JOIN users ON (posts.userid=users.id)

          JOIN pages ON (posts.pageid=pages.id)
          JOIN units ON (pages.unitid=units.id)
          LEFT JOIN grade_posts ON (grade_posts.post_id=posts.id)
          LEFT JOIN scores_overrides sov ON posts.pageid = sov.pageId and posts.userid = sov.userId
          LEFT JOIN users teachers ON (grade_posts.user_id=teachers.id)
          LEFT JOIN class_assignments ON (class_assignments.class_id = {$class_id}) AND (class_assignments.page_id=pages.id)
          WHERE (posts.classid={$class_id} 
          AND units.courseid={$post_action} 
          AND posts.is_deleted=0) 
          AND (grade_posts.id IS NOT NULL or posts.id!=posts.postrootparentid)
          AND posts.is_teacher=0
          AND pages.is_gradeable=1
          GROUP BY posts.id
          ORDER BY $sortOrder";
                $result = $DB->mysqli->query($query);
                
                if ($result && $result->num_rows > 0) {
                    $data               = new \stdClass();
                    $data->postmessages = array();
                    $data->teachers=array();

                    while ($row = $result->fetch_object()) {
                        if(!isset($data->page)){
                            $data->page=array(
                                'id'=>$row->pageId,
                                'name'=>$row->page_name
                            );
                        }
                        $data->upload_url = Utility::urlencodepath($data->upload_url);
                        $tmp                  = new \stdClass();
                        $grade_comments       = GraderActivitySQL::get_comments($row->postrootparentid);
                        $row->grade_comments  = (is_array($grade_comments))? $grade_comments['grade_comments'] : '';
                        $row->update_id       = (is_array($grade_comments))? $grade_comments['update_id'] : '';
                        $tmp                  = clone $row;
                        $data->postmessages[] = GraderActivitySQL::getchildren($tmp);
                        $data->max_points     = $row->max_points;

                        if(!isset($data->teachers[$row->teacher_id]))
                            $data->teachers[$row->teacher_id]=array(
                                "user_id"=>$row->teacher_id,
                                "fname"=>$row->teacher_fname,
                                "lname"=>$row->teacher_lname,
                            );
                    }
                    $data->teachers = array_values($data->teachers);
                }


                $data->postmessages = GraderActivity::prepareTimedReviewTextPrompts(json_decode(json_encode($data->postmessages),true));
                
                header('Content-Type: application/json');
                print json_encode($data);
            }
        }
        exit();
    } else if (is_numeric($post_action) && $post_action > 0) {
        $post_action = intval($post_action);
        $user_id     = intval($_SESSION['USER']['ID']);
        list($courseId,$group_id) = GraderActivity::prepareCourseAndGroupId(json_decode(json_encode($_REQUEST)));
        $class_id = ClassesController::_getFromPage(null,$post_action);
        $pageSQL = new PageSQL();
        $page    = $pageSQL->get_by_id($post_action);

        if ($page)
            $page_layout = $page->layout;
        if (isset($page_layout) and $page_layout == 'QUIZ') {
            
        } else {
            $graderActivity = new GraderActivity($post_action,$courseId,$class_id,$group_id,$user_id,$_REQUEST['sortOrder']);
            $data = $graderActivity->getAndPreparePosts();
        }

            /*
                14/07/2015 Running  file converter system Start....
            */
            if ((isset($data->postmessages)) && (is_array($data->postmessages))){
            include('controllers/usertools/fileconvert.php');

            foreach ($data->postmessages as $key => $obj) {
                if ((isset($obj->upload_url)) && (preg_match('@\w@',$obj->upload_url))){

                $path_parts = pathinfo($obj->upload_url);
                $targetfileinfo = new FileConvert($PATHS->app_path.$path_parts['dirname'].'/',$path_parts['basename'],'html',$PATHS->app_path.$path_parts['dirname'].'/',1);

                if (isset($targetfileinfo->file_savednlocation)){
                    $data->postmessages[$key]->html_convert_info = $targetfileinfo;
                    $data->postmessages[$key]->html_file = str_replace($PATHS->app_path, '', $targetfileinfo->file_savednlocation);
                }
                else{
                    $data->postmessages[$key]->html_file = 'Error';
                    $data->postmessages[$key]->html_error_info = $targetfileinfo;
                }
            }
            }

        }
        $data->postmessages = GraderActivity::prepareTimedReviewTextPrompts(json_decode(json_encode($data->postmessages),true));
        header('Content-Type: application/json');
        print json_encode($data);
    } else if ($post_action == 'pageArchive') {
        $json_input = file_get_contents('php://input');
        $input = json_decode($json_input);
        
        if (isset($input->postId) && $input->postId > 0) {
            list($courseId,$group_id) = GraderActivity::prepareCourseAndGroupId($input);
            $archivePageId = intval($input->postId);
            $user_id       = intval($_SESSION['USER']['ID']);
            $class_id = ClassesController::_getFromPage(null,$archivePageId);

            $graderActivity = new GraderActivity($archivePageId,$courseId,$class_id,$group_id,$user_id,$input->sortOrder);
            $data = $graderActivity->getAndPreparePosts(true);
            $data->questionsAfterLeaveByStudents = AfterLeavePageQuestions::pageResponses($archivePageId);;
            if($data->questionsAfterLeaveByStudents && !$data->page){
                $data->page = \English3\Controller\PageController::_get(Utility::getInstance()->reader,$archivePageId);
            }
            $data->postmessages = GraderActivity::prepareTimedReviewTextPrompts(json_decode(json_encode($data->postmessages),true));
            header('Content-Type: application/json');
            print json_encode($data);
        }
    }
    
    exit();
}

function getQuizzes($page_id)
{
    $grade_postSQL = new GradePostSQL();
    $need_grade    = $grade_postSQL->query("select distinct quiz_responses.quiz_id, quiz_responses.user_id from quiz_responses
  left join quiz_scores on quiz_scores.quiz_id = quiz_responses.quiz_id
    where quiz_responses.quiz_id = {$page_id} and is_correct = -1 and quiz_scores.is_finished = 1;");
    $users         = array();
    foreach ($need_grade as $row)
        $users[] = $row->user_id;
    $need_grade    = $grade_postSQL->get_quiz_responses($page_id, $users);
    $data          = new \stdClass();
    $data->content = $need_grade;
    return $data;
}
?>