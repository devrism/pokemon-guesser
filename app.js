//this is the server code
const app = require('express');
const socket = require('socket.io');
const randomstring = require('randomstring');

const express = app();

const server = express.listen(process.env.PORT || 4000, () => {
    console.log(`Server started at ${server.address().address} on port ${server.address().port}`);
})

express.use(app.static('public'));

const io = socket(server);
const MAX_ROOMS = 15; //TODO this is broken
const MAX_PLAYERS = 3; //TODO this is broken
//ALL player info
var roomList = {};
var drawnImageList = {}; //the superior pattern over the way roomList is implemented
//GAME VARIABLES
var description = "";

/*All event listeners/emitters go inside the io.on block as shown below. 
connection is the default event listener provided by Socket.io 
and a connection event is emitted under the hood every time a connection is established.
*/
io.on("connection", (socket) => {
    console.log("connection established");

    //Create Game Listener
    /* creates a new Room with a random Room ID and adds the client to that room. 
    Later, the server emits an event newGame that contains the roomID for the created room.
    */
    socket.on("createGame", (data) => {
        const roomID = randomstring.generate({ length: 4 });
        socket.join(roomID);
        roomList[roomID] = {};
        roomList[roomID]['players'] = [data.name];
        drawnImageList[roomID] = {};
        socket.emit("newGame", { roomID: roomID });

        console.log(data.name + " created a game");
        console.log(roomList);
        console.log(roomList[roomID]);
        console.log(roomList[roomID]['players']);
    })

    socket.on("choosePokemon", (data) => {
        let chosenPokemon = data.chosenPokemon;
        roomList[data.roomID]['pokemon'] = chosenPokemon;
        console.log(data.name + " chose the Pokemon: " + chosenPokemon);
        console.log(roomList);
    })

    //Join Game Listener
    socket.on("joinGame", (data) => {
        let room = roomList[data.roomID]; 
        if(room != undefined) {
            if (room['players'].length < MAX_PLAYERS && Object.keys(roomList).length < MAX_ROOMS) {
                const playerCount = room['players'].push(data.name);
                socket.join(data.roomID);
                io.sockets.to(data.roomID).emit("joinGameSuccess");
    
                console.log(data.name + " joined a game with " + roomList[data.roomID])
                console.log("Player count: " + playerCount);
                console.log(roomList);
            } else {
                socket.emit("joinGameFailure", { message: "Error: room full" });
            }
        } else {
            //console.log(room.length + " /// " + JSON.stringify(roomList) + " /// " + Object.keys(roomList).length + " //// " + Object.keys(roomList));
            socket.emit("joinGameFailure", { message: "Error: room does not exist" });
        } 
    })

    socket.on("addDescription", (data) => {
        description = data.pokemonDescription;
        console.log(data.name + " writes: " + description);

        io.sockets.to(data.id).emit("updateDescription", { 
            pokemonDescription: description,
            name: data.name
        }); 
    })

    socket.on("finishDrawing", (data) => {
        //put all drawings into list to display later
        drawnImageList[data.id][data.name] = data.drawing;
        console.log("image list: " + JSON.stringify(drawnImageList));
        console.dir(drawnImageList[data.id]);
        console.log('////////////////////////');
        console.dir(JSON.stringify(drawnImageList[data.id][data.name]));
        //TODO check if all players have finished drawing. if so, show all drawings
        // if (number of items in drawnImageList[data.roomID] == items in roomList[data.roomID].length - 1) {
            io.sockets.to(data.id).emit("endOfGame", { 
                image: drawnImageList[data.id][data.name]
            });
        //}
    })

    socket.on("logToServer", (data) => {
        console.log("Message from client (DEBUG): " + data.message);
        console.log(data.key);
    });

})

