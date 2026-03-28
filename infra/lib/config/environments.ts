export type EnvironmentName = 'dev' | 'prod';

export interface EnvironmentConfig {
  environmentName: EnvironmentName;
  stackName: string;
  awsRegion: string;
  resourcePrefix: string;
  owner: string;
  dataClassification: string;
  managedBy: string;
}

export const environmentConfigs: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    environmentName: 'dev',
    stackName: 'InvoiceAiPlatformDevStack',
    awsRegion: 'us-east-1',
    resourcePrefix: 'invoice-ai-platform-dev',
    owner: 'Sebastian',
    dataClassification: 'Internal',
    managedBy: 'CDK',
  },
  prod: {
    environmentName: 'prod',
    stackName: 'InvoiceAiPlatformProdStack',
    awsRegion: 'us-east-1',
    resourcePrefix: 'invoice-ai-platform-prod',
    owner: 'Sebastian',
    dataClassification: 'Confidential',
    managedBy: 'CDK',
  },
};