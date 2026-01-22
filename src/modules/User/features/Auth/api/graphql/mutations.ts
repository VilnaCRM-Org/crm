import { gql, TypedDocumentNode } from '@apollo/client';

import { CreateUserInput, CreateUserResponse } from '@/modules/User/features/Auth/api/graphql/types';

const CREATE_USER: TypedDocumentNode<CreateUserResponse, { input: CreateUserInput }> = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
        confirmed
        email
        initials
      }
      clientMutationId
    }
  }
`;

export default CREATE_USER;
