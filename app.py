import tornado.web
from tornado.options import define, options
import os
import re
from tornado.escape import json_decode

define("config")
define("debug", default=False)
define("cookie_secret", default="music-hack-day")
define("port", default=8080, type=int)
define("creator", default="Dmitri Cherniak")
define("creator_homepage", default="http://blog.zmitri.com")
define("github_url", default="https://github.com/dmitric/tap-pad-web")


class TapPadApplication(tornado.web.Application):
  def __init__(self):
    base_dir = os.path.dirname(__file__)
    settings = {
      "cookie_secret": options.cookie_secret,
      "static_path": os.path.join(base_dir, "static"),
      "template_path": os.path.join(base_dir, "templates"),
      'xsrf_cookies': True,
      "debug": options.debug,
      "creator": options.creator,
      "creator_homepage": options.creator_homepage,
      "github_url": options.github_url,
      "ui_modules": {
        "CSSModule": CSSModule,
        "JSModule": JSModule
      },
    }
    tornado.web.Application.__init__(self, [
      tornado.web.url(r"/link", LinkGenerationHandler, name="link-gen"),
      tornado.web.url(r"/link-for-mobile", MobileLinkGenerationHandler, name="mobile-link-gen"),
      tornado.web.url(r"/grid/([^/]*)/?", MobileGridHandler, name="mobile-grid"),
      tornado.web.url(r"/([^/]*)", PadHandler, name="player"),
      tornado.web.url(r"/([^/]*)/?", PadHandler, name="slash-player")
    ], **settings)

class BaseHandler(tornado.web.RequestHandler):
  def render_string(self, template, **kwargs):
      kwargs.update({ "settings": self.settings })
      return tornado.web.RequestHandler.render_string(self, template, **kwargs)

  def parse_position(self, start_params):
    start_position = None
    start_params = re.sub(ur"\D", "", start_params)
    try:
      while len(start_params) > 2:
        if not start_position:
          start_position = []
        pos = [ char for char in start_params[0:3]]
        if pos[2] == "1":
          pos[2] = "0"
          pos.append("1")
        elif pos[2] == "2":
          pos[2] =  "1"
          pos.append("0")
        elif pos[2] == "3":
          pos[2] = "0"
          pos.append("0")
        else:
          pos[2] = "1"
          pos.append("1")
        start_position.append(pos)
        start_params = start_params[3:]
    except Exception as e:
      pass
    return start_position

  def generate_position_link(self, atoms):
    resulting_link = ""
    if len(atoms) == 0 : return ""
    try:
      for atom in atoms:
        gen = "%d%d" % (atom["x"], atom["y"])
        if atom["vertical"]:
          gen = "%s%d" % (gen, 0 if atom["direction"] > 0 else 1) 
        else:
          gen = "%s%d" % (gen, 2 if atom["direction"] > 0 else 3)
        resulting_link = "%s%s" % (resulting_link, gen)
    except Exception as e:
      pass
    return resulting_link

class PadHandler(BaseHandler):
  @tornado.web.removeslash
  def get(self, start_params=""):
    start_position = self.parse_position(start_params)
    self.render("player.html", start_position=start_position)

class LinkGenerationHandler(BaseHandler):
  @tornado.web.removeslash
  def post(self):
    self.finish({ "link": self.get_link("") })

  def get_link(self, default="/"):
    atoms = json_decode(self.get_argument("atoms", "[]"))
    link = self.generate_position_link(atoms)
    share_link = self.reverse_url("player", link) if link != "" else default
    return share_link

class MobileLinkGenerationHandler(LinkGenerationHandler):
  def check_xsrf_cookie(self):
    pass

class MobileGridHandler(BaseHandler):
  @tornado.web.removeslash
  def post(self, start_params=""):
    pos = self.parse_position(start_params)
    def create_atom_dict(array):
      return {
        "x": int(a[0]),
        "y": int(a[1]),
        "direction": int(a[2]),
        "vertical": int(a[3])
        }
    pos = [ create_atom_dict(a) for a in pos]
    self.finish({"atoms": pos })
  
  def check_xsrf_cookie(self):
    pass

class CSSModule(tornado.web.UIModule):
  def render(self, urls):
    return self.render_string("ui-modules/css-module.html",
      urls=urls)

class JSModule(tornado.web.UIModule):
  def render(self, urls):
    return self.render_string("ui-modules/js-module.html",
      urls=urls)

def parse_options():
  """
  Parse command line or options set in settings.py config file
  """
  if options.config:
    tornado.options.parse_config_file(options.config)
  else:
    path = os.path.join(os.path.dirname(__file__), "settings.py")
    tornado.options.parse_config_file(path)
  tornado.options.parse_command_line()

def main():
  print "Running Tap Pad"
  parse_options()
  TapPadApplication().listen(os.environ.get("PORT", options.port))
  tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
  main()
