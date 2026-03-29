import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { EnvironmentConfig } from '../config/environments';

export interface PlatformBaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class PlatformBaseStack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;
  public readonly invoicesBucket: s3.Bucket;
  public readonly auditLogsBucket: s3.Bucket;
  public readonly trail: cloudtrail.Trail;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: PlatformBaseStackProps) {
    super(scope, id, props);

    const { config } = props;
    const parameterBasePath = `/invoice-ai-platform/${config.environmentName}`;

    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName:
        this.account && this.region
          ? `${config.resourcePrefix}-frontend-${this.account}-${this.region}`
          : undefined,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    this.invoicesBucket = new s3.Bucket(this, 'InvoicesBucket', {
      bucketName:
        this.account && this.region
          ? `${config.resourcePrefix}-docs-${this.account}-${this.region}`
          : undefined,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    this.auditLogsBucket = new s3.Bucket(this, 'AuditLogsBucket', {
      bucketName:
        this.account && this.region
          ? `${config.resourcePrefix}-audit-logs-${this.account}-${this.region}`
          : undefined,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const trailName = `${config.resourcePrefix}-trail`;

    this.trail = new cloudtrail.Trail(this, 'PlatformAuditTrail', {
      trailName,
      bucket: this.auditLogsBucket,
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
    });

    this.userPool = new cognito.UserPool(this, 'InvoiceAiUserPool', {
      userPoolName: `${config.resourcePrefix}-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'InvoiceAiWebClient', {
      userPool: this.userPool,
      userPoolClientName: `${config.resourcePrefix}-web-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    new cognito.CfnUserPoolGroup(this, 'InvoiceAdminsGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'invoice-admins',
      description: 'Administrative users for the Invoice AI Platform',
    });

    new cognito.CfnUserPoolGroup(this, 'InvoiceUsersGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'invoice-users',
      description: 'Standard users for the Invoice AI Platform',
    });

    new ssm.StringParameter(this, 'EnvironmentNameParameter', {
      parameterName: `${parameterBasePath}/platform/environment-name`,
      stringValue: config.environmentName,
      description: 'Active environment name for the Invoice AI Platform',
    });

    new ssm.StringParameter(this, 'AwsRegionParameter', {
      parameterName: `${parameterBasePath}/platform/aws-region`,
      stringValue: config.awsRegion,
      description: 'Primary AWS region for the Invoice AI Platform environment',
    });

    new ssm.StringParameter(this, 'FrontendBucketNameParameter', {
      parameterName: `${parameterBasePath}/s3/frontend-bucket-name`,
      stringValue: this.frontendBucket.bucketName,
      description: 'Main S3 bucket name for frontend static assets',
    });

    new ssm.StringParameter(this, 'DocumentsBucketNameParameter', {
      parameterName: `${parameterBasePath}/s3/documents-bucket-name`,
      stringValue: this.invoicesBucket.bucketName,
      description: 'Main S3 bucket name for invoice documents',
    });

    new ssm.StringParameter(this, 'AuditLogsBucketNameParameter', {
      parameterName: `${parameterBasePath}/s3/audit-logs-bucket-name`,
      stringValue: this.auditLogsBucket.bucketName,
      description: 'S3 bucket name for audit and CloudTrail logs',
    });

    new ssm.StringParameter(this, 'CloudTrailNameParameter', {
      parameterName: `${parameterBasePath}/cloudtrail/trail-name`,
      stringValue: trailName,
      description: 'CloudTrail name for the Invoice AI Platform environment',
    });

    new ssm.StringParameter(this, 'UserPoolIdParameter', {
      parameterName: `${parameterBasePath}/cognito/user-pool-id`,
      stringValue: this.userPool.userPoolId,
      description: 'Cognito User Pool ID for the Invoice AI Platform',
    });

    new ssm.StringParameter(this, 'UserPoolClientIdParameter', {
      parameterName: `${parameterBasePath}/cognito/user-pool-client-id`,
      stringValue: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for the Invoice AI Platform',
    });

    new cdk.CfnOutput(this, 'EnvironmentName', {
      value: config.environmentName,
      description: 'Ambiente activo de la stack',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'Nombre del bucket principal del frontend',
    });

    new cdk.CfnOutput(this, 'InvoicesBucketName', {
      value: this.invoicesBucket.bucketName,
      description: 'Nombre del bucket principal de documentos',
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: this.auditLogsBucket.bucketName,
      description: 'Nombre del bucket de logs de auditoria',
    });

    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: trailName,
      description: 'Nombre del trail de auditoria',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'AwsRegion', {
      value: cdk.Stack.of(this).region,
      description: 'Region donde se sintetiza o despliega la stack',
    });
  }
}