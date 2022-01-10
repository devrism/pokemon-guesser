//this is the client file
const socket = io();
let roomID;
let playerName;
let isHost = false;;
let hostChoice;
let description;
let drawnImage;

/*Create Game Event Emitter*/
$(".createBtn").click(function () {
    playerName = $("input[name=hostName").val();
    socket.emit('createGame', { name: playerName });
})

//New Game Created Listener
socket.on("newGame", (data) => {
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $("#message").html("Waiting for players to join; room code is " + data.roomID).show();
    roomID = data.roomID;
    isHost = true;
})

//Join Game Event Emitter
$(".joinBtn").click(function () {
    playerName = $("input[name=playerName]").val();
    roomID = $("input[name=roomID").val();
    socket.emit('joinGame', {
        name: playerName,
        roomID: roomID
    });
    isHost = false;
})

socket.on("joinGameSuccess", () => {
    transition();
    $("#message").html("The room code is " + data.roomID).show();
})

socket.on("joinGameFailure", (data) => {
    $("#message").html(data.message).show();
})

/*This transition() function takes care of all the UI changes to enter the game.
*/
const transition = () => {
    $(".newRoom").hide();
    $(".joinRoom").hide();
    $(".players").show();
    $("#record").show();
    $("#message").show();
    $("#finishedArt").show();

    if (isHost) {
        $(".hostcontrols").show();
    } else {
        $(".playercontrols").show();
    }
}

//Host chooses pokemon to describe
$(".choosePokemonButton").click(function () {
    hostChoice = $("input[name=choosePokemon]").val();
    socket.emit('choosePokemon', {
        chosenPokemon: hostChoice,
        name: playerName,
        roomID: roomID
    });
    document.getElementById("choosePokemonButton").textContent = "Good luck!";
    document.getElementById("choosePokemon").disabled = true;
    $("#describePokemonForm").show();
})

// Update description event listener
socket.on("updateDescription", (data) => {
    $("#message").hide();
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
$(".describeButton").click(function () {
    description = $("textarea[id=describepokemon]").val();
    socket.emit('addDescription', {
        chosenPokemon: hostChoice,
        pokemonDescription: description,
        name: playerName,
        id: roomID
    });
    document.getElementById("describepokemon").value = ""; //clear textarea after hitting Submit
})

$("#guessButton").click(function () {
    guess = $("input[name=guessPokemon]").val();
    socket.emit('submitGuess', {
        guess: guess,
        name: playerName,
        roomID: roomID
    });
    document.getElementById("guessButton").textContent = "Awaiting results...";
    document.getElementById("guessButton").disabled = true;
    document.getElementById("guessPokemon").disabled = true;
})


//////// drawing canvas functions/////////////////////////////////////////////////

const canvas = window._canvas = new fabric.Canvas("canvas");
canvas.isDrawingMode = true;
canvas.set('erasable', true);
var eraser = new fabric.EraserBrush(canvas);
var pen = new fabric.PencilBrush(canvas);
var brushWidth = 3;
canvas.freeDrawingBrush.color = '#000000';
canvas.freeDrawingBrush.width = brushWidth;

$("#eraseMode").click(function () {
    canvas.freeDrawingBrush = eraser;
    canvas.freeDrawingBrush.width = brushWidth;
});
//TODO try Konva instead?
$("#drawMode").click(function () {
    canvas.freeDrawingBrush = pen;
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.freeDrawingBrush.color = '#000000';
});

$("#brushSize").change(function (event) {
    brushWidth = event.target.value;
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.calcOffset();
});
$("#brushSize").input(function (event) {
    brushWidth = event.target.value;
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.calcOffset();
});

$(".finishdrawing").click(function () {
    //save canvas as image
    let drawnImageData = canvas.toDataURL('jpg');
    var img = document.createElement("img");
    img.src = drawnImageData;

    socket.emit('finishDrawing', { //todo make server listener
        name: playerName,
        id: roomID,
        drawing: drawnImageData
    });
    //hide canvas after submitting drawing
    canvas.isDrawingMode = false;
    $("#canvas").hide();
    document.getElementById("finishdrawing").textContent = "Submitted!";
    document.getElementById("finishdrawing").disabled = true;
});

///////////// end of game reveal controls/////////////////////////////////////////////

socket.on("endOfGame", (data) => {
    logToServer(data, "Data: ");
    let drawnImageData = data.image;
    var img = document.createElement("img");
    img.src = drawnImageData;

    //display image in html
    var block = document.getElementById("finishedArt");
    block.appendChild(img);

    let guesses = data.guesses;
    logToServer(guesses, "Guesses: "); //TODO display guesses
})

function logToServer(value, msg) {
    socket.emit('logToServer', {
        key: value,
        message: msg
    });
}