#method to get xrsf cookie for posting via ajax
getCookie = (name) ->
  r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
  if r then r[1]

#jquery wrapper to post json with xsrf
$.postJson = (url, args, callback) ->
  args._xsrf = getCookie "_xsrf"
  $.ajax
    url: url,
    data: $.param(args),
    dataType: "text",
    type: "POST",
    success: (response) ->
      callback(eval "("+response+")")


#simple id generator for our atoms
class IdGenerator
  instance = null
  class PrivateClass
    constructor: () ->
    	@seed = 0
    next: () -> 
    	@seed++
  @next: () ->
    instance ?= new PrivateClass()
    instance.next()


#deals with all the audio playin'
class AudioSource
	constructor: (maxChannels) ->
		@maxChannels = maxChannels
		@audioChannels = []
		for i in [0..@maxChannels-1]
			@audioChannels[i] = 
				channel: new Audio()
				finished: -1
	#play a sound based on audio dom id
	play: (audio) ->
		for channel in @audioChannels
			thisTime = new Date
			if channel['finished'] < thisTime.getTime()
				channel['finished'] = thisTime.getTime() + document.getElementById(audio).duration*1000
				channel['channel'].src = document.getElementById(audio).src;
				channel['channel'].load();
				channel['channel'].play();
				break;

class Atom
	constructor: (@x, @y) ->
		@direction = 1
		@vertical = true
		@id = IdGenerator.next()
		@moves = 0
		@collisions = 0
	
	changeDirection: () ->
		@direction *= -1
		@collisions++

	collide: () ->
		@vertical = !@vertical
		@collisions++

	move: () ->
		if @vertical
			@y += @direction
		else
			@x += @direction
		@moves++

	nextX: () ->
		nX = @x
		if not @vertical
			nX += @direction
		nX

	nextY: () ->
		nY = @y
		if @vertical
			nY += @direction
		nY
	
	to_dict:() -> {
			x: @x ,
			y: @y,
			vertical: @vertical,
			direction: @direction 
		}

	stringify: () ->
		JSON.stringify @to_dict() 

class TapPad
	constructor: (xMax, yMax) ->
		@xMax = xMax-1
		@yMax = yMax-1
		@atoms = []
		@paused = true
		@speed = 100
		@grid = []
		@collisonsLimit = 100 #kill off older atoms
		@movesLimit = 300
		@player = new AudioSource 30

		for i in [0..@yMax]
			@grid[i] = []
			for j in [0..@xMax]
				@grid[i][j] = null

	addAtom: (x, y) ->
		@addAtomWithDirections x, y, 1, 1

	addAtomWithDirections: (x, y, direction, vertical) ->
		if not @isValidMove x, y
			console.log "Did not add, out of bounds"
		else
			atom = new Atom x,y
			atom.direction = if direction == 1 then 1 else -1
			atom.vertical = if vertical == 1 then true else false
			@atoms.push atom
			if @grid[y][x] == null
				@grid[y][x] = {}
			@grid[y][x]["#{ atom.id }"] = atom
			@renderAtXandY x,y


	toggle:() ->
		@paused = !@paused 
	
	play: () ->
		@paused = false
	
	pause: () -> 
		@paused = true

	isValidMove: (x,y) ->
		! (x > @xMax or x < 0 or y > @yMax or y < 0)
	
	moveAtom: (atom) ->
		curX = atom.x
		curY = atom.y
		nextX = atom.nextX()
		nextY = atom.nextY()

		#if we are going to hit a wall, change direction and play sound
		if not @isValidMove nextX, nextY
			atom.changeDirection()
			if atom.vertical
				@player.play "audio#{curX}"
			else
				@player.play "audio#{curY}"

		#remove the old position in the 3d mapping
		delete @grid[curY][curX]["#{atom.id}"]
		
		#move the atom and save it's position in the grid
		atom.move()

		curX = atom.x
		curY = atom.y
		if @grid[curY][curX] == null
			@grid[curY][curX] = {}
		@grid[curY][curX]["#{atom.id}"] = atom

	manageHeadOnCollisions: (atom) ->
		curX = atom.x
		curY = atom.y
		nextX = atom.nextX()
		nextY = atom.nextY()
		if @isValidMove nextX, nextY
			if @grid[nextY][nextX] != null and Object.size(@grid[nextY][nextX]) >= 1
				for otherAtomId in @grid[nextY][nextX]
					otherAtom = @grid[nextY][nextX][otherAtomId]
					diffDirection = atom.direction != otherAtom.direction
					sameOrientation = atom.vertical == otherAtom.vertical
					if diffDirection and sameOrientation
						otherAtom.changeDirection()
				atom.changeDirection()

	manageIntersections: () ->
		for j in [0..@yMax]
			for i in [0..@xMax]
				sizeOfCell = Object.size(@grid[j][i])
				if sizeOfCell > 1
					for idKey, atom of @grid[j][i]
						atom.collide()
	
	renderAtXandY: (x,y) ->
		sizeOfCell = Object.size(@grid[y][x])
		$cell = $("#row#{y}col#{x}")
		if @grid[y][x] == null or sizeOfCell == 0
			#nothing here
			$cell.removeClass "collision"
			$cell.removeClass "single"
		else if sizeOfCell > 1
			$cell.removeClass "single"
			$cell.addClass "collision"
		else if sizeOfCell == 1
			#just one automaton
			$cell.removeClass "collision"
			$cell.addClass "single"

	purgeOldAtoms: () ->
		kill_off = (atom for atom in @atoms when \
			atom.collisions > @collisonsLimit \
			or atom.moves > @movesLimit)
		
		for atom in kill_off
			delete @grid[atom.y][atom.x]["#{atom.id}"]

		@atoms = (atom for atom in @atoms when \
			atom.collisions < @collisonsLimit \
			or atom.moves < @movesLimit)
	
	render: () ->
		for j in [0..@yMax]
			for i in [0..@xMax]
				@renderAtXandY i, j

	stringify: () ->
		JSON.stringify (atom.to_dict() for atom in @atoms)			

	step: () ->
		if !@paused and @atoms.length > 0

			#lets kill old atoms
			@purgeOldAtoms()
			#lets move ours atoms!
			for atom in @atoms
				@moveAtom atom
			
			if @atoms.length > 1
				#deal with head on collisions -> <- from move we just did
				for atom in @atoms
					@manageHeadOnCollisions atom
				
				#deal with the case when atoms landed on the same point -> x <-
				@manageIntersections()
			
			#render the colors
			@render()

	generateShareLink: (callback) ->
		print 
		$.postJson "/link", {"atoms": @stringify() }, callback

#create a new 8x8 tap pad and attach it to the window
window.tapPad = new TapPad 8,8			

$ ->	
	playToggle = () ->
		tapPad.toggle()
		if tapPad.paused
			$("#play-control").removeClass "pause"
			$("#play-control").addClass "play"
		else
			$("#play-control").removeClass "play"
			$("#play-control").addClass "pause"
		$("#play-control").show()

	$("#play-control").on "click", (e) ->
		#toggle the play state when we click the control
		playToggle()

	$(".player-button").on "click", (e) ->
		#if we click a player-button, add a new atom to the pad
		#at the position we clicked
		$("#play-control").show()
		if tapPad.atoms.length == 0
			tapPad.play()
		y = +$(this).data "row"
		x = +$(this).data "col"
		tapPad.addAtom x, y

	$("#generate-share-link").on "click", (e) ->
		tapPad.generateShareLink (result) ->
			$sl = $(".share-link")
			$sl.val window.location.host + result["link"]

	runLoop = () ->
		tapPad.step()

	$(window).on "keypress", (e) ->
		if e.keyCode == 32 or e.which == 32
			playToggle()

	setInterval runLoop, tapPad.speed








