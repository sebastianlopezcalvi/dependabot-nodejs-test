import type { AWS, AwsLambdaRuntime } from '@serverless/typescript';
import { description, name, version } from './package.json';
import { apiGatewayResources } from './resources/apigateway/serverless';
import { models } from './resources/models/models';
import { reportingResources } from './resources/reporting/serverless';
import { migrationsHandler } from './src/db-migrations/serverless';
import { statusHandler } from './src/v1/handlers/status/serverless';

export const tags = {
  'mon:owner': '${env:OWNER}',
  'mon:cost-center': '${env:COST_CENTER}',
  'mon:project': '${env:PROJECT}',
  'mon:env': '${opt:env, env:ENV, "local"}',
  'mon:regulated': '${env:REGULATED}',
  'mon:data-classification': '${env:DATA_CLASSIFICATION}',
  'mon:team': 'athena',
};

const serverlessConfiguration: AWS = {
  service: '<API_NAME>',
  frameworkVersion: '3',
  useDotenv: true,
  plugins: [
    'serverless-middleware', // must be first
    'serverless-plugin-typescript', // must precede serverless offline
    'serverless-aws-documentation',
    'serverless-dotenv-plugin',
    'serverless-domain-manager',
    'serverless-plugin-include-dependencies',
    'serverless-plugin-common-excludes',
    'serverless-prune-plugin',
    'serverless-plugin-datadog',
    'serverless-offline',
  ],
  custom: {
    stages: ['local', 'dev', 'non-prod'],
    aws_account: '${opt:aws_account, env:AWS_ACCOUNT}',
    customAuthorizer: {
      name: 'obp-lambda-multi-authorizer-${self:provider.stage}',
      type: 'request',
      resultTtlInSeconds: 0,
      arn: 'arn:aws:lambda:${self:provider.region}:${self:custom.aws_account}:function:obp-lambda-multi-authorizer-${self:provider.stage}-func',
    },
    datadog: { flushMetricsToLogs: true, forwarder: '${env:DATADOG_FORWARDER}' },
    gluePostgresDatabaseName: 'obp-dmp-postgres-db',
    glueParquetDatabaseName: 'obp_dmp_parquet',
    customDomain: {
      domainName: '${self:provider.stage}.api.obp.agro.services',
      basePath: '<BASE_PATH>',
      certificateName: '*.api.obp.agro.services',
      stage: '${self:provider.stage}',
      createRoute53Record: false,
      endpointType: 'regional',
    },
    prune: { automatic: true, number: 2 },
    middleware: { cleanFolder: false, pre: ['src/middleware/configuration.configure'] },
    documentation: {
      api: { info: { version, title: name, description } },
      authorizers: [{ name: '${self:custom.customAuthorizer.name}' }],
      models,
    },
    // GLUE STUFF
    local_tablePrefix: 'local',
    dev_tablePrefix: 'dev',
    'non-prod_tablePrefix': 'non_prod',
    prod_tablePrefix: 'prod',
    local_parquetDatabase: 'obp_dmp_parquet',
    dev_parquetDatabase: 'obp_dmp_parquet_dev',
    'non-prod_parquetDatabase': 'obp_dmp_parquet',
    prod_parquetDatabase: 'obp_dmp_parquet',
    crawlerDbPath: 'DB_NAME',
    glue_role: '${opt:glue_role, env:GLUE_ROLE}',
    parquet_file_location: '${opt:parquet_file_location, env:PARQUET_FILE_LOCATION}',
    glue_job_location: '${opt:glue_job_location, env:GLUE_JOB_LOCATION}',
    reporting_bucket: '${opt:reporting_bucket, env:REPORTING_BUCKET}',
    reporting_data_prefix: '${opt:reporting_data_prefix, env:REPORTING_DATA_PREFIX}',
  },
  provider: {
    name: 'aws',
    runtime: "${env:NODE_RUNTIME, 'nodejs16.x'}" as AwsLambdaRuntime,
    stage: "${opt:stage, env:STAGE, 'local'}",
    environment: {
      VAULT_ROLE_ID: '${env:VAULT_ROLE_ID}',
      VAULT_URL: '${env:VAULT_URL, self:custom.environment.VAULT_URL}',
      VAULT_API: '${env:VAULT_API, self:custom.environment.VAULT_API}',
      VAULT_PATH: '${env:VAULT_PATH, self:custom.environment.VAULT_PATH}',
      ENVIRONMENT: '${self:provider.stage}',
    },
    deploymentBucket: { name: '${opt:deployment_bucket, env:DEPLOYMENT_BUCKET}' },
    iam: { role: 'arn:aws:iam::${self:custom.aws_account}:role/${opt:lambda_role, env:LAMBDA_ROLE}' },
    region: "${opt:region, env:REGION, 'local'}" as 'us-east-1',
    tags,
    apiGateway: {
      shouldStartNameWithService: true,
    },
    vpc: {
      subnetIds: ['${opt:subnet_id_1, env:SUBNET_ID_1}', '${opt:subnet_id_2, env:SUBNET_ID_2}'],
      securityGroupIds: ['${opt:cache_security_group_id, env:CACHE_SECURITY_GROUP_ID}'],
    },
    tracing: { lambda: true },
  },
  package: {
    excludeDevDependencies: true,
    patterns: ['src/**', '!.idea/**', '!.dockerignore', '!.env', '!Dockerfile', '!README.MD', '!src/**/*.spec.js'],
  },
  functions: {
    ...migrationsHandler,
    ...statusHandler,
  },
  resources: {
    Resources: {
      ...apiGatewayResources,
      ...reportingResources,
    },
  },
};

module.exports = serverlessConfiguration;
