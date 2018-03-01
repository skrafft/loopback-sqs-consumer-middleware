[![NPM](https://nodei.co/npm/loopback-sqs-consumer-middleware.png?compact=true)](https://nodei.co/npm/loopback-sqs-consumer-middleware/)
# Loopback sqs consumer middleware

This is a simple middleware listening for Amazon Simple Queue Service events on a speficied queue.

INSTALL
=============

```bash
  npm install loopback-sqs-consumer-middleware --save
```

SERVER CONFIG
=============

Add the middleware to your *middleware.json*:

```json
{
  "loopback-sqs-consumer-middleware": {
    "params": {
      "consumerHandler": "./sqsEventHandler"
    }
  }
}
```

HANDLER
=============

You need to define an event handler (in the previous example config, sqsEventHandler.js) with the following structure in the loopback server directory.

```javascript
'use strict';

module.exports = {
  handleMessage: function(message, done) {
    console.log('Msg: ' + JSON.stringify(message));
    done();
  },
  onError: function(err, message) {
    console.log(err, message);
  },
  onProcessingError: function(err, message) {
    console.log(err, message);
  },
  onMessageReceived: function(message) {
    console.log(message);
  },  
  onMessageProcessed: function(message) {
    console.log(message);
  },
  onResponseProcessed: function() {
    console.log('Response processed');
  },
  onEmpty: function() {
    console.log('Queue is empty');
  },
  onStopped: function() {
    console.log('Consumer stopped');
  }
};
```

CONNEXIONS
=============

To be able to connect to your SQS queue and listen for events in the topic, you have to set the SQS_QUEUE_URL env variable.
You also have to set AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID for authentication.

```bash
export SQS_QUEUE_URL=https://sqs.eu-west-1.amazonaws.com/account-id/queue-name
export AWS_SECRET_ACCESS_KEY=...
export AWS_ACCESS_KEY_ID=...
```

LICENSE
=============
[Apache-2.0] (LICENSE)
