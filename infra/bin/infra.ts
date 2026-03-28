#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PlatformBaseStack } from '../lib/stacks/platform-base-stack';
import { buildCommonTags } from '../lib/config/tags';
import {
  EnvironmentName,
  environmentConfigs,
} from '../lib/config/environments';

const app = new cdk.App();

const environmentName = (app.node.tryGetContext('env') ?? 'dev') as EnvironmentName;
const config = environmentConfigs[environmentName];

if (!config) {
  throw new Error(
    `Invalid environment "${environmentName}". Allowed values: ${Object.keys(environmentConfigs).join(', ')}`
  );
}

new PlatformBaseStack(app, config.stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.awsRegion,
  },
  tags: buildCommonTags(config),
  config,
});