var express = require('express'); 
var app = express(); 
app.use(express.static('public')); 

app.set('port',(process.env.PORT || 5000));

var server = require('http').Server(app); 
var io = require('socket.io')(server); 


var clientsID = 0;
var brushPositions = {};
var map = [];
var ballPositions = [];
var clients={};

var a_supprimer = -1;
var client_concerner = -1;
//------------------------------------------------------------------------------
// boucle pour remplir le tableau map avec positions des obstacles
for(var i=0; i<600 ; i+=30){
	map.push({x:0, y:i, width:30, height:30});
}
for(var i=30; i<810-30 ; i+=30){
	map.push({x:i, y:0, width:30, height:30});
}
for(var i=0; i<600 ; i+=30){
	map.push({x:810-30, y:i, width:30, height:30});
} 
for(var i=30; i<810-30 ; i+=30){
	map.push({x:i, y:600-30, width:30, height:30});
}
map.push({x:120, y:30, width:30, height:30});
map.push({x:120, y:60, width:30, height:30});
map.push({x:240, y:270, width:30, height:30});
map.push({x:240, y:300, width:30, height:30});

//-----------------------------------------------------------------------------
// méthode pour gérer tout type de collision
function collide(obj1, obj2){
	return obj1.x + obj1.width > obj2.x && 
	obj2.x + obj2.width > obj1.x && 
	obj1.y + obj1.height > obj2.y &&
	obj2.y + obj2.height > obj1.y;
}

//----------------------------------------------------------------------------
// méthode pour calculer le vecteur élémentaire qui sert à déterminer la direction de la balle 
function tracerBall(data){
	var pX = data.x;
	var pY = data.y;
	var cX = data.xCurseur;
	var cY = data.yCurseur;
	
	var x = cX-pX;
	var y = cY-pY;
	var l = Math.sqrt(Math.pow(x, 2)+Math.pow(y, 2));
	var rX = x/l;
	var rY = y/l;

	return [rX, rY];

}

//----------------------------------------------------------------------------
io.on('connection', function (socket) { 
	console.log("serveur> Client "+clientsID+" s'est connecte");
	var clientId = clientsID;
	var nbrpoints = 0;
	var collision = true;
	// génération d'une position aléatoire du joueur qui vient de ce connecter 
	while(collision){ // tester si la position générer n'est pas en collision avec les obstacles
		var xAlea = Math.random() * (770 - 30) + 30;
		var yAlea = Math.random() * (570 - 30) + 30;
		var teste_position = {x: xAlea, y: yAlea, width: 32, height: 32};
		for(var i in map){	
			collision = collide(teste_position,map[i]);
			if(collision){
				break;						   
			}
		}	
	}
	clients[clientId] = {clientId: clientId, nbrPoints:nbrpoints}; 
	brushPositions[clientId] = {x: xAlea, y: yAlea};

	// envoyer au client ça position et son ID
	socket.emit('hello', {id: clientsID, x:brushPositions[clientId].x, y:brushPositions[clientId].y, type:"initialisation"});
	io.emit('newconnection',{clients: clients, brushPositions: brushPositions, type:"newclient"});
	clientsID++; 

  	//-------------------------------------------------
	//lorsqu'un joueur click pour tirer 
	socket.on('mousedown', function (data) { 	
			
		var bX = 0; 
		var bY = 0;
		var vitesse = 2;
		var coll1 = false;
		var coll2 = false;
		var coll3 = false;
		var ballId = data.ballID;
		//calcul du vecteur elementaire
		var vectElem = tracerBall(data);
		//gainloop pour dessiner la ball
		var myvar = setInterval(function(){
			bX =  data.x+vectElem[0]*vitesse;
			bY = data.y+vectElem[1]*vitesse;
			vitesse = vitesse+5;
				
			if(client_concerner == clientId ){
				a_supprimer = -1;
				client_concerner = -1;
				ballPositions[clientId][a_supprimer];
				clearInterval(myvar);
			}
			else{
				//remplir le dictionnaire (ballPositions) qui contiendra toutes les balles
				if(data.ballID == 0){
					ballPositions[clientId] = [];
					ballPositions[clientId].push({ballID: data.ballID, x: bX, y: bY, width: 16, height: 16});
				}else{
					var isFind = false;
					for(var i in ballPositions[clientId]){	
						if(ballPositions[clientId][i].ballID == data.ballID){
							isFind = true;
							break;
						}
					}
					if(isFind){
						ballPositions[clientId][i] = {ballID: data.ballID, x: bX, y: bY, width: 16, height: 16};
					}
					else {
						ballPositions[clientId].push({ballID: data.ballID, x: bX, y: bY, width: 16, height: 16});
					}
				}
				//gérer collision ball_joueur
				for(var i in brushPositions){	
					if(i != clientId){
						var isCollision = false;
					
						for(var collisionBall = 0; collisionBall < ballPositions[clientId].length; collisionBall++){
							coll1 = collide(ballPositions[clientId][collisionBall],brushPositions[i]);
						
							if(coll1){
								isCollision = true;
								ballPositions[clientId].splice(collisionBall, 1);
								break;
							}
						}
					
						if(isCollision){
							break;
						}
					}	
				}
				//gérer collision ball_obstacle
				for(var i in map){
					var isCollision = false;
				
					for(var collisionBall = 0; collisionBall < ballPositions[clientId].length; collisionBall++){ 
						coll2 = collide(ballPositions[clientId][collisionBall],map[i]);
						
						if(coll2){
							isCollision = true;
							ballPositions[clientId].splice(collisionBall, 1);
							break;
						}
					}
					
					if(isCollision){
						break;
					}
				}
				//gérer collision ball_ball
				for(var i = 0; i < ballPositions.length; i++){
					if(i!=clientId){
						for(var j in ballPositions[clientId]){
							for(var k in ballPositions[i]){
								coll3 = collide(ballPositions[clientId][j],ballPositions[i][k]);
								if(coll3){
									ballPositions[clientId].splice(j, 1);	
									ballPositions[i].splice(k,1);
									client_concerner = i;
									a_supprimer = k;
									break;
								}
							}				
						}
					}
				}

				if(!coll1 && !coll2 & !coll3){ // si pas de collision
					io.emit('updateballPosition', {ballPositions: ballPositions,type:"uBallP",clients:clients});
				}else if(coll1 || coll2 || coll3){ // si y a une des collisions
					if(coll1){
						nbrpoints = nbrpoints+1;
					}
					clients[clientId]={clientId: clientId, nbrPoints:nbrpoints};
					io.emit('updateballPosition', {ballPositions: ballPositions,type:"uBallP", clients: clients});	
					clearInterval(myvar);
				}
			}		
		},15);
	});     

        //-----------------------------------------    
	//lorsqu'un joueur tape une touche 
	socket.on('keyupdown', function (data) { 
  
	var coll1 = false;
	var coll2 = false;
	var id = data.id;
	//à gauche
	if(data.keycode==37){
		brushPositions[id] = {x: data.x-10, y:data.y, width: 30, height: 30};
		// collision joueur_joueur
		for(var i in brushPositions){	
			if(i != id){
				coll2 = collide(brushPositions[id],brushPositions[i]);
				if(coll2){
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;
				}
			}	
		}
		if(!coll2){
			// collision joueur_obstacle
			for(var i in map){
				coll1 = collide(brushPositions[id],map[i]);
				if(!coll1){
					brushPositions[id] = {x: data.x-10, y:data.y, width: 30, height: 30};			   
				}else{
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;			
				}
			}
		}
	}
	//en haut
	if(data.keycode==38){
		brushPositions[data.id] = {x: data.x, y:data.y-10, width: 30, height: 30};
		// collision joueur_joueur
		for(var i in brushPositions){	
			if(i != id){
				coll2 = collide(brushPositions[id],brushPositions[i]);
				if(coll2){
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;
				}
			}	
		}	
		if(!coll2){
			// collision joueur_obstacle
			for(var i in map){
				coll1 = collide(brushPositions[id],map[i]);
				if(!coll1){
					brushPositions[data.id] = {x: data.x, y:data.y-10, width: 30, height: 30};		   
				}else{
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;			
				}
			}
		}
	}
	//à droite
	if(data.keycode==39){
		brushPositions[data.id] = {x: data.x+10, y:data.y, width: 30, height: 30};	
		// collision joueur_joueur
		for(var i in brushPositions){	
			if(i != id){
				coll2 = collide(brushPositions[id],brushPositions[i]);
				if(coll2){
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;
				}
			}	
		}	
		if(!coll2){
			// collision joueur_obstacle
			for(var i in map){
				coll1 = collide(brushPositions[id],map[i]);
				if(!coll1){
					brushPositions[data.id] = {x: data.x+10, y:data.y, width: 30, height: 30};		   
				}else{
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;			
				}
			}
		}
	}
	//en bas
	if(data.keycode==40){
		brushPositions[data.id] = {x: data.x, y:data.y+10, width: 30, height: 30};
		// collision joueur_joueur	
		for(var i in brushPositions){	
			if(i != id){
				coll2 = collide(brushPositions[id],brushPositions[i]);
				if(coll2){
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;
				}
			}	
		}	
		if(!coll2){
			// collision joueur_obstacle
			for(var i in map){
				coll1 = collide(brushPositions[id],map[i]);
				if(!coll1){
					brushPositions[data.id] = {x: data.x, y:data.y+10, width: 30, height: 30};					   
				}else{
					brushPositions[id] = {x: data.x, y:data.y, width: 30, height: 30};
					break;			
				}
			}
		}
	}
	// envoi a tout les joueurs les nouvelles positions des joueurs 
	io.emit('updatePosition', {brushPositions: brushPositions,type:"uBrushP"});
 	}); 
	//--------------------------------
	// deconnexion d'un joueur : on vide sa positions dans le dictionnaire des joueurs (brushPositions) et 
	socket.on('disconnect', function(){
    		socket.disconnect();
		brushPositions[clientId] = {};
		delete clients[clientId];
		io.emit('updatePoints', {brushPositions: brushPositions,clients: clients,type:"uBrushP"});		
	});
}); 

server.listen(app.get('port'), function() {
	console.log("Node app running on port",app.get('port'));
}); 
