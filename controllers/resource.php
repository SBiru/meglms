<?php
function create_resource_pdf($src){
    ?>
    <embed src="<?php echo $src; ?>" width="100%" height="100%" alt="pdf" pluginspage="http://www.adobe.com/products/acrobat/readstep2.html">
    </embed>
    <?php
}
if($_REQUEST['type']==='pdf'){
    create_resource_pdf($_REQUEST['src']);
}
?>

