# tinyTanks

you can play here: https://tiny-tanks.herokuapp.com/

![screenshot](/screenshots/screenshot.png?raw=true "Gameplay")


Online tank webgame written in javascript using MongoDB to verify user accounts and leaderboard.  I made this project to experiment with writing my own API's as well as to refine my javascript and create an interactive game.

## Using the Tank Game API

From postman send a post request to
https://tiny-tanks.herokuapp.com/api/users/score

With The Headers:    
AppToken. :  !@duh!
UserId  :    Tombadgeid1111


The returned JSON object will be in the following format 
For the player entered in the userid header 

{
    "text": "tanks score: 2",
    "link": "app.tanks.url",
    "icon-url": "tanksicon.png"
}


Other UserID's currently in the database for testing
shivbadgeid123
guestbadgeid11
tombadgeid1111

## to play 
use WASD to move:
press enter to send messages in chat – chat messages are visible to connected payers

Press left click to shoot bullets.  Each player has 5 lives. Lives are represented as both a red healthbar and a number located under the healthbar.

type ! before a chat message to access server console.
Example:
	!socket.id
	 >displays your socket.id in chat
