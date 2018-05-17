<?php
session_start();

if(!$_SESSION['USER']){
    echo 'Not authorized';
    exit();
}
if(!isset($_GET['file'])){
    echo 'No file';
    exit();
}
$file = $_SERVER['DOCUMENT_ROOT'].$_GET['file'];

if(!file_exists($file)){
    http_response_code(404);
    echo('Page not found'); // provide your own HTML for the error page
    die();
}
$mimetype = mime_content_type($file);
if($mimetype){
    header( 'Content-Type: ' . $mimetype );
    header( 'Content-Length: ' . filesize( $file ) );
    readfile( $file );
}
