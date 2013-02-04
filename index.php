<?php $p3_posts = new P3_Posts(); ?>
<?php get_header(); ?>
<div id="main" class="container">

</div>

<script>
jQuery(function() {
    App.Posts.reset( <?php echo $p3_posts->to_json(); ?> );
});
</script>

<script id="post-tmpl" type="text/template">
	<h3><a href="<%- permalink %>"><%- post_title %></a></h3>
	<span class="comments"><%- comment_count %> comments</span>
</script>

<script id="comment-tmpl" type="text/template">
	<span class="author"><%- comment_author %></span>
	<p><%- comment_content %></p>
	<span class="reply">reply</span>
</script>

<script id="reply-tmpl" type="text/template">
    <form>
    <label for="">Name</label><input id="" type="text" name="name" />
    <label for="">Email</label><input id="" type="text" name="email" />
    <textarea id="" name="comment"></textarea><button>reply</button>
    </form>
</script>
<?php get_footer(); ?>
