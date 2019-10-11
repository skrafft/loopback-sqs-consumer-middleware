'use strict';

const path = require('path');
const serverPath = path.join(__dirname, '../../../../server/');
const moment = require('moment-timezone');

const STATUS_STOPPED = 'stopped';
const STATUS_STARTED = 'started';

module.exports = function(options) {
  options = options || {};
  let consumerStatus = STATUS_STOPPED;

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
    		},
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

    if (options.schedule && options.schedule.timezone && options.schedule.from && options.schedule.to) {
      const manageConsumer = () => {
        const now = moment().tz(options.schedule.timezone);
        const [fromHour, fromMinutes] = options.schedule.from.split(':');
        const [toHour, toMinutes] = options.schedule.to.split(':');
        const from = now.clone().startOf('day').hour(Number(fromHour)).minute(Number(fromMinutes));
        const to = now.clone().startOf('day').hour(Number(toHour)).minute(Number(toMinutes));
        if (now.isAfter(from) && now.isBefore(to)) {
          if (consumerStatus !== STATUS_STARTED) {
            console.log('In schedule time, starting SQS consumer');
            consumer.start();
            consumerStatus = STATUS_STARTED;
          }
        } else {
          if (consumerStatus !== STATUS_STOPPED) {
            console.log('Out of schedule time, stopping SQS consumer');
            consumer.stop();
            consumerStatus = STATUS_STOPPED;
          }
        }
      };
      console.log('Schedule is active. Only consuming data from ' + options.schedule.from + ' to ' + options.schedule.to + ' (' + options.schedule.timezone + ')');
      manageConsumer();
      setInterval(manageConsumer, 60000);
    } else {
      consumer.start();
      consumerStatus = STATUS_STARTED;
    }
  }

  return function(req, res, next) {
    next();
  };
};
