'use strict';

const fs = require('fs');
const BbPromise = require('bluebird');
const _ = require('lodash');

module.exports = {
  uploadArtifacts() {
    const objectId = this.provider.getStorageObjectId();
    const objects = this.templates.update.Resources[objectId].Properties.Objects;
    const bucket = this.templates.create.Resources[this.provider.getStorageBucketId()].Properties;

    return BbPromise.all(_.map(objects, (object) => {
    	this.serverless.cli.log(`Uploading ${object.ObjectName} to OSS bucket ${bucket.BucketName}...`);
    	return this.provider.uploadObject(object.ObjectName, object.LocalPath).then(() => {
    		this.serverless.cli.log(`Uploaded ${object.ObjectName} to OSS bucket ${bucket.BucketName}`);
    	});
    }));
  }
};
