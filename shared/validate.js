'use strict';

const BbPromise = require('bluebird');
const _ = require('lodash');
const Utils = require('./utils');

module.exports = {
  validate() {
    return BbPromise.bind(this)
      .then(this.validateServicePath)
      .then(this.validateServiceName)
      .then(this.validateHandlers);
  },

  validateApiGroupName() {
    // characters, digits, underscores
  },

  validateApiName() {
    // characters, digits, underscores
  },

  validateBucketName() {
    // characters, digits, dashes
  },

  validateServicePath() {
    if (!this.serverless.config.servicePath) {
      throw new Error('This command can only be run inside a service directory');
    }
    return BbPromise.resolve();
  },

  validateServiceName() {
    const serviceName = this.serverless.service.service;
    if (!/^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(serviceName)) {
      throw new Error(
        `The name of your service ${serviceName} is invalid. A service` +
        ' name should consist only of letters, digits, underscores and' +
        ' dashes, and it can not start with digits or underscores');
    }
    if (serviceName.length > 128) {
      throw new Error(
        `The name of your service ${serviceName} is invalid. A service` +
        ' name should not be longer than 128 characters');
    }
    return BbPromise.resolve();
  },

  validateProviderRuntime() {
    const providerName = this.serverless.service.provider.name;
    const runtime = this.serverless.service.provider.runtime;
    if (runtime !== Utils.getJavaRuntime() && runtime !== Utils.getNodeJSRuntime()) {
      const errorMessage = [
          `The "runtime" property for your provider "${providerName}" not supported.`,
          ' Only support java8 and nodejs6 now.',
        ].join('');
        throw new Error(errorMessage);
    }
  },

  validateHandlers() {
    const functions = this.serverless.service.functions;
    _.forEach(functions, (funcObject, funcKey) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(funcKey)) {
        throw new Error(
          `The name of your function ${funcKey} is invalid. A function` +
          ' name should consist only of letters, digits, underscores and' +
          ' dashes, and it can not start with digits or underscores');
      }
      if (funcKey.length > 128) {
        throw new Error(
          `The name of your function ${funcKey} is invalid. A function` +
          ' name should not be longer than 128 characters');
      }

      if (!funcObject.handler) {
        const errorMessage = [
          `Missing "handler" property for function "${funcKey}".`,
          ' Your function needs a "handler".',
          ' Please check the docs for more info.',
        ].join('');
        throw new Error(errorMessage);
      }
      // validate handler according to runtime
      const runtime = this.serverless.service.provider.runtime;
      switch (runtime) {
        case Utils.getJavaRuntime():
          if (!/^(\w+\.)*\w+::\w+$/.test(funcObject.handler)) {
            const errorMessage = [
            `The "handler" property for the function "${funcKey}" is invalid.`,
            ' Handlers should be specified like ${packageName}.${className}::${funcName}',
            ' Please check the docs for more info.'
            ].join('');
            throw new Error(errorMessage);
          }
          break;
        default:
          if (!/^[^.]+\.[^.]+$/.test(funcObject.handler)) {
            const errorMessage = [
            `The "handler" property for the function "${funcKey}" is invalid.`,
            ' Handlers should be specified like ${fileName}.${funcName}',
            ' Please check the docs for more info.',
            ].join('');
            throw new Error(errorMessage);
          }
      }
    });
    return BbPromise.resolve();
  },

  validateEventsProperty () {
    const functions = this.serverless.service.functions;
    _.forEach(functions, (funcObject, funcKey) => {

      if (funcObject.events && funcObject.events.length > 1) {
        const errorMessage = [
          `The function "${funcKey}" has more than one event.`,
          ' Only one event per function is supported.',
          ' Please check the docs for more info.',
        ].join('');
        throw new Error(errorMessage);
      }

      const supportedEvents = [
        'http',
        'oss'
      ];
      const eventType = Object.keys(funcObject.events[0])[0];
      if (supportedEvents.indexOf(eventType) === -1) {
        const errorMessage = [
          `Event type "${eventType}" of function "${funcKey}" not supported.`,
          ` supported event types are: ${supportedEvents.join(', ')}`,
        ].join('');
        throw new Error(errorMessage);
      }
      // TODO: verify that http events has paths and oss events have triggerConfig, sourceArn, .etc
    });
  }
};
