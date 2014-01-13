<?php


class P3 {

	static function bind_hooks() {
		add_action( 'wp_head', array( __CLASS__, 'enqueue_scripts' ), 1, 1 );
		add_action( 'wp_ajax_nopriv_p3_posts', array( 'P3_Ajax', 'posts' ) );
		add_action( 'wp_ajax_p3_posts', array( 'P3_Ajax', 'posts' ) );
		add_action( 'wp_ajax_nopriv_p3_comments', array( 'P3_Ajax', 'comments' ) );
		add_action( 'wp_ajax_p3_comments', array( 'P3_Ajax', 'comments' ) );
		add_action( 'wp_ajax_nopriv_p3_comment', array( 'P3_Ajax', 'comment' ) );
		add_action( 'wp_ajax_p3_comment', array( 'P3_Ajax', 'comment' ) );
	}

	static function enqueue_scripts() {
		wp_enqueue_style( 'p3-bootstrap', get_stylesheet_directory_uri() . '/css/bootstrap.css', array(), '2.2.2' );
		wp_enqueue_script( 'p3-bootstrap', get_stylesheet_directory_uri() . '/js/bootstrap.js', array(), '2.2.2' );
		wp_enqueue_script( 'p3-underscore', get_stylesheet_directory_uri() . '/js/underscore.js', array(), '1.4.3' );
		wp_enqueue_script( 'p3-backbone', get_stylesheet_directory_uri() . '/js/backbone.js', array( 'p3-underscore', 'jquery' ), '0.9.10' );
		wp_enqueue_script( 'p3-main', get_stylesheet_directory_uri() . '/js/main.js', array( 'jquery', 'p3-backbone' ), '1.0' );

        $data = array( 'ajaxUrl' => P3_Ajax::ajax_url() );

        wp_localize_script( 'p3-main', 'p3', $data );
	}

}

add_action( 'init', array( 'P3', 'bind_hooks' ) );

class P3_Ajax {

	static function posts() {
		$query = new WP_Query( array( 'post_type' => 'post', 'post_status' => 'publish' ) );
		$posts = new P3_Posts( $query );
		$posts->json_response();
	}

	static function comment() {
		if ( isset( $_POST ) ) {
			$comment = (array) json_decode( stripslashes( $_POST['model'] ) );
			switch( $_POST['method'] ) {
				case 'create':
					$id = wp_insert_comment( $comment );
					if ( $id ) {
						$inserted_comment = get_comment( $id );
						header('Content-type: application/json');
						echo json_encode( $inserted_comment );
						die();
					}
				break;
			}

		}
	}

	static function comments() {
		$post_id = (int) $_REQUEST['post_id'];

		$query = new WP_Comment_Query;
		$comments = $query->query( array( 'post_id' => $post_id ) );
		$p3_comments = new P3_Comments( $comments );
		$p3_comments->json_response();

	}

	static function ajax_url() {
		$blog_id = get_current_blog_id();
		$blog = get_blog_details( $blog_id );

		// Generate the ajax url based on the current scheme
		$admin_url = admin_url( 'admin-ajax.php', is_ssl() ? 'https' : 'http' );

		// If present, take domain mapping into account
		if ( isset( $blog->primary_redirect ) )
			$admin_url = preg_replace( '|https?://' . preg_quote( $blog->domain ) . '|', 'http://' . $blog->primary_redirect, $admin_url );
		return $admin_url;
	}
}


class P3_Posts {
	public $posts;

	function __construct( $query = null ) {
		if ( isset( $query ) ) {
			$this->query = $query;
		} else {
			$this->query = $GLOBALS['wp_query'];
		}
		$this->create_posts_from_query();
	}

	function create_posts_from_query() {
		foreach ( (array) $this->query->posts as $wp_post ) {
			$post = new StdClass;
			$this->copy_properties( $post, $wp_post );
			$this->add_meta( $post );
			$this->posts[] = $post;
		}
	}

	function copy_properties( $post, WP_Post $wp_post) {
		$properties = array( 'ID', 'post_type', 'post_author', 'post_title', 'post_content', 'post_date_gmt', 'post_modified_gmt', 'post_parent', 'menu_order', 'comment_status', 'comment_count' );
		foreach ( $properties as $property ) {
			$post->$property = $wp_post->$property;
		}
	}

	function add_meta( $post ) {
		$post->permalink = get_permalink( $post->ID );
		$post->format = get_post_format( $post->ID );
		$post->avatar = get_avatar( $post->post_author );
	}


	function to_json( ) {
		return json_encode( $this->posts );
	}

	function json_response() {
		header( 'Content-type: application/json' );
		echo $this->to_json();
		die();
	}

}

class P3_Comments {

	function __construct( $comments = null ) {
		$this->comments = $comments;
		$this->set_avatars();
	}

	function set_avatars() {
		foreach( $this->comments as $comment ) {
			if ( ! empty( $comment->user_id ) ) {
				$comment->avatar = get_avatar( $comment->user_id );
			} else {
				$comment->avatar = get_avatar( $comment->comment_author_email );
			}
		}
	}

	function to_json( ) {
		return json_encode( $this->comments );
	}

	function json_response() {
		header( 'Content-type: application/json' );
		echo $this->to_json();
		die();
	}
}

class P3_Authors {


}
