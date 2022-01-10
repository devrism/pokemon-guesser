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
const MAX_ROOMS = 15;
const MAX_PLAYERS = 12;
//ALL player info
var roomList = {};
var drawnImageList = {}; //the superior pattern over the way roomList is implemented

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
        roomList[roomID]['guesses'] = [];
        drawnImageList[roomID] = {};
        socket.emit("newGame", { roomID: roomID });

        console.log(data.name + " created a game");
        console.log(roomList);
        console.log(roomList[roomID]);
        console.log(roomList[roomID]['players']);
    })

    socket.on("submitGuess", (data) => {
        let guess = data.guess;
        let roomID = data.roomID;
        roomList[roomID]['guesses'].push(data.name + " guessed: " + guess);
        console.log(roomList[roomID]['guesses']);

        if(endOfGame(roomID)) {
            endTheGame(roomID);
        }
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
        let description = data.pokemonDescription;
        console.log(data.name + " writes: " + description);

        io.sockets.to(data.id).emit("updateDescription", { 
            pokemonDescription: description,
            name: data.name
        }); 
    })

    socket.on("finishDrawing", (data) => {
        //put all drawings into list to display later
        roomID = data.id;
        artist = data.name;
        drawnImageList[roomID][artist] = data.drawing;
        //console.log("image list: " + JSON.stringify(drawnImageList));
        // console.dir(drawnImageList[roomID]);
        // console.log('////////////////////////');
        // console.dir(JSON.stringify(drawnImageList[roomID][artist]));
        // console.dir(JSON.stringify(drawnImageList[roomID]));
        // console.log(roomList[roomID]['guesses'].length);
        // console.log(roomList[roomID]['players'].length);

        if(endOfGame(roomID)) {
            endTheGame(roomID);
        }
    })

    socket.on("logToServer", (data) => {
        console.log("Message from client (DEBUG): " + data.message);
        console.log(data.key);
    });

})

//check if all players have submitted their guesses and drawings
function endOfGame(roomID) {
    if(Object.keys(drawnImageList[roomID]).length == roomList[roomID]['players'].length - 1 &&
        roomList[roomID]['guesses'].length == roomList[roomID]['players'].length - 1) {
            return true;
        }
    return false;
}

//signals end of game
function endTheGame(roomID) {
    io.sockets.to(roomID).emit("endOfGame", { 
        image: drawnImageList[roomID][artist],
        guesses: roomList[roomID]['guesses']
    });
}