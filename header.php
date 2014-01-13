<!DOCTYPE html>
<html>
    <head>
        <?php wp_head(); ?>
    </head>
	<body>
	<div id="wrap">
		<div class="container">
			<header class="navbar navbar-default" role="banner">
				<div class="container">
					<div class="navbar-header">
						<a class="home-link navbar-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" title="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
					</div>
				</div>
			</header>

