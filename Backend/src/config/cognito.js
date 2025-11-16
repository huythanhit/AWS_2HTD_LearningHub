// src/config/cognito.js
// Cấu hình AWS Cognito client

import dotenv from 'dotenv';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

dotenv.config();

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

export { cognitoClient, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID };
