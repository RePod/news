/*
    RePod - https://github.com/RePod
    Object-literal boner.

    Still haven't found a solution to resolving the parent dynamically.
*/

var News = {
    init: function() {
        var that = this,
            slip = window.location.hash.split("#").pop();

        $("i.fa-refresh").click(function() { that.run(); });
        $("span#level").click(function() { that.config(); });
        $("i#playback").click(function() { that.play.toggle(); });

        this.config(true);
        this.run((slip) ? "r/"+slip+".json" : false);
    },
    config: function(silent) { //Holy copy paste.
        if (!localStorage['breakingNewsSuffix']) {
            localStorage['breakingNewsSuffix'] = 'r/gfycats/random.json';
            silent = false;
        }
        var url;

        if (!silent) {
            url = prompt('Enter path to use:\nExamples: r/all, r/earthporn/random\nAlso supports direct links to JSON.\n\nTo configure this later click "Breaking News".', localStorage['breakingNewsSuffix']);
        }

        if (url) {0
            if (!/(\.json$|\.json\?)/.test(url)) { //Weird regex incoming.
                if (/\?/.test(url) && !/\.json\?/.test(url)) { url.replace('?','.json?'); }
                else { url += ".json"; }
            }
            console.log(url);
            localStorage['breakingNewsSuffix'] = url;
            this.play.stop();
            this.fetch.cache = [];
            this.run();
        }
    },
    play: {
        interval: 0,
        toggle: function(time) {
            if ($("i#playback").hasClass('fa-pause')) { //Pause
                this.stop();
            } else { //Play
                this.start(time);
            }
        },
        start: function(time) {
            this.stop();

            var time = (time || prompt("Amount in seconds before advancing:\n(minimum: 5)", "5"));
                time = Math.max(parseInt(time), 5) * 1000;

            this.interval = setInterval(function() { News.run(); }, time);
            $("i#playback").removeClass('fa-play').addClass('fa-pause fa-spin').css({"animation-duration": time/1000+"s"});

            News.run();
        },
        stop: function() {
            $("i#playback").removeClass('fa-pause fa-spin').addClass('fa-play');
            clearInterval(this.interval);
        }
    },
    run: function(input) {
        var that = this;

        this.fetch.go((input || localStorage['breakingNewsSuffix']));
    },
    fetch: {
        cache: [],
        go: function(suffix,callback) {
            $("span#live i.fa-refresh").addClass("fa-spin");

            var suffix = (suffix || "r/all.json"), //"/search.json?q=self%3Ano+nsfw%3Ano&restrict_sr=&sort=new&t=hour"
                that = this;
            //var suffix = "/search.json?q=&sort=top&restrict_sr=on&t=hour";

            if (this.cache.length == 0) {
                $.getJSON("//www.reddit.com/"+suffix, function(data) {
                    var post;

                    if (data.length > 0) { //Single returned post.
                        that.cache[0] = data[0].data.children[0];
                    } else { //Multiple returned posts.
                        //Potentially cache this.
                        that.cache = data.data.children;
                    }

                    (callback || that.generateInfo());
                });
            } else {
                (callback || that.generateInfo());
            }
        },
        generateInfo: function() {
                var c = this.cache.length,
                    i = Math.floor(Math.random() * c),
                    post = this.cache.splice(i,1)[0].data;

                var temp = {
                    'title': post.title,
                    'subtitle': News.randomSubtitle(),
                    'source': post.domain,
                    'url': post.url,
                    'permalink': '//reddit.com'+post.permalink,
                    'minipermalink': post.subreddit+'/'+post.id
                };

                temp.background = News.background.determine(temp,post);
                
                window.location.hash = temp.minipermalink;

                //this.apply(temp,post);

                News.updateCards(temp);
        }
    },
    background: {
        determine: function(temp,post) {
            //Determine background. Potential for YouTube embeds.
            var background;
            if (/\.(gifv?|webm|mp4|jpe?g|png)$/.test(temp.url)) { background = temp.url; }
            else if (/gfycat.com/.test(temp.url)) { this.gfycat(temp.url); return false; }
            else if (post.preview) { background = post.preview.images[0].source.url; }
            else { background = 'assets/static.jpg'; }
            return background.replace(/https?:/,"").replace("&amp;","&").replace(".gifv",".mp4");
        },
        apply: function(post) {
            //Update the background.
            $("body").css("background", "" /*"#0f0f0f url('assets/static.jpg') no-repeat scroll center center / cover"*/);
            $("video#background").attr("src","");
            if (/\.(gif|jpg|png)$/.test(post.background.split("?")[0])) {
                $("body").css("background","blue url('"+post.background+"') no-repeat scroll center center / cover");
            } else if (/\.(gifv|webm|mp4)$/.test(post.background)) {
                $("video#background").attr("src",post.background);
                $("video").get(0).play()
            } else {
                //What?
            }
        },
        gfycat: function(url) { //GfyCat support. Requires polling their own API to retrieve the true URL. Advantages include potential size and format limits or using GIF(why).
            var that = this,
                name = url.match(/\.com\/(\w+)/).pop();

            $.getJSON("//gfycat.com/cajax/get/"+name, function(data) {
                that.apply({background: data.gfyItem.mp4Url});
            });
        }
    },
    updateCards: function(post) {
        post = (post || {'title': 'GENOCIDAL MANIAC ON THE LOOSE', 'subtitle': 'World leaders something something', 'source': 'BLT Community'});

        //Update the textual information.
        $("a#title").text(post.title).attr("href",post.permalink);
        $("span#description").html(post.subtitle);
        $("a#where").text("via: "+post.source).attr("href", post.url);

        if (post.background) { this.background.apply(post); }

        $("i.fa-refresh").removeClass("fa-spin"); //Remove spinning animation.
    },
    randomSubtitle: function() {
        var subtitles = [
            "Trouble looms on the horizon.",
            "The worst has yet to come.",
            "Best minds left speechless.",
            "Nobody expected it, but say they will now.",
            "Is this the start of something bigger?",
            "\"It's better than nothing.\"",
            "Can it get any worse?",
            "Think of the children.",
            "Local man claims nobody listened to him.",
            "Foreign stocks on the rise.",
            "Who knew?",
            "Unsponsored news network",
            "Viral videos on the rise.",
            "World leaders scramble for answer.",
            "Series premiere this Fall."
        ],
            subtitle= "";

        for (i = 0; i <= 6; i++) {
            var index = Math.floor(Math.random()*subtitles.length);

            subtitle += "<span>"+subtitles.splice(index,1)+"</span>";
        }

        return subtitle;
    }
}

$(document).ready(function() {
    News.init();
});