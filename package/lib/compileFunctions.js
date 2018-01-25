'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  compileFunctions() {
    this.resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    const artifact = this.serverless.service.package.artifact;
    if (artifact) {
      this.compileStorage(artifact);
    }
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);
      this.compileFunction(functionName, funcObject);
    });
    return BbPromise.resolve();
  },

  compileFunction(funcName, funcObject) {
    this.resources = this.serverless.service.provider.compiledConfigurationTemplate.Resources;
    // Notice artifact is different
    if (funcObject.package.artifact) {
      this.compileStorage(funcObject.package.artifact, funcName);
    }
    this.compileFunctionAndEvent(funcName, funcObject);
    return BbPromise.resolve();
  },

  compileStorage(artifact, funcName) {
    const objectId = this.provider.getStorageObjectId();
    const resources = this.resources;

    const bucketName = this.provider.getDeploymentBucketName();

    const fileName = artifact.split(path.sep).pop();
    const directory = this.provider.getArtifactDirectoryName();
    const artifactFilePath = `${directory}/${fileName}`;
    this.serverless.service.package.artifactFilePath = artifactFilePath;
    this.serverless.service.package.artifactDirectoryName = directory;

    const packagePath = 
      path.join(this.serverless.config.servicePath || '.', '.serverless');
    const filePath = path.join(packagePath, fileName);
    const objectsResource = this.provider.getObjectsResource(artifactFilePath, filePath);
    const resProperties = objectsResource.Properties;
    // TODO: need to see if package.individually is true
    if (funcName === undefined) {
      funcName = this.provider.getServiceName();
    }
    if (!resProperties.Objects) {
      resProperties["Objects"] = {
        [funcName] : this.provider.getObjectResource(artifactFilePath, filePath)
      }
    } else {
      _.merge(resProperties.Objects, { [funcName]: this.provider.getObjectResource(artifactFilePath, filePath) });
    }
    _.merge(resources, { [objectId]: objectsResource });
  },

  compileFunctionAndEvent(functionName, funcObject) {
    const resources = this.resources;
    this.serverless.cli
      .log(`Compiling function "${functionName}"...`);

    const funcId = this.provider.getFunctionLogicalId(funcObject.name);
    const funcResource = this.provider.getFunctionResource(funcObject);
    // recursive merge
    _.merge(resources, { [funcId]: funcResource });

    this.compileApiGateway.call(this, funcObject);
    this.compileOSSTrigger.call(this, funcObject);
    this.compileEvents.call(this, funcObject);
  },

  compileApiGateway(funcObject) {
    const resources = this.resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();
    const invokeRoleId = this.provider.getInvokeRoleLogicalId();

    if (funcObject.events.some(needsApiGateway)) {
      if (!resources[agLogicalId]) {
        resources[agLogicalId] = this.provider.getApiGroupResource();
      }
      let invokeResource = resources[invokeRoleId];
      if (!invokeResource) {
        invokeResource = this.provider.getInvokeRoleResource();
      }
      this.provider.makeRoleAccessibleFromAG(invokeResource);
      resources[invokeRoleId] = invokeResource;
    }
  },

  compileOSSTrigger(funcObject) {
    const resources = this.resources;
    const invokeRoleId = this.provider.getInvokeRoleLogicalId();

    if (funcObject.events.some(needsOSSTrigger)) {
      let invokeResource = resources[invokeRoleId];
      if (!invokeResource) {
        invokeResource = this.provider.getInvokeRoleResource();
      }
      this.provider.makeRoleAccessibleFromOSS(invokeResource);
      resources[invokeRoleId] = invokeResource;
    }
  },

  compileEvents(funcObject) {
    const resources = this.resources;
    const agLogicalId = this.provider.getApiGroupLogicalId();

    funcObject.events.forEach((event) => {
      const eventType = Object.keys(event)[0];
      // TODO: support more event types
      if (eventType === 'http') {
        const apiResource = this.provider.getHttpApiResource(event.http, funcObject);
        const apiName = apiResource.Properties.ApiName;
        _.merge(resources, { [apiName]: apiResource });
      } else if (eventType === 'oss') {
        const triggerResource = this.provider.getOSSTriggerResource(event.oss, funcObject);
        const triggerName = triggerResource.Properties.triggerName;
        _.merge(resources, { [triggerName]: triggerResource });
      }
    });
  }
};

function needsApiGateway(event) {
  return Object.keys(event)[0] === 'http';
}

function needsOSSTrigger(event) {
  return Object.keys(event)[0] === 'oss';
}