//this is the client file
const socket = io();
let roomID;
let playerName;
let isHost = false;;
let hostChoice;
let description;
let drawnImage;

/*Create Game Event Emitter*/
$(".createBtn").click(function(){
    playerName=$("input[name=p1name").val();
    socket.emit('createGame',{name:playerName});
})

//New Game Created Listener
socket.on("newGame",(data)=>{
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $("#message").html("Waiting for players to join; room ID is "+data.roomID).show();
    roomID=data.roomID;
    isHost = true;
})

//Join Game Event Emitter
$(".joinBtn").click(function(){
    playerName=$("input[name=playerName]").val();
    roomID=$("input[name=roomID").val();
    socket.emit('joinGame',{
        name:playerName,
        roomID:roomID
    });
    isHost = false;
})

socket.on("joinGameSuccess", ()=>{
    transition();
})
socket.on("joinGameFailure", (data)=>{
    $("#message").html(data.message).show();
})

/*The code below calls the transition() function for both players. 
This transition() function takes care of all the UI changes to enter the game.
*/
const transition=()=>{
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $(".leaderboard").show();
    //$(".player1 .name").html(data.p1name);
    //$(".player2 .name").html(data.p2name);
    //$("#message").html(data.p2name+" is here!").show();

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