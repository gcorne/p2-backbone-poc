<?php $p3_posts = new P3_Posts(); ?>
<?php get_header(); ?>
<div id="main" class="container">

</div>

<script>
jQuery(function() {
    app.Posts.reset( <?php echo $p3_posts->to_json(); ?> );
});
</script>

<?php get_footer(); ?>
