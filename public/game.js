//this is the client file
//import Pickr from '@simonwep/pickr';
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
    $("#describePokemonForm").hide();
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

$("#startGame").click(function () {
    //TODO hide the other host controls until this button is clicked, then show controls and hide button.
    socket.emit('startGame', {
        roomID: roomID
    });
    $("#startGame").hide();
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
    document.getElementById("describeButton").textContent = "Submit another description";
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


//////////////////////////////////////////////////// drawing canvas functions/////////////////////////////////////////////////

const canvas = new fabric.Canvas("canvas");
canvas.isDrawingMode = true;
canvas.set('erasable', true);
var eraser = new fabric.EraserBrush(canvas);
var pen = new fabric.PencilBrush(canvas);
var brushSize = document.getElementById('brushSize');
var brushSizeDisplay = document.getElementById('brushSizeDisplay');
brushSize.addEventListener("input", inputHandler);
brushSize.addEventListener("change", changeHandler); //this is the preferred pattern
var brushWidth = 5;
brushSizeDisplay.innerHTML = "Brush Size: " + brushWidth;
var brushColor = '#000000';
canvas.freeDrawingBrush.color = brushColor;
canvas.freeDrawingBrush.width = brushWidth;

$("#eraseMode").click(function () {
    canvas.freeDrawingBrush = eraser;
    canvas.freeDrawingBrush.width = brushWidth;
});

$("#drawMode").click(function () {
    canvas.freeDrawingBrush = pen;
    canvas.freeDrawingBrush.width = brushWidth;
});

function inputHandler(event) { //preferred pattern
    logToServer(event.target.value, "input");
    brushWidth = Number(event.target.value);
    canvas.freeDrawingBrush.width = brushWidth;
    brushSizeDisplay.innerHTML = "Brush Size: " + brushWidth;
}

function changeHandler(event) {
    logToServer(event.target.value, "change");
    brushWidth = Number(event.target.value);
    canvas.freeDrawingBrush.width = brushWidth;
    brushSizeDisplay.innerHTML = "Brush Size: " + brushWidth;
}


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

////////////////////////////////////////////// end of game reveal controls/////////////////////////////////////////////

socket.on("endOfGame", (data) => {
    let drawnImageData = data.image;
    var img = document.createElement("img");
    img.src = drawnImageData;

    //display image in html
    var block = document.getElementById("finishedArt");
    block.appendChild(img);

    let guesses = data.guesses;
    logToServer(guesses, "Guesses: "); //TODO display guesses
})

//TODO comment out when done developing
function logToServer(value, msg) {
    socket.emit('logToServer', {
        key: value,
        message: msg
    });
}

const pickr = Pickr.create({
    el: "#colorPicker",
    theme: "nano",
    swatches: [
        'rgba(244, 67, 54, 1)',
        'rgba(233, 30, 99, 1)',
        'rgba(156, 39, 176, 1)',
        'rgba(103, 58, 183, 1)',
        'rgba(63, 81, 181, 1)',
        'rgba(33, 150, 243, 1)',
        'rgba(3, 169, 244, 1)',
        'rgba(0, 188, 212, 1)',
        'rgba(0, 150, 136, 1)',
        'rgba(76, 175, 80, 1)',
        'rgba(139, 195, 74, 1)',
        'rgba(205, 220, 57, 1)',
        'rgba(255, 235, 59, 1)',
        'rgba(255, 193, 7, 1)'
    ],
    components: {
        preview: true,
        opacity: true,
        hue: true,
        // Input / output Options
        interaction: {
            hex: true,
            rgba: false,
            hsla: false,
            hsva: false,
            cmyk: false,
            input: true,
            clear: false,
            save: false
        }
    }
});

pickr.on("change", function (e) {
    $(".pcr-button").css("--pcr-color", e.toRGBA().toString());
    brushColor = e.toHEXA().toString();
    canvas.freeDrawingBrush.color = brushColor;
});