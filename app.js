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

//ALL player info
let players = {};
//GAME VARIABLES
let choice1 = "", choice2 = "";
let chosenPokemon = "";
let description = "";

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
        players[roomID] = data.name;
        socket.emit("newGame", { roomID: roomID });

        console.log(data.name + " created a game")
    })

    socket.on("choosepokemon", (data) => {
        chosenPokemon = data.chosenPokemon;
        console.log(data.name + " chose the Pokemon: " + chosenPokemon);
    })

    socket.on("addDescription", (data) => {
        description = data.pokemonDescription;
        console.log(data.name + " writes: " + description);

        io.sockets.to(data.id).emit("updateDescription", { 
            pokemonDescription: description,
            name: data.name
        }); 
    })

    //Join Game Listener
    socket.on("joinGame", (data) => {
        socket.join(data.roomID);
        socket.to(data.roomID).emit("player2Joined", { p2name: data.name, p1name: players[data.roomID] });
        socket.emit("player1Joined", { p2name: players[data.roomID], p1name: data.name });

        console.log(data.name + " joined a game with " + players[data.roomID])
    })

    //Listener to Player 1's Choice
    /*The code below gets player1’s choice and does nothing if player2 hasn’t picked their choice yet.
    */
    socket.on("choice1", (data) => {
        choice1 = data.choice;
        if (choice2 != "") {
            console.log(data.name + " used " + choice1 + " against " + choice2);
            result(data.roomID);
        } else {
            console.log(data.name + " used " + choice1);
        }
    });

    //Listener to Player 2's Choice
    socket.on("choice2", (data) => {
        choice2 = data.choice;
        if (choice1 != "") {
            console.log(data.name + " used " + choice2 + " against " + choice1);
            result(data.roomID);
        } else {
            console.log(data.name + " used " + choice2);
        }
    });

    //Function to be executed after getting both choices
    const result = (roomID) => {
        var winner = getWinner(choice1, choice2);
        io.sockets.to(roomID).emit("result", {
            winner: winner
        });
        choice1 = "";
        choice2 = "";
    }

})

//Function to calculate winner
const getWinner = (p, c) => {
    if (p === c) {
        return "draw";
    } else if (p === "Rock") {
        if (c === "Paper") {
            return false;
        } else {
            return true;
        }
    } else if (p === "Paper") {
        if (c === "Scissor") {
            return false;
        } else {
            return true;
        }
    } else if (p === "Scissor") {
        if (c === "Rock") {
            return false;
        } else {
            return true;
        }
    }
}