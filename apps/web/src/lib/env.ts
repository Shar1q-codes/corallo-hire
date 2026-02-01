export type WebEnv = {
  apiUrl: string;
  cognitoDomain: string;
  cognitoClientId: string;
  cognitoRedirectUri: string;
};

export function getEnv(): WebEnv {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const cognitoRedirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

  if (!cognitoDomain || !cognitoClientId || !cognitoRedirectUri) {
    throw new Error('Missing Cognito configuration');
  }

  return { apiUrl, cognitoDomain, cognitoClientId, cognitoRedirectUri };
}
