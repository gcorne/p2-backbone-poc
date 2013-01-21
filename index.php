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
    <div class="post">
        <h3><a href="<%- permalink %>"><%- post_title %></a></h3>
        <span class="comments"><%- comment_count %> comments</span>
    </div>
</script>

<script id="comment-tmpl" type="text/template">
    <li class="comment">
        <span class="author"><%- comment_author %></span>
        <p><%- comment_content %></p>      
    </li>
</script>
<?php get_footer(); ?>
