/** @jsx React.DOM */

P3 = {};
App = {};

Backbone.sync = function(method, model, options) {
	var params = {dataType: 'json'};

	params.url = ajaxUrl;
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
		// options.data needs to be merged with params.data
	}

	// Make the request, allowing the user to override any Ajax options.
	var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
	model.trigger('request', model, xhr, options);
	return xhr;
}

jQuery(function() {
    P3.Comment = Backbone.Model.extend({
		action: 'p3_comment',
		idAttribute: 'comment_ID',
		initialize: function(attributes) {
			if(_.has(attributes, 'children')) {
				this.children = new P3.CommentList(attributes.children);
				this.children.post = this.collection.post;
				this.unset('children', {silent: true});
			}
		},
    });

    P3.CommentList = Backbone.Collection.extend({
		model: P3.Comment,
		action: 'p3_comments',
		load: function() {
			this.fetch({ data: { action: this.action, post_id: this.post.id } });
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

    P3.CommentView = Backbone.View.extend({
		tagName: 'li',
		className: 'comment',

		model: P3.Comment,
		events: {
			'click .reply:first' : 'reply',
			'submit form': 'addComment'
		},

		template: _.template(jQuery('#comment-tmpl').html()),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			if(_.has(this.model, 'children')) {
				this.children = new P3.CommentsView({ model: this.model.children });
				this.$el.append(this.children.el);
			}
			return this;
		},

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

	P3.CommentsView = Backbone.View.extend({
		tagName: 'ul',
		className: 'comments',
		initialize: function() {
			this.listenTo(this.model, 'add', this.addOne);
			this.listenTo(this.model, 'reset', this.addAll);
			this.addAll();
		},
		load: function() {
			this.model.load();
		},
		addAll: function() {
			this.model.each(this.addOne, this);
		},

		addOne: function(comment) {
			var view = new P3.CommentView({ model: comment });
			this.$el.append(view.render().el);
		},
	});

	P3.Post = Backbone.Model.extend({
		idAttribute: 'ID', // yuck   
		initialize: function() {
			this.comments = new P3.CommentList();
			this.comments.post = this;
			this.comments.load();
		},
		// update comments if comment count changes
	});

	P3.Posts = Backbone.Collection.extend({
		model: P3.Post,
		action: 'p3_posts',
	});

	CommentsTree = React.createBackboneClass({
		render: function() {
			var nodes, childNodes;
			if (this.props.model.models) {
				nodes = this.props.model.models;
			} else if (this.props.model.children != null) {
				nodes = this.props.model.children;

			}
			if(nodes) {
				childNodes = nodes.map(function(model) {
				return ( <li><CommentsTree model={model} /></li> );
			} );
			}
			return (
			<div>
				<p>
				{this.props.model.get( 'comment_content')}
				</p>
				<ul>
				{childNodes}
				</ul>
			</div>
			);
		}
	});

	P3.PostView = Backbone.View.extend({
		tagName: 'div',
		className: 'post',

		template: _.template(jQuery('#post-tmpl').html()),

		events: {
			'click .comments': 'showComments'
		},

		initialize: function() {
			this.listenTo(this.model, 'change', this.refresh);
		},

		render: function(loadComments) {
			this.$el.html(this.template(this.model.toJSON()));
			if ( this.commentsOpen == true && loadComments == true) this.showComments();
			return this;
		},

		refresh: function() {
			this.render(false);
		},

		showComments: function() {
			this.commentsOpen = true;
			this.commentList = CommentsTree({ model: this.model.comments });
			var el = this.$el.find('div.comments').get(0);
			React.renderComponent( this.commentList, el );
		}

	});

	P3.AppView = Backbone.View.extend({
		el: jQuery('#main'),

		initialize: function() {
			this.listenTo(App.Posts, 'add', this.addOne);
			this.listenTo(App.Posts, 'reset', this.addAll);
		},


		addAll: function() {
			App.Posts.each(this.addOne, this);
		},

		addOne: function(post) {
			var view = new P3.PostView({ model: post });
			$container = jQuery('<div/>').addClass('container');
			this.$el.append($container.append(view.render().el));
		}

	});

	App.Posts = new P3.Posts;
	App.View = new P3.AppView;

	setInterval(function() {
		App.Posts.fetch({update: true, remove: false});
	}, 10000);

});
