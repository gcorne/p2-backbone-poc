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

	jQuery(function() {
		p3.Comment = Backbone.Model.extend({
			action: 'p3_comment',
			idAttribute: 'comment_ID',
			initialize: function(attributes) {
				if(_.has(attributes, 'children')) {
					this.children = new p3.CommentList(attributes.children);
					this.children.post = this.collection.post;
					this.unset('children', {silent: true});
				}
			},
		});

		p3.CommentList = Backbone.Collection.extend({
			model: p3.Comment,
			action: 'p3_comments',
			load: function() {
				this.fetch({ data: { action: this.action, post_id: this.post.id }});
			},

			parse: function(response) {
				var byParent = _.groupBy(response, function(comment) { return comment.comment_parent });
				var tree = this.buildTree(byParent);
				return tree;
			},

			buildTree: function(byParent) {
				var tree = byParent[0];
				_.each(tree, function(comment, index, tree) {
					this.addChildren(tree, comment, byParent);
				}, this);
				return tree;
			},

			addChildren: function(tree, comment, byParent) {
				if(_.has(byParent, comment.comment_ID)) {
					comment.children = byParent[comment.comment_ID];
					_.each(comment.children, function(comment) {
						this.addChildren(tree, comment, byParent);
					}, this);
				}
			}
		});

		p3.CommentsTree = React.createBackboneClass({
			render: function() {
				var nodes, childNodes;
				if (this.props.model.models) {
					nodes = this.props.model.models;
				} else if (this.props.model.children != null) {
					nodes = this.props.model.children;

				}
				if(nodes) {
					childNodes = nodes.map(function(model) {
					return ( React.DOM.li(null, CommentsTree( {model:model} )) );
				} );
				}
				return (
				React.DOM.div(null, 
					React.DOM.p(null, 
					this.props.model.get( 'comment_content')
					),
					React.DOM.ul(null, 
					childNodes
					)
				)
				);
			}
		});

		p3.Post = Backbone.Model.extend({
			idAttribute: 'ID', // yuck
			initialize: function() {
				this.comments = new p3.CommentList();
				this.comments.post = this;
				this.comments.load();
			},
		});

		p3.Posts = Backbone.Collection.extend({
			model: p3.Post,
			action: 'p3_posts',
		});

		p3.PostView = Backbone.View.extend({
			tagName: 'div',
			className: 'post',

			template: _.template(jQuery('#post-tmpl').html()),

			events: {
				'click .comments': 'showComments'
			},

			initialize: function() {
				this.listenTo(this.model, 'change', this.refresh);
			},

			render: function() {
				this.$el.html(this.template(this.model.toJSON()));
				return this;
			},

			refresh: function() {
				this.render(false);
			},

			showComments: function() {
				if ( ! this.commentsVisible ) {
					this.commentsVisible = true;
					if ( ! this.commentList ) {
						this.commentList = CommentsTree({ model: this.model.comments });
						var el = this.$el.find('div.comments').get(0);
						React.renderComponent( this.commentList, el );
					} else {
						this.commentList.show();
					}
				} else {
					this.commentList.hide();
					this.commentsVisible = false;
				}
			}

			reply: function() {
				this.$el.append(jQuery('#reply-tmpl').html());
			},

			addComment: function(e) {
				var name = this.$el.find('form [name="name"]').val();
				var email = this.$el.find('form [name="email"]').val();
				var comment = this.$el.find('form [name="comment"]').val();
				this.model.collection.create({
					comment_author: name,
					comment_content: comment,
					comment_author_email: email,
					comment_post_ID: this.model.collection.post.id,
					comment_parent: this.model.get('comment_ID')
				});
				this.$el.find('form').remove();
				e.preventDefault();
			}
		});


		p3.AppView = Backbone.View.extend({
			el: jQuery('#main'),

			initialize: function() {
				this.listenTo(app.Posts, 'add', this.addOne);
				this.listenTo(app.Posts, 'reset', this.addAll);
			},

			addAll: function() {
				app.Posts.each(this.addOne, this);
			},

			addOne: function(post) {
				var view = new p3.PostView({ model: post });
				$container = jQuery('<div/>').addClass('container');
				this.$el.append($container.append(view.render().el));
			}

		});

		app.Posts = new p3.Posts;
		app.View = new p3.AppView;

		setInterval(function() {
			app.Posts.fetch({update: true, remove: false});
		}, 10000);

	});
})( window.jQuery, window._, window.Backbone, window.p3, window.app );
