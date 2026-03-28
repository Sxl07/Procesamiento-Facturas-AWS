#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PlatformBaseStack } from '../lib/stacks/platform-base-stack';
import { commonTags } from '../lib/config/tags';

const app = new cdk.App();

new PlatformBaseStack(app, 'InvoiceAiPlatformDevStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: commonTags,
});