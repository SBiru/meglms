jQuery(document).ready(function() {
	$(".onhover").hover(
		function(){ $(this).addClass('open') },
		function(){ $(this).removeClass('open') }
	);
});