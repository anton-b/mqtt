function initializebuttons()
{
   buttons=document.getElementsByName('controlswitch')
   buttons.forEach(function(button) {
         subscribebutton(button)
   })
}

function getOption(id)
{
    element = document.getElementById(id)
    return element.value
}

function log(message)
{
    logdiv = document.getElementById('log')
    logdiv.innerHTML = logdiv.innerHTML + "<br>\n" + message
}

function subscribebutton(button)
{
  statustopic=button.getAttribute('statustopic')
  subscribe(getOption('hostname'),
            Number(getOption('port')),
            getOption('username'),
            getOption('password'),
            statustopic,
            () => {},
            handlestatusfun(button))
  log("Subscribed button to status " + statustopic)
}

function handlestatusfun(button)
{
   return (message) =>
                {
                    log("Got message " + message.payloadString)
                    switch(message.payloadString){
                    case "on":
                        change_color(button, 'black', 'green')
                        break
                    case "off":
                        change_color(button, 'white', 'black')
                        break
                    }
                }
}

function change_color(button, fcolor, bgcolor)
{
    button.style.backgroundColor = bgcolor
    button.style.color = fcolor
}

function processbutton(button)
{
  var statustopic=button.getAttribute('statustopic')
  var ctrltopic=button.getAttribute('ctrltopic')
  var command=button.getAttribute('command')
  var client = subscribe(getOption('hostname'),
                          Number(getOption('port')),
                          getOption('username'),
                          getOption('password'),
                          ctrltopic,
                          () => sendmessage(client, ctrltopic, command),
                          (message) => log("Warning, got message from control queue " + message.payloadString))
  log("Sent command " + command + " to " + ctrltopic)
}

function subscribe(hostname, port, username, password, topic, onconnect, onmessagearrived)
{
// Create a client instance
var clientname = "client" + String(Math.round(Math.random()*10))
var client = new Paho.MQTT.Client(hostname, port, clientname);

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onmessagearrived;

// connect the client
client.connect({onSuccess:onConnect,
                useSSL:true,
                userName:username,
                password:password});


// called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    log("Connection successful to topic " + topic + " as client " + clientname);
    client.subscribe(topic);
    onconnect()
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
    log("onConnectionLost:"+responseObject.errorMessage);
    }
}
return client
}

function sendmessage(client, destinationName, message)
{
    var message = new Paho.MQTT.Message(message);
    message.destinationName = destinationName;
    client.send(message);
}
