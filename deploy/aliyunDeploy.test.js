'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');
const path = require('path');
const fs = require('fs');

const AliyunProvider = require('../provider/aliyunProvider');
const AliyunDeploy = require('./aliyunDeploy');
const Serverless = require('../test/serverless');

describe('AliyunDeploy', () => {
  let serverless;
  let aliyunDeploy;
  const servicePath = path.join(__dirname, '..', 'test');

  beforeEach(() => {
    serverless = new Serverless();
    serverless.service.service = 'my-service';
    serverless.service.package = {
      artifactFilePath: '/some-remote-file-path',
      artifact: 'artifact.zip'
    };
    serverless.service.provider = {
      name: 'aliyun',
      credentials: path.join(__dirname, '..', 'test', 'credentials'),
    };
    serverless.config = {
      servicePath: path.join(__dirname, '..', 'test')
    };
  });

  describe('#constructor()', () => {
    const options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    beforeEach(() => {
      serverless.setProvider('aliyun', new AliyunProvider(serverless, options));
      aliyunDeploy = new AliyunDeploy(serverless, options);
    })

    it('should set the serverless instance', () => {
      expect(aliyunDeploy.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(aliyunDeploy.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(aliyunDeploy.provider).toBeInstanceOf(AliyunProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let loadTemplatesStub;
      let setupServiceStub;
      let uploadArtifactsStub;
      let setupFunctionsStub;
      let setupTriggersStub;

      beforeEach(() => {
        validateStub = sinon.stub(aliyunDeploy, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(aliyunDeploy, 'setDefaults')
          .returns(BbPromise.resolve());
        loadTemplatesStub = sinon.stub(aliyunDeploy, 'loadTemplates')
          .returns(BbPromise.resolve());
        setupServiceStub = sinon.stub(aliyunDeploy, 'setupService')
          .returns(BbPromise.resolve());
        uploadArtifactsStub = sinon.stub(aliyunDeploy, 'uploadArtifacts')
          .returns(BbPromise.resolve());
        setupFunctionsStub = sinon.stub(aliyunDeploy, 'setupFunctions')
          .returns(BbPromise.resolve());
        setupTriggersStub = sinon.stub(aliyunDeploy, 'setupTriggers')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        aliyunDeploy.validate.restore();
        aliyunDeploy.setDefaults.restore();
        aliyunDeploy.loadTemplates.restore();
        aliyunDeploy.setupService.restore();
        aliyunDeploy.uploadArtifacts.restore();
        aliyunDeploy.setupFunctions.restore();
        aliyunDeploy.setupTriggers.restore();
      });

      it('should run "before:deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['before:deploy:deploy']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
          expect(loadTemplatesStub.calledAfter(setDefaultsStub)).toEqual(true);
        }));

      it('should run "deploy:deploy" promise chain', () => aliyunDeploy
        .hooks['deploy:deploy']().then(() => {
          expect(setupServiceStub.calledOnce).toEqual(true);
          expect(uploadArtifactsStub.calledAfter(setupServiceStub)).toEqual(true);
          expect(setupFunctionsStub.calledAfter(uploadArtifactsStub)).toEqual(true);
          expect(setupTriggersStub.calledAfter(setupFunctionsStub)).toEqual(true);
        }));
    });
  });

  describe('#deploy()', () => {
    const apiGroup = {
      "GroupName": "my-service-dev-api",
      "Description": "API group for Function Compute service my-service-dev, generated by the Serverless framework.",
      "Region": "cn-hangzhou"
    };

    const apis = [{
      "GroupName": "my-service-dev-api",
      "ApiName": "sls-http-my-service-dev-currentTime",
      "Visibility": "PUBLIC",
      "Description": "API for Function Compute function my-service-dev-currentTime of service my-service-dev, triggered by http event, generated by the Serverless framework.",
      "AuthType": "ANONYMOUS",
      "RequestConfig": {
        "RequestProtocol": "HTTP",
        "RequestHttpMethod": "GET",
        "RequestPath": "/ping",
        "RequestParameters": [],
        "BodyFormat": "",
        "PostBodyDescription": ""
      },
      "ServiceConfig": {
        "ServiceProtocol": "FunctionCompute",
        "Mock": "FALSE",
        "ServiceTimeout": 3000,
        "FunctionComputeConfig": {
          "FcRegionId": "cn-hangzhou",
          "ServiceName": "my-service-dev",
          "FunctionName": "my-service-dev-currentTime"
        },
        "ContentTypeValue": "application/json; charset=UTF-8"
      },
      "ResultType": "JSON",
      "ResultSample": "{}"
    }, {
      "GroupName": "my-service-dev-api",
      "ApiName": "sls-http-my-service-dev-currentTime2",
      "Visibility": "PUBLIC",
      "Description": "API for Function Compute function my-service-dev-currentTime2 of service my-service-dev, triggered by http event, generated by the Serverless framework.",
      "AuthType": "ANONYMOUS",
      "RequestConfig": {
        "RequestProtocol": "HTTP",
        "RequestHttpMethod": "GET",
        "RequestPath": "/ping2",
        "RequestParameters": [],
        "BodyFormat": "",
        "PostBodyDescription": ""
      },
      "ServiceConfig": {
        "ServiceProtocol": "FunctionCompute",
        "Mock": "FALSE",
        "ServiceTimeout": 3000,
        "FunctionComputeConfig": {
          "FcRegionId": "cn-hangzhou",
          "ServiceName": "my-service-dev",
          "FunctionName": "my-service-dev-currentTime2"
        },
        "ContentTypeValue": "application/json; charset=UTF-8"
      },
      "ResultType": "JSON",
      "ResultSample": "{}"
    }];

    const group = {
      "GroupName": "my-service-dev-api",
      "Description": "API group for Function Compute service my-service-dev, generated by the Serverless framework.",
      "Region": "cn-hangzhou"
    };

    const fullGroup = {
      "GroupName": "my-service-dev-api",
      "Description": "API group for Function Compute service my-service-dev, generated by the Serverless framework.",
      "GroupId": "523e8dc7bbe04613b5b1d726c2a7889d",
      "SubDomain": "523e8dc7bbe04613b5b1d726c2a7889d-cn-hangzhou.alicloudapi.com"
    };

    const role = {
      "RoleName": "SLSFCInvocationFromAPIGateway",
      "Description": "Allow Function Compute Service to be visited by API Gateway, generated by the Serverless framework",
      "AssumeRolePolicyDocument": {
        "Version": "1",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": [
                "apigateway.aliyuncs.com"
              ]
            }
          }
        ]
      },
      "Policies": [
        {
          "PolicyType": "System",
          "PolicyName": "AliyunFCInvocationAccess",
          "RoleName": "SLSFCInvocationFromAPIGateway"
        }
      ]
    };

    const fullRole =  {
      "RoleId": "901234567890123",
      "RoleName": "SLSFCInvocationFromAPIGateway",
      "Arn": "acs:ram::1234567890123456:role/SLSFCInvocationFromAPIGateway"
    }

    const fullApis = [{
      "ApiName": "sls-http-my-service-dev-currentTime",
      "ApiId": '4134134134141'
    }, {
      "ApiName": "sls-http-my-service-dev-currentTime2",
      "ApiId": '413243280141'
    }];


    let getServiceStub;
    let consoleLogStub;
    let createServiceStub;
    let getBucketStub;
    let createBucketStub;
    let uploadObjectStub;
    let getFunctionStub;
    let updateFunctionStub;
    let createFunctionStub;
    let getApiGroupStub;
    let createApiGroupStub;
    let getApiRoleStub;
    let createApiRoleStub;
    let getPoliciesStub;
    let createPolicyStub;
    let getApisStub;
    let updateApiStub;
    let createApiStub;
    let deployApiStub;

    beforeEach(() => {
      getServiceStub = sinon.stub(aliyunDeploy.provider, 'getService');
      consoleLogStub = sinon.stub(aliyunDeploy.serverless.cli, 'log').returns();
      createServiceStub = sinon.stub(aliyunDeploy.provider, 'createService');
      getBucketStub = sinon.stub(aliyunDeploy.provider, 'getBucket');
      createBucketStub = sinon.stub(aliyunDeploy.provider, 'createBucket');
      uploadObjectStub = sinon.stub(aliyunDeploy.provider, 'uploadObject');
      getFunctionStub = sinon.stub(aliyunDeploy.provider, 'getFunction');
      updateFunctionStub = sinon.stub(aliyunDeploy.provider, 'updateFunction');
      createFunctionStub = sinon.stub(aliyunDeploy.provider, 'createFunction');getApiGroupStub = sinon.stub(aliyunDeploy.provider, 'getApiGroup');
      createApiGroupStub = sinon.stub(aliyunDeploy.provider, 'createApiGroup');
      getApiRoleStub = sinon.stub(aliyunDeploy.provider, 'getApiRole');
      createApiRoleStub = sinon.stub(aliyunDeploy.provider, 'createApiRole');
      getPoliciesStub = sinon.stub(aliyunDeploy.provider, 'getPolicies');
      createPolicyStub = sinon.stub(aliyunDeploy.provider, 'createPolicy');
      getApisStub = sinon.stub(aliyunDeploy.provider, 'getApis');
      updateApiStub = sinon.stub(aliyunDeploy.provider, 'updateApi');
      createApiStub = sinon.stub(aliyunDeploy.provider, 'createApi');
      deployApiStub = sinon.stub(aliyunDeploy.provider, 'deployApi');
    });

    afterEach(() => {
      aliyunDeploy.provider.getService.restore();
      aliyunDeploy.serverless.cli.log.restore();
      aliyunDeploy.provider.createService.restore();
      aliyunDeploy.provider.getBucket.restore();
      aliyunDeploy.provider.createBucket.restore();
      aliyunDeploy.provider.uploadObject.restore();
      aliyunDeploy.provider.getFunction.restore();
      aliyunDeploy.provider.updateFunction.restore();
      aliyunDeploy.provider.createFunction.restore();
      aliyunDeploy.provider.getApiGroup.restore();
      aliyunDeploy.provider.createApiGroup.restore();
      aliyunDeploy.provider.getApiRole.restore();
      aliyunDeploy.provider.createApiRole.restore();
      aliyunDeploy.provider.getPolicies.restore();
      aliyunDeploy.provider.createPolicy.restore();
      aliyunDeploy.provider.getApis.restore();
      aliyunDeploy.provider.updateApi.restore();
      aliyunDeploy.provider.createApi.restore();
      aliyunDeploy.provider.deployApi.restore();
    });

    it('should set up service from scratch', () => {
      const serviceId = new Date().getTime().toString(16);
      getServiceStub.returns(BbPromise.resolve(undefined));
      createServiceStub.returns(BbPromise.resolve({ serviceId }));
      getBucketStub.returns(BbPromise.resolve(undefined));
      createBucketStub.returns(BbPromise.resolve());
      uploadObjectStub.returns(BbPromise.resolve());
      getFunctionStub.returns(BbPromise.resolve(undefined));
      updateFunctionStub.returns(BbPromise.resolve());
      createFunctionStub.returns(BbPromise.resolve());
      getApiGroupStub.returns(BbPromise.resolve(undefined));
      createApiGroupStub.returns(BbPromise.resolve(fullGroup));
      getApiRoleStub.returns(BbPromise.resolve(undefined));
      createApiRoleStub.returns(BbPromise.resolve(fullRole));
      getPoliciesStub.returns(BbPromise.resolve([]));
      createPolicyStub.returns(BbPromise.resolve(role.Policies[0]));
      getApisStub.returns(BbPromise.resolve([]));
      updateApiStub.returns(BbPromise.resolve());
      createApiStub.onCall(0).returns(BbPromise.resolve(fullApis[0]));
      createApiStub.onCall(1).returns(BbPromise.resolve(fullApis[1]));
      deployApiStub.returns(BbPromise.resolve());

      return aliyunDeploy.hooks['before:deploy:deploy']()
        .then(() => aliyunDeploy.hooks['deploy:deploy']())
        .then(() => {
          const logs = [
            'Creating service my-service-dev...',
            'Created service my-service-dev',
            'Creating bucket sls-my-service...',
            'Created bucket sls-my-service',
            'Uploading serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip to OSS bucket sls-my-service...',
            'Uploaded serverless/my-service/dev/1499930388523-2017-07-13T07:19:48.523Z/my-service.zip to OSS bucket sls-my-service',
            'Creating function my-service-dev-currentTime...',
            'Created function my-service-dev-currentTime',
            'Creating function my-service-dev-currentTime2...',
            'Created function my-service-dev-currentTime2',
            'Creating API group my-service-dev-api...',
            'Created API group my-service-dev-api',
            'Creating RAM role SLSFCInvocationFromAPIGateway...',
            'Created RAM role SLSFCInvocationFromAPIGateway',
            'Attaching RAM policy AliyunFCInvocationAccess to SLSFCInvocationFromAPIGateway...',
            'Attached RAM policy AliyunFCInvocationAccess to SLSFCInvocationFromAPIGateway',
            'Creating API sls-http-my-service-dev-currentTime...',
            'Created API sls-http-my-service-dev-currentTime',
            'Creating API sls-http-my-service-dev-currentTime2...',
            'Created API sls-http-my-service-dev-currentTime2',
            'Deploying API sls-http-my-service-dev-currentTime...',
            'Deployed API sls-http-my-service-dev-currentTime',
            'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-hangzhou.alicloudapi.com/ping -> my-service-dev.my-service-dev-currentTime',
            'Deploying API sls-http-my-service-dev-currentTime2...',
            'Deployed API sls-http-my-service-dev-currentTime2',
            'GET http://523e8dc7bbe04613b5b1d726c2a7889d-cn-hangzhou.alicloudapi.com/ping2 -> my-service-dev.my-service-dev-currentTime2'
          ];
          for (var i = 0; i < consoleLogStub.callCount; ++i) {
            expect(consoleLogStub.getCall(i).args[0]).toEqual(logs[i]);
          }
        });
    });

    // it('should handle existing service ', () => {
    //   const serviceId = new Date().getTime().toString(16);
    //   getServiceStub.returns(BbPromise.resolve({ serviceId }));
    //   createServiceStub.returns(BbPromise.resolve({ serviceId }));
    //   getBucketStub.returns(BbPromise.resolve({
    //     name: 'sls-my-service',
    //     region: 'cn-hangzhou'
    //   }));
    //   createBucketStub.returns(BbPromise.resolve());
    //   resetOssClientStub.returns();

    //   return aliyunDeploy.setupService().then(() => {
    //     expect(getServiceStub.calledOnce).toEqual(true);
    //     expect(getServiceStub.calledWithExactly('my-service-dev')).toEqual(true);

    //     expect(createServiceStub.called).toEqual(false);

    //     expect(getBucketStub.calledAfter(getServiceStub)).toEqual(true);
    //     expect(getBucketStub.calledOnce).toEqual(true);
    //     expect(getBucketStub.calledWithExactly('sls-my-service')).toEqual(true);

    //     expect(createBucketStub.calledOnce).toEqual(false);

    //     expect(resetOssClientStub.calledAfter(getBucketStub)).toEqual(true);
    //     expect(resetOssClientStub.calledOnce).toEqual(true);
    //     expect(resetOssClientStub.calledWithExactly('sls-my-service')).toEqual(true);

    //     expect(consoleLogStub.calledTwice).toEqual(true);
    //     expect(consoleLogStub.calledWithExactly('Service my-service-dev already exists.')).toEqual(true);
    //     expect(consoleLogStub.calledWithExactly('Bucket sls-my-service already exists.')).toEqual(true);
    //   });
    // });
  });
});
