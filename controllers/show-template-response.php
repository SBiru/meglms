<?php
global $PATHS, $DB;
require_once ('sql.php');
require_once ('_utils.php');
?>
<style>
body{
	margin: 0;
  padding: 0;
}
.logo{
position:absolute;
top:0px;

}
</style>
<img class="logo" src="http://localhost/public/img/e3-green-logo.png" style="height:50px;width:144px">
<div style="width:100%;height:50px;background-color:black">
</div>
<?php
if (isset($_SESSION['USER']) && isset($_SESSION['USER']['LOGGED_IN']) && isset($_SESSION['USER']['ID']) && $_SESSION['USER']['ID'] > 0 && $_SESSION['USER']['LOGGED_IN'] == true) {
if (count($_GET) > 1){exit;}
$id = preg_replace('/\D+/xsi','',$_GET['i']);
$result = $DB->mysqli->query("select message from posts where id = '$id'");
        if ($result->num_rows > 0) {
            $row = $result->fetch_object();
            $template = json_decode($row->message);
        }

if (isset($template->template)){
$html = file_get_contents($PATHS->app_path.$PATHS->base_site_public_path.'htmlTemplates/'.$template->template);
$i = 0;
foreach ($template->templateContent as $content){
	$html = preg_replace('@ng-model="templateContent\\['.$i.'\\]">@xsi','readonly>'.$content,$html);	
$i+=1;
}exit($html);
}

}