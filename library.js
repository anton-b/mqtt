function initializebuttons() {
    var buttons = document.getElementsByName('controlswitch')
    buttons.forEach(function(button) {
        subscribebutton(button)
    })
}

function getOption(id) {
    var element = document.getElementById(id)
    return element.value
}

function log(message) {
    var logdiv = document.getElementById('log')
    logdiv.innerHTML = logdiv.innerHTML + "<br>\n" + message
}

function handlestatusfun(button) {
    return (message) => {
        log("Got message " + message.payloadString)
        switch (message.payloadString) {
            case "on":
                change_color(button, 'black', 'green')
                break
            case "off":
                change_color(button, 'white', 'black')
                break
        }
    }
}

function change_color(button, fcolor, bgcolor) {
    button.style.backgroundColor = bgcolor
    button.style.color = fcolor
}


function subscribebutton(button) {
    var statustopic = button.getAttribute('statustopic')
    var statusclient = button.getAttribute('statusclient')
    var client = getclient(statusclient)
    if (client instanceof Paho.MQTT.Client != true) {
        var client = subscribe(getOption('hostname'),
            Number(getOption('port')),
            getOption('username'),
            getOption('password'),
            statustopic,
            () => {},
            handlestatusfun(button)
        )
        storeclient(client._getClientId(), client)
        button.setAttribute('statusclient', client._getClientId())
        log("Subscribed button to status " + statustopic)
    }
    else {
        log("Already subscribed to " + statustopic)
    }
}

function processbutton(button) {
    var statustopic = button.getAttribute('statustopic')
    var ctrltopic = button.getAttribute('ctrltopic')
    var command = button.getAttribute('command')
    var controlclient = button.getAttribute('ctrlclient')
    var client = getclient(controlclient)
    if (client instanceof Paho.MQTT.Client != true) {
        var client = subscribe(getOption('hostname'),
            Number(getOption('port')),
            getOption('username'),
            getOption('password'),
            ctrltopic,
            () => sendmessage(client, ctrltopic, command),
            (message) => log("Warning, got message from control queue " + message.payloadString)
        )
        storeclient(client._getClientId(), client)
        button.setAttribute('ctrlclient', client._getClientId())
    } else {
      sendmessage(client, ctrltopic, command)
    }
    log("Sent command " + command + " to " + ctrltopic)
}

function subscribe(hostname, port, username, password, topic, onconnect, onmessagearrived) {
    // Create a client instance
    var clientname = "client" + String(Math.round(Math.random() * 10));
    var client = new Paho.MQTT.Client(hostname, port, clientname);
    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onmessagearrived;
    // connect the client
    if (username.length > 0) {
        var params = {
            onSuccess: onConnect,
            useSSL: true,
            userName: username,
            password: password
        }
    } else {

        var params = {
            onSuccess: onConnect,
        }
    }

    client.connect(params);
    // called when the client connects
    function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        log("Connection successful to topic " + topic + " as client " + clientname);
        client.subscribe(topic);
        onconnect()
    }

    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            log("onConnectionLost:" + responseObject.errorMessage);
        }
    }
    return client
}

function sendmessage(client, destinationName, message) {
    var message = new Paho.MQTT.Message(message);
    message.destinationName = destinationName;
    client.send(message);
}

function storeclient(id, client){
    if (typeof clients == 'object')
    {
       clients[id] = client
    } else
    {
        clients = {}
        clients[id] = client
    }
}

function getclient(id)
{
    if (typeof clients == 'object')
    {
        return clients[id]
    } else
    {
        return undefined
    }
}