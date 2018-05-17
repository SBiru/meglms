
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>%html_title%</title>
    <style>
        .clearfix::before{
            content: " ";
            display: table;
        }
        .clearfix::after {
            display: block;
            content: "";
            clear: both;
        }
        <?php global $PATHS;include($PATHS->app_path . '/public/css/forum.css'); ?></style>
</head>
<body style="max-width: 950px;margin: auto;">
    %body%
</body>
</html>