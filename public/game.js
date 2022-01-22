//this is the client file
//import Pickr from '@simonwep/pickr';
const socket = io();
let roomID;
let playerName;
let isHost = false;;
let hostChoice;
let description;
let drawnImage;
let submittedDrawing = false;

/*Create Game Event Emitter*/
$(".createBtn").click(function () {
    playerName = $("input[name=hostName").val().replace(/\W/g, '');
    if (playerName) {
        socket.emit('createGame', { name: playerName });
    } else {
        $("#message").html("You cannot have a blank name!").show();
    }
})

//New Game Created Listener
socket.on("newGame", (data) => {
    $(".lobbyScreen").hide();
    $("#message").html("Waiting for players to join; room code is " + data.roomID).show();
    roomID = data.roomID;
    isHost = true;
})

//Join Game Event Emitter
$(".joinBtn").click(function () {
    isHost = false;
    playerName = $("input[name=playerName]").val().replace(/\W/g, '');

    if (playerName) {
        roomID = $("input[name=roomID").val();
        socket.emit('joinGame', {
            name: playerName,
            roomID: roomID
        });
    } else {
        $("#message").html("You cannot have a blank name!").show();
    }
    
})
socket.on("joinGameSuccess", (data) => {
    let playerList = data.currentPlayers;
    let roomID = data.roomID;
    let numberOfPlayers = data.numberOfCurrentPlayers;
    let maxPlayerLimit = data.maxPlayerLimit;

    transition();
    $("#message").html("Waiting for host to start game. The room code is " + roomID).show();
    $("#playerListTitle").html("Player List: " + numberOfPlayers + "/" + maxPlayerLimit);

    let playerListDisplay = "";
    playerList.forEach(player => {
        playerListDisplay += player + "<br>";
    });
    $("#playerList").html(playerListDisplay);
})

socket.on("changeMessageDisplay", (data) => {
    if(data.mode == "append") {
        $("#message").append(data.message).show();
    } else {
        $("#message").html(data.message).show();
    }
})

/*This transition() function takes care of all the UI changes to enter the game.
*/
const transition = () => {
    $(".lobbyScreen").hide();
    $(".players").show();
    $("#message").show();
    $("#artGallery").show();
    
    if (isHost) {
        $(".hostControls").show();
    } else {
        $(".playerControls").show();
    }
    $("#describePokemonForm").hide();
}
///////////////////////////////////////////////////////////////////////////////////////////// Host controls ////////////

//Host chooses pokemon to describe
$(".choosePokemonButton").click(function () {
    hostChoice = $("input[name=choosePokemon]").val().replace(/[&<"]/g, '');
    socket.emit('choosePokemon', {
        chosenPokemon: hostChoice,
        name: playerName,
        roomID: roomID
    });
    document.getElementById("choosePokemonButton").textContent = "Good luck!";
    document.getElementById("choosePokemonButton").disabled = true;
    document.getElementById("choosePokemon").disabled = true;
    $("#describePokemonForm").show();
})

$("#startGame").click(function () {
    socket.emit('startGame', {
        roomID: roomID
    });
    $("#startGame").hide();
    $("#message").hide();
    $("#record").show();
    $("#choosePokemonForm").show();
})
//all client game controls are hidden until host starts game
socket.on("startGame", () => {
    $("#record").show();
    $("#message").html("Waiting for host to write a description...");
})

//Emitter for describing a pokemon from the host
$(".describeButton").click(function () {
    description = $("textarea[id=describepokemon]").val().replace(/[&<"]/g, '');
    socket.emit('addDescription', {
        pokemonDescription: description,
        name: playerName,
        roomID: roomID
    });
    document.getElementById("describepokemon").value = ""; //clear textarea after hitting Submit
    document.getElementById("describeButton").textContent = "Submit another description";
    $("#revealPokemonButton").show();
    $("#revealDrawingButton").show();
    $("#finishedDescribingButton").show();
})
$(".finishedDescribingButton").click(function () {
    document.getElementById("describeButton").disabled = true;
    document.getElementById("describepokemon").disabled = true;
    document.getElementById("finishedDescribingButton").disabled = true;

    socket.emit('finishedDescribing', {
        roomID: roomID
    });
})
socket.on("finishedDescribing", () => {
    $("#message").html("The host is done writing all the descriptions!").show();

    var block = document.getElementById("descriptionHistory");
    var text = document.createTextNode("Host is done describing! Time to finish up your drawing and submit!");
    block.appendChild(text);
    setTimeout(()=> text.classList.add("animate"), 500);
    var descriptionHistory = document.getElementById("record");
    descriptionHistory.scrollTop = descriptionHistory.scrollHeight;
})

// Update description event listener
socket.on("updateDescription", (data) => {
    $("#message").hide();
    if(!submittedDrawing) { 
        $("#drawingControls").css('display', 'flex'); 
        $(".finishDrawing").show();
    }
    var block = document.getElementById("descriptionHistory");
    var li = document.createElement("li");
    var text = document.createTextNode(data.pokemonDescription);
    li.appendChild(text);
    block.appendChild(li);
    setTimeout(()=> li.classList.add("animate"), 500);

    //scroll the scrollbar to the bottom when a new description is added
    var descriptionHistory = document.getElementById("record");
    descriptionHistory.scrollTop = descriptionHistory.scrollHeight;
})

$("#guessButton").click(function () {
    guess = $("input[name=guessPokemon]").val().replace(/[&<"]/g, '');
    socket.emit('submitGuess', {
        guess: guess,
        name: playerName,
        roomID: roomID
    });
    document.getElementById("guessButton").textContent = "Submitted Guess";
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

$(".finishDrawingButton").click(function () {
    //save canvas as image
    submittedDrawing = true;
    $("#guessPokemonForm").show();
    $("#canvas").hide();
    $("#drawingControls").hide();
    $("#finishDrawingTitle").hide();
    
    let drawnImageData = canvas.toDataURL('jpg');
    var img = document.createElement("img");
    img.src = drawnImageData;

    socket.emit('finishDrawing', {
        name: playerName,
        roomID: roomID,
        drawing: drawnImageData
    });
    //hide canvas after submitting drawing
    canvas.isDrawingMode = false;

    document.getElementById("finishDrawingButton").textContent = "Submitted drawing!";
    document.getElementById("finishDrawingButton").disabled = true;
});

////////////////////////////////////////////// end of game reveal controls/////////////////////////////////////////////

$("#revealPokemonButton").click(function () {
    socket.emit('revealPokemonToPlayers', {
        roomID: roomID,
    });
});
socket.on("revealPokemonToPlayers", (data) => {
    let chosenPokemon = data.chosenPokemon;
    $("#message").html("The answer was: " + chosenPokemon).show();

    document.getElementById("guessButton").textContent = "The answer was already revealed!";
    document.getElementById("guessButton").disabled = true;
    document.getElementById("revealPokemonButton").textContent = "Answer has been revealed!";
    document.getElementById("revealPokemonButton").disabled = true;
});

$("#revealDrawingButton").click(function () {
    socket.emit('revealDrawings', {
        roomID: roomID,
    });
});

socket.on("endTheGame", (data) => {
    let drawnImageData = data.images;
    let guesses = data.guesses;
    let chosenPokemon = data.chosenPokemon;
    let guessString = "";
    var block = document.getElementById("artGallery");

    Object.keys(drawnImageData)
        .forEach(function eachArtist(artist) {
            let img = document.createElement("img");
            let name = artist;
            img.src = drawnImageData[artist];

            //display image in html
            let credit = document.createTextNode("Drawn by " + name + ":");
            let br = document.createElement("br")
            block.appendChild(credit);
            block.appendChild(img);
            block.appendChild(br);
    });

    //display guesses
    guesses.forEach(playerGuess => {
        guessString += playerGuess + "<br>"
    });

    $("#message").html("The answer was: " + chosenPokemon).show();
    document.getElementById("describeButton").disabled = true;
    document.getElementById("describepokemon").disabled = true;
    document.getElementById("finishedDescribingButton").disabled = true;
    document.getElementById("revealDrawingButton").disabled = true;
    document.getElementById("finishDrawingButton").disabled = true;
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
        interaction: {
            hex: true,
            input: true
        }
    }
});

pickr.on("change", function (e) {
    $(".pcr-button").css("--pcr-color", e.toRGBA().toString());
    brushColor = e.toHEXA().toString();
    canvas.freeDrawingBrush.color = brushColor;
});