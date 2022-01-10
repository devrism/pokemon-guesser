//this is the client file
const socket = io();
let firstPlayer = false;
let roomID;
let playerName;
let isHost;
let hostChoice = false;
let description;
let drawnImage;

/*Create Game Event Emitter
Once this event is triggered, the client grabs player1’s name and emits a socket event named createGame. 
The variable firstPlayer identifies the player who started the game.
This is used to identify the host */
$(".createBtn").click(function(){
    firstPlayer=true;
    playerName=$("input[name=p1name").val();
    socket.emit('createGame',{name:playerName});
    
})

//New Game Created Listener
socket.on("newGame",(data)=>{
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $("#message").html("Waiting for player 2, room ID is "+data.roomID).show();
    roomID=data.roomID;
    isHost = true;
})

//Join Game Event Emitter
$(".joinBtn").click(function(){
    playerName=$("input[name=p2name").val();
    roomID=$("input[name=roomID").val();
    socket.emit('joinGame',{
        name:playerName,
        roomID:roomID
    });
    isHost = false;
})

socket.on("failedToJoinGame", (data)=>{
    $("#message").html(data.message).show();
})

//Player 2 Joined
socket.on("player2Joined",(data)=>{
    transition(data);
})

//Player 1 Joined
socket.on("player1Joined",(data)=>{
    transition(data);
})

/*The code below calls the transition() function for both players. 
This transition() function takes care of all the UI changes to enter the game.
*/
const transition=(data)=>{
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $(".leaderboard").show();
    $(".player1 .name").html(data.p1name);
    $(".player2 .name").html(data.p2name);
    $("#message").html(data.p2name+" is here!").show();

    //my stuff!
    if(isHost) {
        $(".hostcontrols").show();
    } else {
        $(".playercontrols").show();
    }
    $("#history").show();
}

//Host chooses pokemon to describe
$(".choosePokemonButton").click(function (){
    hostChoice=$("input[name=choosepokemon]").val();
    socket.emit('choosepokemon', {
        chosenPokemon:hostChoice,
        name:playerName
    });
})
//Emitter for describing a pokemon from the host
$(".describeButton").click(function (){
    description=$("input[name=describepokemon]").val();
    socket.emit('addDescription', {
        chosenPokemon:hostChoice,
        pokemonDescription:description,
        name:playerName,
        id:roomID
    });
    $("#history").html(description).show();
})

//Result Event Listener
socket.on("result",(data)=>{
    if(data.winner=="draw"){
        $("#message").html("It's a draw!");
    }else{
        updateDOM(firstPlayer==data.winner?"player1":"player2");
    }
})

const updateDOM=(player)=>{
    const playerDOM=$("."+player+" span");
    const prevScore=parseInt(playerDOM.html().trim());
    playerDOM.html(prevScore+1);
    const winnerName=$("."+player+" .name").html().trim();
    $("#message").html(winnerName+" scored a point!");
}

//////// drawing canvas functions

var drawMode = $('drawMode');
const canvas = new fabric.Canvas("canvas");
canvas.isDrawingMode = true;
canvas.set('erasable', true);
canvas.freeDrawingBrush.color = '#000000';
canvas.freeDrawingBrush.width = 5;

$("#eraseMode").click(function() {
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.freeDrawingBrush.width = 5;
});

$(".drawMode").click(function() {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = 5;
    canvas.freeDrawingBrush.color = '#000000';
});

$(".finishdrawing").click(function() {
    //save canvas as image
    let drawnImageData = canvas.toDataURL('jpg');
    var img = document.createElement("img");
    img.src = drawnImageData;

    socket.emit('finishDrawing',{ //todo make server listener
        name:playerName,
        id:roomID,
        drawing:drawnImageData
    });
    //hide canvas after submitting drawing
    $("#canvas").hide();
});

// Update description event listener
socket.on("updateDescription",(data)=>{
    $("#history").html("Host writes: " + data.pokemonDescription);
})

socket.on("endOfGame", (data) => {
    let drawnImageData = data.image;
    logToServer(data.image, "client image list: ");

    var img = document.createElement("img");
    img.src = drawnImageData;

    //display image in html
    var block = document.getElementById("message");
    block.appendChild(img);
})

function logToServer(value, msg) {
    socket.emit('logToServer',{
        key: value,
        message: msg
    });
}