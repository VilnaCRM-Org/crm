const getGraphQLUrl = (): string => {
  const url = process.env.REACT_APP_GRAPHQL_URL;

  if (process.env.NODE_ENV === 'production' && !url) {
    throw new Error(
      'REACT_APP_GRAPHQL_URL must be defined in production environment. Cannot default to localhost.'
    );
  }

  return url || 'http://localhost:4000/graphql';
};

export default getGraphQLUrl;
