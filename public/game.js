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

/*This transition() function takes care of all the UI changes to enter the game.
*/
const transition=()=>{
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $(".leaderboard").show();
    $("#record").show();
    $("#message").show();

    if(isHost) {
        $(".hostcontrols").show();
    } else {
        $(".playercontrols").show();
    }
}

//Host chooses pokemon to describe
$(".choosePokemonButton").click(function (){
    hostChoice=$("input[name=choosepokemon]").val();
    socket.emit('choosepokemon', {
        chosenPokemon:hostChoice,
        name:playerName
    });
})

// Update description event listener
socket.on("updateDescription",(data)=>{
    if ($("#descriptionHistory").html().includes("Waiting for host to describe Pokemon")) {
        $("#descriptionHistory").html("");
    }
    var block = document.getElementById("descriptionHistory");
    var li = document.createElement("li");
    var text = document.createTextNode(data.pokemonDescription);
    li.appendChild(text);
    block.appendChild(li);
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
})

//////// drawing canvas functions/////////////////////////////////////////////////

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

///////////// end of game reveal controls/////////////////////////////////////////////

socket.on("endOfGame", (data) => {
    let drawnImageData = data.image;
    //logToServer(data.image, "client image list: "); TODO remove

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