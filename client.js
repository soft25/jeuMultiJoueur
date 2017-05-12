var $ = require("jquery"); 
var socket = require('socket.io-client')(); 


var clientId = -1;
var ballsID = -1;
var sourisPosition = {};
var brushPositions = {};
var ballPositions =[];
var clients={};
var type="";
var type2="";
var point = 0;
var ballId = 0;
socket.emit('connection', {msg: "client"}); 

socket.on('hello', function(data) { 
 clientId = data.id;
 brushPositions[clientId]={x:data.x,y:data.y};
 type = data.type;
 console.log("client> connection reussi, id = "+clientId);		
});

socket.on('newconnection', function(data){
 brushPositions = data.brushPositions;
 clients = data.clients;
 type2 = data.type;
});

$(document).on("mousedown", function(event){
 socket.emit('mousedown',{x: brushPositions[clientId].x, y: brushPositions[clientId].y, id: clientId, xCurseur: event.clientX, yCurseur: event.clientY, ballID: ballId});
 ballId++;
});

$(document).on("keyup", function(event){
 socket.emit('keyupdown',{x: brushPositions[clientId].x, y: brushPositions[clientId].y, id: clientId,keycode: event.keyCode});
});

$(document).on("keydown", function(event){
 socket.emit('keyupdown',{x: brushPositions[clientId].x, y: brushPositions[clientId].y, id: clientId,keycode: event.keyCode});
});

socket.emit('disconnect');
//-----------------------------------------------------------------------------------------------------
var canvas = document.getElementById('main');
var context = canvas.getContext('2d');

var img = new Image();
img.src = '/mur_30.png';

var chat = new Image();
chat.src = "/chat.png";

var ball = new Image();
ball.src = "/magic_ball.png";

context.drawImage(chat,100,300);
//-----------------------------------------------------------------------------------------------------
function dessiner_mur(){

	for(var i = 0; i < 800; i += 30){
		for(var j = 0; j < $("#main").height(); j += 30){
			if(j==0 || j>= $("#main").height()-30){
				context.drawImage(img,i,j);				
			}else{
				context.drawImage(img,0,j);	
				context.drawImage(img,780,j);	
			}
		}	
	}//end for i
	context.drawImage(img,120,30);
	context.drawImage(img,120,60);
	context.drawImage(img,240,270);	
	context.drawImage(img,240,300);	
}
//--------------------------------------------------------------------------------------
function frameUpdate(){	
	
	if(type=="uBrushP" || type=="initialisation" ){	
		context.clearRect(0,0,canvas.width,canvas.height);
		context.fillStyle = "DodgerBlue";
		context.fillRect(0, 0, 1000, 600);
		dessiner_mur();
				
		for(var i in brushPositions){		
			context.drawImage(chat,brushPositions[i].x, brushPositions[i].y);	
			context.font = '10pt Calibri';
		        context.fillStyle = 'black';
			context.fillText("joueur: "+i, brushPositions[i].x-10, brushPositions[i].y+40);	
		}

		if(type2 == "newclient"){
			var y = 40;
	 
			for(var i in clients){
				var id = clients[i].clientId;
				var nbrpoints = clients[i].nbrPoints;
				context.font = '13pt Calibri';
				if(id==clientId){
					context.fillStyle = 'red';
				}else{
					context.fillStyle = 'white';
				}			
				context.fillText("le joueur '"+id+"' a : "+nbrpoints+" points",820,y);	
				y = y+20;	
			}
	        }
	}else if(type=="uBallP") {
	
		context.clearRect(0,0,canvas.width,canvas.height);
		context.fillStyle = "DodgerBlue";
		context.fillRect(0, 0, 1000, 600);
		dessiner_mur();

		for(var i in brushPositions){	
			context.drawImage(chat,brushPositions[i].x, brushPositions[i].y);
			context.font = '10pt Calibri';
		        context.fillStyle = 'black';
			context.fillText("joueur: "+i, brushPositions[i].x-10, brushPositions[i].y+40);
		}
		if(type2 == "newclient"){
			var y = 40;
	 
			for(var i in clients){
				var id = clients[i].clientId;
				var nbrpoints = clients[i].nbrPoints;
				context.font = '13pt Calibri';
				if(id==clientId){
					context.fillStyle = 'red';
				}else{
					context.fillStyle = 'white';
				}	
				context.fillText("le joueur '"+id+"' a : "+nbrpoints+" points",820,y);	
				y = y+20;			
			}
	        }		
		for(var i in ballPositions){
			for(var j in ballPositions[i]){
				context.drawImage(ball,ballPositions[i][j].x, ballPositions[i][j].y);
			}
		}
	}
	window.requestAnimationFrame(frameUpdate);
}
frameUpdate();
//-----------------------------------------------------------------------------------------------------
socket.on('updatePosition', function(data) { 
	brushPositions = data.brushPositions;
	type = data.type;
});
//-----------------------------------------------------------------------------------------------------
socket.on('updateballPosition', function(data) { 
	ballPositions = data.ballPositions;
	type = data.type;
	clients = data.clients;
});
//-----------------------------------------------------------------------------------------------------
socket.on('updatePoints', function(data) { 
	brushPositions = data.brushPositions;	
	ballPositions = data.ballPositions;
	type = data.type;
	clients = data.clients;
});
