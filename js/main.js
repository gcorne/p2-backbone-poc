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


    var success = options.success;
    options.success = function(resp) {
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };

    var error = options.error;
    options.error = function(xhr) {
      if (error) error(model, xhr, options);
      model.trigger('error', model, xhr, options);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
}

jQuery(function() {
    P3.Comment = Backbone.Model.extend({
        action: 'p3_comment'   
    });

    P3.CommentList = Backbone.Collection.extend({
        model: P3.Comment,
        action: 'p3_comments',
        loadComments: function() {
            this.fetch({ data: { action: this.action, post_id: this.post.id }});
        }
    });

    P3.CommentView = Backbone.View.extend({
        model: P3.Comment,
        events: {
            'click .reply' : 'reply',
            'submit form': 'addComment'
        },

        template: _.template(jQuery('#comment-tmpl').html()),
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        reply: function() {
            this.$el.append(jQuery('#reply-tmpl').html());
        },

        addComment: function(e) {
            var name = this.$el.find('form [name="name"]').val();
            var email = this.$el.find('form [name="email"]').val();
            var comment = this.$el.find('form [name="comment"]').val();
            this.model.collection.create({ comment_author: name, comment_content: comment, comment_author_email: email, comment_post_ID: this.model.collection.post.id });
            this.$el.find('form').remove();
            e.preventDefault();
        }
    });

    P3.CommentsView = Backbone.View.extend({
        tagName: 'ul',

        initialize: function() {
            this.model.loadComments();
            this.listenTo(this.model, 'add', this.addOne);
            this.listenTo(this.model, 'reset', this.addAll);
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
        },
        // update comments if comment count changes
    });

    P3.Posts = Backbone.Collection.extend({
        model: P3.Post,
        action: 'p3_posts',
    });


    P3.PostView = Backbone.View.extend({
        tagName: 'div',

        template: _.template(jQuery('#post-tmpl').html()),

        events: {
            'click .comments': 'showComments'
        },

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        showComments: function() {
            this.commentList = new P3.CommentsView({ model: this.model.comments });
            this.$el.append(this.commentList.el);
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
