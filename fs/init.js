load('api_timer.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_config.js');

let topic = 'test/topic';
let responseTopic = 'test/response'; // Topic where responses are expected

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
Timer.set(5000 /* milliseconds */, Timer.REPEAT, function() {
  let message = 'Board Number 1';
  let ok = MQTT.pub(responseTopic, message, 1);
  print('Attempted to publish:', ok ? 'success' : 'failure', 'topic:', topic, 'message:', message);
}, null);
