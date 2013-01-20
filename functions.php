<?php


class P3 {
	
	static function bind_hooks() {
		add_action( 'wp_head', array( __CLASS__, 'enqueue_scripts' ), 1, 1 );
		add_action( 'wp_ajax_nopriv_p3_posts', array( 'P3_Ajax', 'posts' ) );
		add_action( 'wp_ajax_p3_posts', array( 'P3_Ajax', 'posts' ) );
	}

	static function enqueue_scripts() {
		wp_enqueue_script( 'p3-underscore', get_stylesheet_directory_uri() . '/js/underscore.js', array(), '1.4.3' );
		wp_enqueue_script( 'p3-backbone', get_stylesheet_directory_uri() . '/js/backbone.js', array( 'p3-underscore', 'jquery' ), '0.9.10' );
		wp_enqueue_script( 'p3-main', get_stylesheet_directory_uri() . '/js/main.js', array( 'jquery', 'p3-backbone' ), '1.0' );
	}

}

add_action( 'init', array( 'P3', 'bind_hooks' ) );

abstract class P3_Model {


}


// Adapter that adapts WP_Post to our post intended for more public view.
class P3_Post {

}


class P3_Ajax {

	static function posts() {
		$query = new WP_Query( array( 'post_type' => 'post', 'post_status' => 'publish' ) );
		$posts = new P3_Posts( $query );
		$posts->json_response();
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

class P3_Authors {


}
