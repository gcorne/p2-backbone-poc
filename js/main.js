P3 = {};
App = {};
Backbone.emulateJSON = true;
Backbone.emulateHTTP = true;

jQuery(function() {
    P3.Comment = Backbone.Model.extend();

    P3.Comments = Backbone.Collection.extend();

    P3.Post = Backbone.Model.extend({
        idAttribute: 'ID'   
    });

    P3.Posts = Backbone.Collection.extend({
        model: P3.Post,
        action: 'p3_posts',

        sync: function( method, collection, options ) {
            options.data = { action: 'p3_posts' };
            Backbone.sync( method, collection, options );
        },

        beforesend: function( xhr ) {
            console.log( 'Before send running...' );
            console.log(xhr);

        }
    });

    App.Posts = new P3.Posts;
    App.Posts.url = '/wp-admin/admin-ajax.php';


    P3.PostView = Backbone.View.extend({
        tagName: 'div',

        template: _.template(jQuery('#post-tmpl').html()),

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
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
            this.$el.append(view.render().el);
        }

    });

    App.View = new P3.AppView;
    
    setInterval(function() {
        App.Posts.fetch({update: true, remove: false});
    }, 10000);
    
});
