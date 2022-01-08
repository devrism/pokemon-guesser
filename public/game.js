//const socket = io.connect("http://localhost:4000");
const socket = io();
let firstPlayer=false;
let roomID;
let playerName;

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
})

//Join Game Event Emitter
$(".joinBtn").click(function(){
    playerName=$("input[name=p2name").val();
    roomID=$("input[name=roomID").val();
    socket.emit('joinGame',{
        name:playerName,
        roomID:roomID
    });
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
    $(".controls").show();
    $(".player1 .name").html(data.p1name);
    $(".player2 .name").html(data.p2name);
    $("#message").html(data.p2name+" is here!").show();
}

//Select Choice
/*The firstPlayer variable is used to distinguish between the kind of event the player has to emit. 
Player1 emits choice1, Player2 emits choice2 .
*/
$(".controls button").click(function (){
    const choice=$(this).html().trim();
    const choiceEvent=firstPlayer?"choice1":"choice2";
    socket.emit(choiceEvent,{
        choice: choice,
        roomID:roomID,
        name:playerName,
    });
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