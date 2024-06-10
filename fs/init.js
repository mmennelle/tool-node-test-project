/**
 * Mitchell Mennelle
 * Tool: Drill Press
 * Version: 0.0.1
 * Date: 06/09/2024
 *
 * This file contains the initialization code for the MQTT client.
 * 
 */
load('api_mqtt.js');
load('api_sys.js');
load('api_config.js');
load('api_uart.js');


let uartNo = 0; // Use UART0 for the RFID reader

UART.setConfig(uartNo, {
  baudRate: 9600, // look up baud rate for 125kHz RFID readers
  rxBufSize: 256,
  txBufSize: 256,
  esp32: {
    gpio: {
      rx: 3, // pin for RX 
      tx: 1  // pin for TX 
    }
  }
});

// MQTT topics
let rfidTopic = 'metal/tool/drillpress/access';
let responseTopic = 'metal/tool/drillpress/response';

// Function to handle incoming MQTT messages
function handleIncomingMessage(conn, topic, msg) {
  print('Received message on topic:', topic, 'message:', msg);
  
  if (topic === responseTopic) {
    let response = JSON.parse(msg);
    if (response.access) { //true or false based on JOSN return from broker.
      print('Access granted for RFID tag:', response.rfid);
      /*
      Granted:
      1. initialize load sense and monitor for tool start
      2. set relay pin to high to activate tool. Also set green LED pin to high.
      3. monitor for tool stop, if stopped then
      4. extra logic: 
        1. if tool is stopped, start timer for 3 minutes. allow immediate restart within that time
        2. if tool is not started within 3 minutes, tag approval is needed again. Set relay pin to low to deactivate tool
        3. The load sensor should monitor tool start for over current and shut off if above threshold. (this can be added later)
      */
    } else {
      print('Access denied for RFID tag:', response.rfid);
      /**
       * Denied:
       * 1. set red led pin to high.
       * 2. flash 5 times to indicated denied access.
       * 3. set red led pin to low.
       */
    }
  }
}

// Subscribe to the response topic
MQTT.sub(responseTopic, handleIncomingMessage, null);

// Buffer to store incoming RFID tag data
let rfidBuffer = '';

// Set up UART to read RFID data
UART.setDispatcher(uartNo, function(uartNo, ud) {
  let ra = UART.readAvail(uartNo);
  if (ra > 0) {
    let data = UART.read(uartNo);
    rfidBuffer += data;

    // Remeber to look up code length. i think 10?
    if (rfidBuffer.length <= 20) {
      let rfidTag = rfidBuffer.substr(0, 20);
      rfidBuffer = rfidBuffer.substr(20); // Remove the processed tag

      print('RFID tag detected:', rfidTag);

      // Publish the RFID tag data to the MQTT broker
      let ok = MQTT.pub(rfidTopic, JSON.stringify({ tag: rfidTag }), 1);
      print('Attempted to publish:', ok ? 'success' : 'failure', 'topic:', rfidTopic, 'RFID tag:', rfidTag);
    }
  }
}, null);

UART.setRxEnabled(uartNo, true);


/*let topic = 'tool/drillpress/access'; 
let responseTopic = 'tool/drillpress/response'; // Topic where responses are expected

// Function to handle incoming MQTT messages
function handleIncomingMessage(conn, topic, msg) {
  print('Received message on topic:', topic, 'message:', msg);
  
  // Add your custom message handling logic here
  if (topic === responseTopic) {
    print('Response received:', msg);
    // Process the response message
  }
}

// Subscribe to the topic for responses
MQTT.sub(responseTopic, handleIncomingMessage, null);

// Check if subscription was successful
MQTT.sub(topic, function(conn, topic, msg) {
  print('Subscribed to topic:', topic);
}, null);

// Publish a message to the original topic every 5 seconds
Timer.set(5000, Timer.REPEAT, function() {
  let message = 'Hello MQTT from Mongoose OS';
  let ok = MQTT.pub(topic, message, 1);
  print('Attempted to publish:', ok ? 'success' : 'failure', 'topic:', topic, 'message:', message);
}, null);*/
