fs     = require 'fs'
path   = require 'path'
{exec} = require 'child_process'

appFiles  = [
  'player'
]

task 'build', 'Build single application file from source files', ->
  appContents = new Array remaining = appFiles.length
  for file, index in appFiles then do (file, index) ->
    fs.readFile "coffee/src/#{file}.coffee", 'utf8', (err, fileContents) ->
      throw err if err
      appContents[index] = fileContents
      process() if --remaining is 0
  process = ->
    if !path.existsSync('coffee/lib') then fs.mkdirSync('coffee/lib', 511)
    fs.writeFile 'coffee/lib/application.coffee', appContents.join('\n\n'), 'utf8', (err) ->
      throw err if err
      exec 'coffee --compile -b coffee/lib/application.coffee', (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
        fs.unlink 'coffee/lib/application.coffee', (err) ->
          throw err if err
          console.log 'Done.'

task 'push', 'Move application*.js files to static folder', ->
  exec 'cp coffee/lib/application*.js static/js', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
    console.log "Pushed to static/js"

task 'minify', 'Minify the resulting application file after build', ->
  exec 'uglifyjs coffee/lib/application.js > coffee/lib/application.min.js', (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
