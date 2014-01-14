/** @jsx React.DOM */
window.p3 = window.p3|| {};
window.app = window.app || {};

( function( $, _, Backbone, p3, app ) {

	Backbone.sync = function(method, model, options) {
		var params = {dataType: 'json'},

		options = options || {};
		params.url = p3.ajaxUrl;
		params.cache = false;
		params.data = {};

		// WordPress ajax action
		params.data.action = model.action;
		params.data.method = method;

		params.contentType = 'application/x-www-form-urlencoded';
		if ( method == 'create' || method == 'update' || method == 'patch' || method == 'delete' ) {
			params.type = 'POST';
			params.data.model = JSON.stringify(options.attrs || model.toJSON(options));
		} else {
			params.type = 'GET';
			params.data = _.defaults( options.data || {}, params.data );
		}


		// Make the request, allowing the user to override any Ajax options.
		var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
		model.trigger('request', model, xhr, options);
		return xhr;
	}

	p3.Post = Backbone.Model.extend({
		idAttribute: 'ID', // yuck
		initialize: function() {
			this.comments = new p3.CommentList( { post: this } );
		},
	});

	p3.Posts = Backbone.Collection.extend({
		model: p3.Post,
		action: 'p3_posts'
	});

	p3.Comment = Backbone.Model.extend({
		action: 'p3_comment',
		idAttribute: 'comment_ID'
	});

	p3.CommentList = Backbone.Collection.extend({
		model: p3.Comment,
		action: 'p3_comments',
		initialize: function( options ) {
			this.post = options.post;
			this.load();
			this.listenTo( this.post, 'change:comment_count', this.load );
		},

		load: function() {
			this.fetch({ data: { action: this.action, post_id: this.post.id }, update: true});
		},

		getChildNodes: function( id ) {
			return this.where( { comment_parent: id } ); 
		}
	});

	var CommentView = React.createBackboneClass({
		getInitialState: function() {
			return { replyFormVisible: false };
		},
		toggleReplyForm: function() {
			this.setState( { replyFormVisible: ! this.state.replyFormVisible } );
		},

		render: function() {
			var replyForm;

			if ( this.state.replyFormVisible ) {
				replyForm = <CommentForm model={ this.props.model } onSubmit={ this.toggleReplyForm } isReply={true} />
			}

			return (
				<div>
					<div className="avatar" dangerouslySetInnerHTML={{__html: this.props.model.get( 'avatar')}}></div>
					<p className="author">{ this.props.model.get( 'comment_author' ) }</p>
					<p dangerouslySetInnerHTML={{__html: this.props.model.get( 'comment_content')}}></p>
					<p className="actions"><span className="reply" onClick={ this.toggleReplyForm }>reply</span></p>
					{ replyForm }
				</div>
			);
		}
	});

	var CommentsTreeView = React.createBackboneClass({
		render: function() {
			var nodes,
				childNodes,
				commentList,
				comment,
				model = this.props.model;
			if ( this.props.isRoot ) {
				nodes = model.getChildNodes( "0" );
			} else {
				comment = <CommentView model={model}/>;
				nodes = model.collection.getChildNodes( model.get( 'comment_ID' ) );
			}

			if( nodes ) {
				childNodes = nodes.map(function( model ) {
					return ( <li key={model.get('cid')}><CommentsTreeView model={ model } /></li> );
				} );
			}

			return (
			<div>
				{comment}
				<ul>
				{childNodes}
				</ul>
			</div>
			);
		}
	})

	var CommentForm = React.createBackboneClass({
		handleSubmit: function() {
			var text = this.refs.text.getDOMNode().value.trim(),
				model = this.props.model,
				comment;
			comment = {
				comment_content: text,
				user_id: p3.currentUser
			};

			if ( this.props.isReply ) {
				comment.comment_parent = model.get( 'comment_ID' );
				comment.comment_post_ID = model.get( 'comment_post_ID' );
				model.collection.create( comment );
			} else {
				comment.comment_post_ID = model.get( 'ID' );
				comment.comment_parent = "0";
				model.comments.create( comment );
				model.set({ comment_count: 1 });
			}

			this.refs.text.getDOMNode().value = '';
			this.props.onSubmit();
			return false;
		},
		render: function() {
			return (
			<form className="commentForm" onSubmit={this.handleSubmit}>
				<input type="text" placeholder="Say something..." ref="text" />
				<input type="submit" value="Post" />
			</form>
			);
		}
	});


	var PostView = React.createBackboneClass({
		getInitialState: function() {
			return { commentsVisible: false, commentFormVisible: false };
		},

		toggleComments: function() {
			this.setState({commentsVisible: ! this.state.commentsVisible});
		},
		toggleForm: function() {
			this.setState({commentFormVisible: ! this.state.commentFormVisible});
		},
		onFirstComment: function() {
			this.toggleComments();
			this.toggleForm();
		},
		render: function()  {
			var action,
				comments,
				commentForm,
				model = this.props.model,
				commentsClass = this.state.commentsVisible ? 'comments' : 'comments hidden';

			if ( model.get( 'comment_count' ) == 0 ) {
				if ( this.state.commentFormVisible ) {
					commentForm = <CommentForm model={model} onSubmit={this.onFirstComment}/>;
				}
				comments = (
					<div>
					<span className="new-comment" onClick={this.toggleForm}>new comment</span>
					{ commentForm }
					</div>
				);
			} else {
				comments = (
					<div>
					<span className="comments" onClick={this.toggleComments}>{ this.props.model.get( 'comment_count' ) } comments</span>
					<div className={commentsClass}><CommentsTreeView model={this.props.model.comments} isRoot={true} /></div>
					</div>
				);
			}
			return (
			<div>
			<h3><a href={ this.props.model.get( 'permalink' ) } dangerouslySetInnerHTML={{__html: this.props.model.get( 'post_title' ) }}></a></h3>
			<div className="content" dangerouslySetInnerHTML={{__html: this.props.model.get( 'post_content' )}}></div>
			{ comments }
			</div>
			);
		}
	});

	var PostList = React.createBackboneClass({
		render: function() {
			var posts = this.props.model.map( function( model ) {
				return <div className="post" key={model.get('cid')}><PostView model={model} /></div>;
			});
			return <div>{ posts }</div>;
		}
	});

	app.Posts = new p3.Posts();

	$( function() {

		React.renderComponent( 
			<PostList model={ app.Posts } />,
			document.getElementById( 'main' )
		);

		setInterval(function() {
			app.Posts.fetch({update: true, remove: false});
		}, 4000);

	} );

})( window.jQuery, window._, window.Backbone, window.p3, window.app );
