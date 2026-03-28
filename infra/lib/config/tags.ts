import { EnvironmentConfig } from './environments';

export function buildCommonTags(config: EnvironmentConfig): Record<string, string> {
  return {
    Project: 'InvoiceAiPlatform',
    Environment: config.environmentName,
    Owner: config.owner,
    DataClassification: config.dataClassification,
    ManagedBy: config.managedBy,
  };
}