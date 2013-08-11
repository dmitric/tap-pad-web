tap-pad-web
===========

Music Hackday Toronto 2013 - Web based tap pad.

Made by Dmitri Cherniak ([@dmitric](http://twitter.com/dmitric))

Building
-------------

The front end uses LESS and Coffeescript:

Generating CSS
```
lessc --yui-compress less/style.less > static/css/style.min.css
```

Generating JS

```
cake build
cake minify
cake push
```

Backend is a simple tornado server, just run

```
pip install -r requirements.txt
python tap-pad.py (--debug=True if you want debug mode)
```

About
-----------

Just tap on the grid and get started.

![A slick screenshot](http://i.imgur.com/GydrFbG.png)

Generate interesting musical patterns using basic rules of cellular automatons.

You'd be surprised how beautiful some of these "random" yet 100% reproducible patterns are. Its sounds totally unique, but it's completely deterministic.

Here's an example: http://tap-pad.herokuapp.com/100151560522043100242

All of the code ([web](https://github.com/dmitric/tap-pad-web) and [iOS](https://github.com/dmitric/tap-pad-ios)) is open sourced under MIT so have fun.

PS. I read somewhere that Torontonians are statistically more likely to enjoy Drake, so I made a little something just for you [here](http://tap-pad.herokuapp.com/drake)
