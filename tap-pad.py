import tornado.web
from tornado.options import define, options
import os
import re

define("config")
define("debug", default=False)
define("cookie_secret", default="music-hack-day")
define("port", default=8080, type=int)
define("creator", default="Dmitri Cherniak")
define("creator_homepage", default="http://blog.zmitri.com")


class TapPadApplication(tornado.web.Application):
    def __init__(self):
        base_dir = os.path.dirname(__file__)
        settings = {
            "cookie_secret": options.cookie_secret,
            "static_path": os.path.join(base_dir, "static"),
            "template_path": os.path.join(base_dir, "templates"),
            "debug": options.debug,
            "creator": options.creator,
            "creator_homepage": options.creator_homepage,
            "ui_modules": {
            	"CSSModule": CSSModule,
            	"JSModule": JSModule
            },
        }
        tornado.web.Application.__init__(self, [
            tornado.web.url(r"/([^/]*)/?", PadHandler, name="player"),
        ], **settings)

class BaseHandler(tornado.web.RequestHandler):
  def render_string(self, template, **kwargs):
      kwargs.update({ "settings": self.settings })
      return tornado.web.RequestHandler.render_string(self, template, **kwargs)

  def parse_position(self, start_params):
    start_position = None
    start_params = re.sub(ur"\D", "", start_params.lower())
    try:
      while len(start_params) > 2:
        if not start_position:
          start_position = []
        pos = [ char for char in start_params[0:3]]
        if pos[2] == "0":
          pos[2] = "1"
          pos.append("1")
        elif pos[2] == "1":
          pos[2] = "0"
          pos.append("1")
        elif pos[2] == "2":
          pos[2] =  "1"
          pos.append("0")
        elif pos[2] == "3":
          pos[2] = "0"
          pos.append("0")
        start_params = start_params[3:]
        start_position.append(pos)
    except Exception as e:
      pass
    return start_position


class PadHandler(BaseHandler):
  def get(self, start_params=""):
    start_position = None
    start_params = start_params.lower()
    if start_params == "drake":
      print "YUPP"
    else:
      start_position = self.parse_position(start_params)
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