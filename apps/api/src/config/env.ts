export type ApiEnv = {
  port: number;
  cognitoRegion?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  cognitoIssuer?: string;
  cognitoJwksUrl?: string;
  corsOrigins: string[];
  corsAllowCredentials: boolean;
};

let cached: ApiEnv | null = null;

export function getEnv(force = false): ApiEnv {
  if (cached && !force) {
    return cached;
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsAllowCredentials = process.env.CORS_ALLOW_CREDENTIALS
    ? process.env.CORS_ALLOW_CREDENTIALS === 'true'
    : true;

  const cognitoRegion = process.env.COGNITO_REGION;
  const cognitoUserPoolId = process.env.COGNITO_USER_POOL_ID;
  const cognitoClientId = process.env.COGNITO_CLIENT_ID;

  let cognitoIssuer: string | undefined;
  let cognitoJwksUrl: string | undefined;

  if (cognitoRegion && cognitoUserPoolId) {
    cognitoIssuer = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}`;
    cognitoJwksUrl = `${cognitoIssuer}/.well-known/jwks.json`;
  }

  if (!cognitoRegion || !cognitoUserPoolId) {
    throw new Error('COGNITO_REGION and COGNITO_USER_POOL_ID are required');
  }
  if (!cognitoClientId) {
    throw new Error('COGNITO_CLIENT_ID is required');
  }
  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set');
  }

  cached = {
    port,
    cognitoRegion,
    cognitoUserPoolId,
    cognitoClientId,
    cognitoIssuer,
    cognitoJwksUrl,
    corsOrigins,
    corsAllowCredentials,
  };

  return cached;
}

export function validateEnv() {
  getEnv(true);
}
