import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { EnvironmentConfig } from '../config/environments';

export interface PlatformBaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class PlatformBaseStack extends cdk.Stack {
  public readonly userPoolDomain: cognito.UserPoolDomain;
  public readonly frontendBucket: s3.Bucket;
  public readonly invoicesBucket: s3.Bucket;
  public readonly auditLogsBucket: s3.Bucket;
  public readonly trail: cloudtrail.Trail;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly invoiceMetadataTable: dynamodb.Table;

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
  cors: [
    {
      allowedMethods: [
        s3.HttpMethods.PUT,
        s3.HttpMethods.GET,
        s3.HttpMethods.HEAD,
      ],
      allowedOrigins: [
        'http://localhost:4200',
      ],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
      ],
      exposedHeaders: [
        'ETag',
      ],
      maxAge: 3000,
    },
  ],
});

    this.invoiceMetadataTable = new dynamodb.Table(this, 'InvoiceMetadataTable', {
  tableName: `${config.resourcePrefix}-invoice-metadata`,
  partitionKey: {
    name: 'invoiceId',
    type: dynamodb.AttributeType.STRING,
  },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecoverySpecification: {
  pointInTimeRecoveryEnabled: true,
},
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
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
  oAuth: {
    flows: {
      authorizationCodeGrant: true,
    },
    scopes: [
      cognito.OAuthScope.OPENID,
      cognito.OAuthScope.EMAIL,
      cognito.OAuthScope.PROFILE,
    ],
    callbackUrls: [
      'http://localhost:4200/auth/callback',
    ],
    logoutUrls: [
      'http://localhost:4200/',
    ],
  },
  supportedIdentityProviders: [
    cognito.UserPoolClientIdentityProvider.COGNITO,
  ],
});

this.userPoolDomain = new cognito.UserPoolDomain(this, 'InvoiceAiUserPoolDomain', {
  userPool: this.userPool,
  cognitoDomain: {
    domainPrefix: `${config.resourcePrefix}-auth-${this.account?.toLowerCase()}`,
  },
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

    new ssm.StringParameter(this, 'UserPoolDomainBaseUrlParameter', {
  parameterName: `${parameterBasePath}/cognito/domain-base-url`,
  stringValue: `https://${this.userPoolDomain.domainName}.auth.${config.awsRegion}.amazoncognito.com`,
  description: 'Cognito hosted UI domain base URL',
});

new ssm.StringParameter(this, 'FrontendCallbackUrlParameter', {
  parameterName: `${parameterBasePath}/cognito/frontend-callback-url`,
  stringValue: 'http://localhost:4200/auth/callback',
  description: 'Frontend callback URL for Cognito sign-in',
});

new ssm.StringParameter(this, 'FrontendLogoutUrlParameter', {
  parameterName: `${parameterBasePath}/cognito/frontend-logout-url`,
  stringValue: 'http://localhost:4200/',
  description: 'Frontend logout URL for Cognito sign-out',
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

    new ssm.StringParameter(this, 'InvoiceMetadataTableNameParameter', {
  parameterName: `${parameterBasePath}/dynamodb/invoice-metadata-table-name`,
  stringValue: this.invoiceMetadataTable.tableName,
  description: 'DynamoDB table name for invoice metadata',
});

new ssm.StringParameter(this, 'InvoicesUploadPrefixParameter', {
  parameterName: `${parameterBasePath}/s3/invoices-upload-prefix`,
  stringValue: 'incoming/',
  description: 'Base prefix for secure invoice uploads',
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

    new cdk.CfnOutput(this, 'UserPoolDomainBaseUrl', {
  value: `https://${this.userPoolDomain.domainName}.auth.${config.awsRegion}.amazoncognito.com`,
  description: 'Cognito hosted UI domain base URL',
});

new cdk.CfnOutput(this, 'InvoiceMetadataTableName', {
  value: this.invoiceMetadataTable.tableName,
  description: 'Nombre de la tabla DynamoDB de metadata de facturas',
});

new cdk.CfnOutput(this, 'InvoicesUploadPrefix', {
  value: 'incoming/',
  description: 'Prefijo base para uploads seguros de facturas',
});
  }
}