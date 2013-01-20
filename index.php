<?php $p3_posts = new P3_Posts(); ?>
<?php get_header(); ?>
<div id="main">

</div>

<script>
jQuery(function() {
    App.Posts.reset( <?php echo $p3_posts->to_json(); ?> );
});
</script>

<script id="post-tmpl" type="text/template">
    <div class="post" data-role-id="<%- ID %>">
        <h3><a href="<%- permalink %>"><%- post_title %></a></h3>
    </div>
</script>
<?php get_footer(); ?>
