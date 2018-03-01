'use strict';

var path = require('path');
var serverPath = path.join(path.dirname(module.parent.filename), '../../../server/');

module.exports = function(options) {
  options = options || {};

  var canReceive = true;
  if (!options['consumerHandler']) {
    console.warn('You have to define a consumer handling module');
    canReceive = false;
  }
  if (!process.env.SQS_QUEUE_URL) {
    console.warn('SQS queue url not set, events will not received. Please set SQS_QUEUE_URL.');
    canReceive = false;
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_ACCESS_KEY_ID) {
    console.warn('No AWS authentication variables, events will not received. Please set AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID.');
    canReceive = false;
  }

  if (canReceive) {
    const handler = require(path.join(serverPath, options['consumerHandler']));
	  const Consumer = require('sqs-consumer');

  	const consumer = Consumer.create({
  	  queueUrl: process.env.SQS_QUEUE_URL,
  	    handleMessage: (message, done) => {
          if (handler.handleMessage && typeof handler.handleMessage === 'function') {
            handler.handleMessage(message, done);
      	  } else {
              console.log(message);
              done();
      	  }
    		}
  	});

    consumer.on('error', function(err, message) {
       if (handler.onError && typeof handler.onError === 'function') {
         handler.onError(err, message);
   	  }
    });

    consumer.on('processing_error', function(err, message) {
       if (handler.onProcessingError && typeof handler.onProcessingError === 'function') {
         handler.onProcessingError(err, message);
   	  }
    });

    consumer.on('message_received', function(message) {
       if (handler.onMessageReceived && typeof handler.onMessageReceived === 'function') {
         handler.onMessageReceived(message);
   	  }
    });

    consumer.on('message_processed', function(message) {
       if (handler.onMessageProcessed && typeof handler.onMessageProcessed === 'function') {
         handler.onMessageProcessed(message);
   	  }
    });

    consumer.on('response_processed', function() {
       if (handler.onResponseProcessed && typeof handler.onResponseProcessed === 'function') {
         handler.onResponseProcessed();
   	  }
    });

    consumer.on('stopped', function() {
       if (handler.onStopped && typeof handler.onStopped === 'function') {
         handler.onStopped();
   	  }
    });

    consumer.on('empty', function() {
       if (handler.onEmpty && typeof handler.onEmpty === 'function') {
         handler.onEmpty();
   	  }
    });

    consumer.start();
  }

  return function(req, res, next) {
    next();
  };
};
