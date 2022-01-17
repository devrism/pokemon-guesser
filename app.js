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
const MAX_ROOMS = 13;
const MAX_PLAYERS = 12;

/* roomList is a JS object with this pattern:
{
    OJeD: { //roomID
        players: [ 'dev', 'p2' ], //first player in list is always host name
        hasGameStarted: true, //defaults false. if true, do not allow new players to join lobby
        guesses: [ 'p2 guessed: Swablu' ], //player guesses
        pokemon: 'Pikachu' //chosen by host
    }
}
*/
var roomList = {};
/* drawnImageList is an object with this pattern: 
{
    "3nC6":{ //roomID
        "p2":'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAH0CAYAAADFQEl4AAAgAElEQVR4...' //player name and image they drew
    }
}
*/
var drawnImageList = {}; //the superior pattern over the way roomList is implemented

io.on("connection", (socket) => {
    console.log("connection established");
    /* creates a new Room with a random Room ID and adds the client to that room. */
    socket.on("createGame", (data) => {
        if(Object.keys(roomList).length < MAX_ROOMS) {
            const roomID = randomstring.generate({ length: 4 });
            socket.join(roomID);
            roomList[roomID] = {};
            roomList[roomID]['players'] = [data.name.replace(/\W/g, '')];
            roomList[roomID]['hasGameStarted'] = false;
            roomList[roomID]['guesses'] = [];
            drawnImageList[roomID] = {};
            socket.emit("newGame", { roomID: roomID });

            console.log(data.name + " created a game");
            console.log(roomList);
            console.log(roomList[roomID]);
            console.log(roomList[roomID]['players']);
        } else {
            socket.emit("changeMessageDisplay", { message: "Error: maximum room limit reached" });
            //TODO when host leaves lobby, remove room from list and kill connection?
        }
    })

    //Join Game Listener
    socket.on("joinGame", (data) => {
        let roomID = data.roomID;
        let room = roomList[roomID]; 
        if(room != undefined) {
            if (roomList[roomID]['hasGameStarted'] == false &&
            room['players'].length < MAX_PLAYERS &&
            Object.keys(roomList).length <= MAX_ROOMS) {

                const playerCount = room['players'].push(data.name.replace(/\W/g, '')); //push method returns the new length
                socket.join(roomID);

                io.sockets.to(roomID).emit("joinGameSuccess", {
                    currentPlayers: room['players'],
                    numberOfCurrentPlayers: room['players'].length,
                    maxPlayerLimit: MAX_PLAYERS,
                    roomID: roomID
                });
    
                console.log(data.name + " joined a game with " + JSON.stringify(roomList[roomID]))
                console.log("Player count: " + playerCount);
                console.log(roomList);

            } else {
                socket.emit("changeMessageDisplay", { 
                    message: "Error: room full" 
                });
            }
        } else {
            //console.log(room.length + " /// " + JSON.stringify(roomList) + " /// " + Object.keys(roomList).length + " //// " + Object.keys(roomList));
            socket.emit("changeMessageDisplay", { 
                message: "Error: room does not exist" 
            });
        } 
    })

    ////////////////////////////////////////////// Host controls ////////////////////////////////////////////
    socket.on("choosePokemon", (data) => {
        let chosenPokemon = data.chosenPokemon;
        roomList[data.roomID]['pokemon'] = chosenPokemon;
        console.log(data.name + " chose the Pokemon: " + chosenPokemon);
        console.log(roomList);
    })
    socket.on("addDescription", (data) => {
        let roomID = data.roomID;
        let description = data.pokemonDescription;
        let name = data.name;
        console.log(data.name + " writes: " + description);

        io.sockets.to(roomID).emit("updateDescription", { 
            pokemonDescription: description,
            name: name
        }); 
    })
    // prevent more players from joining if the game has started
    socket.on("startGame", (data) => {
        let roomID = data.roomID;
        roomList[roomID]['hasGameStarted'] = true;
        io.sockets.to(roomID).emit("startGame", {}); 
    })

    socket.on("revealPokemonToPlayers", (data) => {
        let roomID = data.roomID;
        io.sockets.to(roomID).emit("revealPokemonToPlayers", { 
            chosenPokemon: roomList[roomID]['pokemon']
        }); 
    })

    ////////////////////////////////////////////// Player controls ////////////////////////////////////////////
    socket.on("submitGuess", (data) => {
        let guess = data.guess.replace(/\W/g, '');
        let roomID = data.roomID;
        roomList[roomID]['guesses'].push(data.name + " guessed: " + guess);
        console.log(roomList[roomID]['guesses']);
        console.log(roomList[roomID]['pokemon']);
        if(guess.toUpperCase() === roomList[roomID]['pokemon'].replace(/\W/g, '').toUpperCase()) {
            //socket.emit will only show this to the player who triggered it.
            //using io.sockets.to(roomID) will send the message to all players in the room.
            socket.emit("changeMessageDisplay", {
                message: "Congratulations! You guessed the right Pokemon!" 
            })
        } else {
            socket.emit("changeMessageDisplay", {
                message: "You did not guess correctly." 
            })
        }
        if(endOfGame(roomID)) {
            endTheGame(roomID);
        }
    })

    socket.on("finishDrawing", (data) => {
        //put all drawings into list to display later
        roomID = data.roomID;
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

    ////////////////////////////////////////////// Helper Functions  ////////////////////////////////////////////
    //TODO comment out when done developing
    socket.on("logToServer", (data) => {
        console.log("Message from client (DEBUG): " + data.message);
        console.log(data.key);
    });

})

//check if all players have submitted their guesses and drawings
//returns true or false 
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
        guesses: roomList[roomID]['guesses'],
        chosenPokemon: roomList[roomID]['pokemon']
    });
}