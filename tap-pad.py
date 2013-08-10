import tornado.web
from tornado.options import define, options
import os

define("config")
define("debug", default=False)
define("cookie_secret", default="music-hack-day")
define("port", default=8080, type=int)


class TapPadApplication(tornado.web.Application):
    def __init__(self):
        base_dir = os.path.dirname(__file__)
        settings = {
            "cookie_secret": options.cookie_secret,
            "static_path": os.path.join(base_dir, "static"),
            "template_path": os.path.join(base_dir, "templates"),
            "debug": options.debug,
            "ui_modules": {
            	"CSSModule": CSSModule,
            	"JSModule": JSModule
            },
        }
        tornado.web.Application.__init__(self, [
            tornado.web.url(r"/([^/]*)/?", PadHandler, name="player"),
        ], **settings)

class BaseHandler(tornado.web.RequestHandler):
	pass


class PadHandler(BaseHandler):
	def get(self, start_position=None):
		self.render("player.html", start_position=start_position)


class CSSModule(tornado.web.UIModule):
  def render(self, urls):
    return self.render_string("ui-modules/css-module.html",
      urls=urls)

class JSModule(tornado.web.UIModule):
  def render(self, urls):
    return self.render_string("ui-modules/js-module.html",
      urls=urls)

def main():
    tornado.options.parse_command_line()
    if options.config:
        tornado.options.parse_config_file(options.config)
    else:
        path = os.path.join(os.path.dirname(__file__), "settings.py")
        tornado.options.parse_config_file(path)
    TapPadApplication().listen(os.environ.get("PORT", options.port))
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()