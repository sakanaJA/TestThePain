var canvas, stage, exportRoot, robot, container, message, displayMessage;
var limbs = {};
var parts = [];
var sparks = [];
var robotSounds = [];
var bg;
var headshot = false;
var jawshot = false;
var index = 0;
var canTouch = true;

window.g = {};
g.getRange = function (max, min) {
	var scale = max-min;
	return Math.random()*scale + min;
}

function init() {
  container = document.getElementById("container");
	canvas = document.getElementById("canvas");
  
	images = images||{};
	ss = ss||{};

	displayMessage = document.getElementById("status");

	if (createjs.BrowserDetect.isIOS || createjs.BrowserDetect.isAndroid || createjs.BrowserDetect.isBlackberry || createjs.BrowserDetect.isWindowPhone) {
		displayMessage.style.opacity = "1";
		displayMessage.addEventListener("click", handleTouch, false);
	}
	else {
		handleTouch();
	}
}

function handleTouch() {
	displayMessage.removeEventListener("click", handleTouch, false);
	container.removeChild(displayMessage);

	loader = new createjs.LoadQueue(true);
	
	loader.addEventListener("fileload", handleFileLoad);
	loader.on("complete", handleComplete);
	loader.loadManifest([
    {src:"https://lab.gskinner.com/codepen/codevember/speed/_assets/art/ground.png", id:"ground"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/Robot_Shoot_atlas_.png", id:"Robot_Shoot_atlas_"}
	], true);

	loadSounds();
  
}

function loadSounds() {
  var manifest = [
  
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/sound1.mp3", id:"clang"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/sound3.mp3", id:"shot"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/mark.mp3", id:"mark"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/pain.mp3", id:"pain"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/fword.mp3", id:"fword"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/stop-that.mp3", id:"stopthat"},
		{src:"https://s3-us-west-2.amazonaws.com/s.cdpn.io/1524180/yikes.mp3", id:"yikes"}
  ]
  var lq = new createjs.LoadQueue(true);
  lq.installPlugin(createjs.Sound);
  lq.addEventListener("complete", handleSoundComplete);
  lq.loadManifest(manifest);
}

function handleSoundComplete() {
  robotSounds = ['mark','fword','pain', 'stopthat', 'yikes'];
}

function handleProgress(event) {
}

function handleBodyClick(event) {
  playGunShot();
  playRandomHitSound();

  showDamage('body');

  var l = sparksContainer.numChildren;
  for(var i=0;i<l;i++) {
    sparksContainer.getChildAt(i).stop();
  }
  l = robot.numChildren;
  for(var i=0;i<l;i++) {
    var clip = robot.getChildAt(i);
    var name = clip.name;
    if (limbs[name] == null) {
      limbs[name] = clip;
      parts.push(limbs[name]);
    }
  }
  setTimeout(function () {
    restart();
  }, 3000)
}

function playHitSound() {
  playGunShot();
  createjs.Sound.play(robotSounds[++index%robotSounds.length|0]);
}

function playRandomHitSound() {
  createjs.Sound.play(robotSounds[Math.random()*robotSounds.length|0]);
}

function playGunShot() {
  createjs.Sound.play("clang", {volume:0.3});
  createjs.Sound.play("shot", {volume:0.3});
}

function makeSparks(data) {
  var l = data.amount;
  var floor = window.innerHeight-groundImg.height+(-2+Math.random()*2);
  for(var i=0;i<l;i++) {
    var spark = new lib.Spark();
    var p = new SparkParticle(spark,
                              data.x, data.y,
                              {min:data.velXMin, max:data.velXMax},
                              {min:data.velYMin,max:data.velYMax}, floor
                             );
    sparks.push(p);
    sparksContainer.addChild(p);
  }
}

function handleReset(event) {
  restart()
}

function restart() {
  while(sparksContainer.numChildren > 0) {
    sparksContainer.removeChildAt(0);
  }

  sparks = [];
  parts = [];
  limbs = {};

  index = 0;

  createjs.Tween.removeAllTweens();

  var l = robot.numChildren;
  for(var i=0;i<l;i++) {
    var item = robot.getChildAt(i);
    createjs.Tween.get(item).to({x:item.startX, y:item.startY, rotation:0}, 1500).call(function () {
      item.reset();
    });

  }
}

function updateSparks(delta) {
  var l = sparks.length;
  for(var i=0;i<l;i++) {
    var clip = sparks[i];
    clip.update(delta);
  }
}

function panicRobot() {
  if (headshot == true || jawshot == true) { createjs.Tween.removeAllTweens(); return; }
  createjs.Tween.get(head, {override:true, loop:true}).to({x:head.x+(g.getRange(-10, 10))}, 100);
  createjs.Tween.get(head, {override:true, loop:true}).to({rotation:head.rotation+(g.getRange(-5,5))}, 100);
  createjs.Tween.get(jaw, {override:true, loop:true}).to({x:jaw.x+(g.getRange(-10, 10))}, 100);
  createjs.Tween.get(body, {override:true, loop:true}).to({rotation:body.rotation+(g.getRange(-2,2))}, 100);
}

function handleClick(event) {
  if (canTouch === false) { return; }
  var name = event.currentTarget.name;
  if (limbs[name] == null) {
    var clip = event.currentTarget;

    playHitSound();
    showDamage(name);

    limbs[name] = clip;
    parts.push(clip);
  }
}

function showDamage(name) {
  var clip = robot.getChildByName(name);
  var bounds = clip.getBounds();
  var pt = clip.localToGlobal(0, 0);

  switch(clip.name) {
    case 'body':
      makeSparks({ x:pt.x, y:pt.y+bounds.height/2, velXMin:-50, velXMax:150, velYMin:-125, velYMax:25, amount:2500 | 0 });
      break;
    case 'head':
      makeSparks({ x:pt.x, y:pt.y+bounds.height/2, velXMin:-50, velXMax:50, velYMin:-125, velYMax:125, amount:500 | 0 });
      headshot = true;
      panicRobot();
      break;
    case 'jaw':
      jawshot = true;
      makeSparks({x:pt.x, y:pt.y+bounds.height/2, velXMin:-20, velXMax:20, velYMin:15, velYMax:100, amount:50+Math.random()*500 | 0 });
      panicRobot();
      break;
    case 'rightLeg':
      panicRobot();
      makeSparks({x:pt.x, y:pt.y-bounds.height/2, velXMin:-5, velXMax:5, velYMin:-4, velYMax:4, amount:150+Math.random()*500 | 0 });
      break;
    case 'leftLeg':
      panicRobot();
      makeSparks({x:pt.x, y:pt.y-bounds.height/2, velXMin:-10, velXMax:10, velYMin:-4, velYMax:4, amount:150+Math.random()*500 | 0 });
      break;
    case 'leftArm':
      panicRobot();
      makeSparks({ x:pt.x, y:pt.y, velXMin:100, velXMax:15, velYMin:-10, velYMax:50, amount:500+Math.random()*1500 | 0 });
      break;
    case 'rightArm':
      panicRobot();
      makeSparks({x:pt.x, y:pt.y, velXMin:-100, velXMax:10, velYMin:-20, velYMax:50, amount:500+Math.random()*1500 | 0 });
  }
}

function handleFileLoad(evt) {
  if (evt.item.type == "image") { images[evt.item.id] = evt.result; }
}

function handleComplete(evt) {
  var queue = evt.target;
  var ssMetadata = lib.ssMetadata;
 
  for(i=0; i<ssMetadata.length; i++) {
    ss[ssMetadata[i].name] = new createjs.SpriteSheet( {"images": [queue.getResult(ssMetadata[i].name)], "frames": ssMetadata[i].frames} )
  }
  
  canvas.className = "showCanvas";
  stage = new createjs.StageGL(canvas);
  stage.setClearColor("#28ac9f");
  createjs.Touch.enable(stage);
  
  robot = getRobot();
  
  sparksContainer = new createjs.Container();
  sparks = [];
  
  sky = new createjs.Shape();
  sky.graphics.beginLinearGradientFill(["#b7e5f4", "#e0eef2"], [0, 1], 0, 20,0,120 ).dr(0, 0, canvas.width, canvas.height);
  
  sky.cache(0, 0, canvas.width, canvas.height);
  
  groundImg = loader.getResult("ground");
  ground = new createjs.Shape();
  console.log("1", groundImg)
  ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, window.innerWidth + groundImg.width, groundImg.height);
  console.log("2")
  ground.tileW = groundImg.width;
  ground.y =  window.innerHeight - groundImg.height*1.5;
  //By default swapping between Stage for StageGL will not allow for vector drawing operation such as BitmapFill, useless you cache your shape.
  ground.cache(0, 0, window.innerWidth + groundImg.width, groundImg.height);
  
  stage.addChild(sky, ground, robot, sparksContainer);

  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener("tick", tick);

  window.addEventListener("resize", handleResize);
  
  //domElement = new createjs.DOMElement(message);
 
  //createjs.Tween.get(domElement).wait(5000).to({alpha:0}, 1000).call(function () {
  //   message.style.opacity = 0;
  //   message.style.display = "none";
     canTouch = true;
  //});


  //stage.addChild(domElement);
  handleResize();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var l = sparksContainer.numChildren;
  for(var i=0;i<l;i++) {
    var spark = sparksContainer.getChildAt(i);
    spark.floor = window.innerHeight-groundImg.height+(-2+Math.random()*2);
    spark.stop();
  }
 
  robot.x= canvas.width>>1;
  robot.y= canvas.height>>1;
  
  //domElement.x =  -domElement.htmlElement.offsetWidth>>1//0// - domElement.htmlElement.offsetWidth >> 1;
  //domElement.y = -domElement.htmlElement.offsetHeight>>1//canvas.height * .05;
  
  sky.graphics.clear().beginLinearGradientFill(["#b7e5f4", "#e0eef2"], [0, 1], 0, 20,0,120 ).dr(0, 0, canvas.width, canvas.height);
  sky.cache(0, 0, canvas.width, canvas.height);
  
  ground.graphics.clear().beginBitmapFill(groundImg).drawRect(0, 0, canvas.width + groundImg.width, groundImg.height);
 
  ground.y = canvas.height - groundImg.height;
  ground.cache(0, 0, canvas.width + groundImg.width, groundImg.height);
  
  robot.y = ground.y - 315;

  stage.updateViewport(canvas.width, canvas.height);
}

function handleResize() {
  resize();
}

function getImageParticle(name, clip, callBack, startX, startY, floor) {
  var image = new ParticleImage(clip, startX, startY, floor);
  image.startX = startX;
  image.startY = startY;
  image.name = name;
  image.spin = g.getRange(-20, 20);
  image.on("click", callBack, this);
  return image;
}

function getRobot() {
  var robot = new createjs.Container();
  var clip = new lib.Head();
  var bounds = clip.getBounds();

  head = getImageParticle('head', clip, handleClick, 0, 0, null);

  jaw = getImageParticle('jaw', new lib.Jaw(), handleClick, 0, bounds.height>>1, null);

  bounds = jaw.getBounds();

  body = getImageParticle('body', new lib.Body(), handleBodyClick, 0, jaw.y + bounds.height + 35, null);

  bounds = body.getBounds();

  leftArm = getImageParticle('leftArm', new lib.LeftArm(), handleClick, bounds.width>>1, bounds.height, null);

  createjs.Tween.get(leftArm).wait(2000).call(function(tween) {
    this.clip.gotoAndPlay(2);
  });

  rightArm = getImageParticle('rightArm', new lib.RightArm(), handleClick, -bounds.width>>1, bounds.height, null);

  leftLeg = getImageParticle('leftLeg', new lib.LeftLeg(), handleClick, -bounds.width>>1, body.y + bounds.height, null);

  rightLeg = getImageParticle('rightLeg', new lib.RightLeg(), handleClick, bounds.width>>1, body.y + bounds.height, null);

  robot.addChild(leftArm, rightArm, leftLeg, rightLeg, body,head, jaw);

  return robot;
}

function tick(event) {
  updateSparks(event.delta/50);
  stage.update(event);
  var l = parts.length;
  for(var i=0;i<l;i++) {
    var clip = parts[i];
    clip.update(event.delta/30);
  }
}

init();