import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class PlatformBaseStack extends cdk.Stack {
  public readonly invoicesBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.invoicesBucket = new s3.Bucket(this, 'InvoicesBucket', {
      bucketName:
        this.account && this.region
          ? `invoice-ai-platform-docs-${this.account}-${this.region}`
          : undefined,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    new cdk.CfnOutput(this, 'InvoicesBucketName', {
      value: this.invoicesBucket.bucketName,
      description: 'Nombre del bucket principal de documentos',
    });

    new cdk.CfnOutput(this, 'AwsRegion', {
      value: cdk.Stack.of(this).region,
      description: 'Region donde se sintetiza o despliega la stack',
    });
  }
}