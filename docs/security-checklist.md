 # Security Checklist
.
 ## Context
 This document tracks the baseline security controls defined before Sprint 1 for the Invoice AI Platform project.
 Each control includes its current status and the next action required to reach the target state.
.
 ## 1. S3 Block Public Access
 **Requirement:** Enabled for storage buckets to prevent accidental public exposure.
.
 **Current status:** Implemented in infrastructure as code.
 The S3 buckets defined in AWS CDK use Block Public Access, disable public read access, and enforce SSL.
.
 **Next action:** Apply through deployment when the infrastructure is provisioned in AWS.
.
 **State:** Implemented in IaC, pending deployment.
.
 ## 2. S3 encryption for document storage
 **Requirement:** Document storage must use encryption at rest. If sensitive data is stored, SSE-KMS should be preferred.
.
 **Current status:** Base encryption is already enabled using SSE-S3 ^(S3 managed encryption^).
.
 **Next action:** Evaluate whether invoice documents will be treated as sensitive data and, if so, migrate the main document bucket to SSE-KMS.
.
 **State:** Partially implemented.
.
 ## 3. DynamoDB encryption
 **Requirement:** Operational data stored in DynamoDB must remain encrypted at rest.
.
 **Current status:** DynamoDB has not been created yet.
.
 **Next action:** Enable encryption explicitly when the first operational table is added through CDK.
.
 **State:** Pending implementation.
.
 ## 4. OpenSearch encryption and secure transport
 **Requirement:** OpenSearch must use encryption at rest, node-to-node encryption, and HTTPS. If fine-grained access control is enabled, those requirements must remain active.
.
 **Current status:** OpenSearch has not been created yet.
.
 **Next action:** Define those controls explicitly in CDK when the search layer is introduced.
.
 **State:** Pending implementation.
.
 ## 5. No secrets in source-controlled configuration
 **Requirement:** No credentials, tokens, or secrets should be stored in application.yml or other versioned configuration files.
.
 **Current status:** This decision has already been documented as part of the technical decisions baseline.
.
 **Next action:** Enforce this rule when Spring Boot and Lambda configuration files are created. Sensitive values must use Parameter Store, Secrets Manager, or environment-based secure injection.
.
 **State:** Decision defined, pending implementation in application components.
.
 ## 6. CloudTrail enabled
 **Requirement:** CloudTrail must record account activity for audit and governance purposes.
.
 **Current status:** CloudTrail and a dedicated audit logs bucket are already defined in AWS CDK.
.
 **Next action:** Deploy the stack so the trail becomes active in AWS.
.
 **State:** Implemented in IaC, pending deployment.
.
 ## 7. AWS Budget enabled
 **Requirement:** Budget monitoring with alerts must exist to control project costs.
.
 **Current status:** A monthly AWS Budget with alerts at 50%%, 80%%, and 100%% has already been configured manually.
.
 **Next action:** Keep the budget active and aligned with the project governance baseline.
.
 **State:** Implemented.
.
 ## 8. Structured logging in backend and Lambda functions
 **Requirement:** Application logs should follow a structured format to support observability, troubleshooting, and auditing.
.
 **Current status:** Backend and Lambda code have not been implemented yet.
.
 **Next action:** Define a structured logging standard for Spring Boot and Lambda workloads before application development grows.
.
 **State:** Pending implementation.
.
 ## Summary
.
 | Control | Status |
 | --- | --- |
 | S3 Block Public Access | Implemented in IaC, pending deployment |
 | S3 encryption baseline | Partially implemented |
 | DynamoDB encryption | Pending |
 | OpenSearch secure configuration | Pending |
 | No secrets in source-controlled files | Decision defined, pending implementation |
 | CloudTrail | Implemented in IaC, pending deployment |
 | AWS Budget | Implemented |
 | Structured logging | Pending |
.
 ## Conclusion
 The project already has a strong baseline in repository governance, infrastructure as code, audit readiness, and budget control.
 The next security-focused implementation steps are Parameter Store adoption in application components, encrypted operational storage, secure OpenSearch configuration, and structured application logging.
