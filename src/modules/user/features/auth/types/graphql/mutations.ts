import { gql, TypedDocumentNode } from '@apollo/client';

import { CreateUserInput, CreateUserResponse } from '@/modules/user/features/auth/types/graphql/types';

const CREATE_USER: TypedDocumentNode<CreateUserResponse, { input: CreateUserInput }> = gql`
  mutation CreateUser($input: createUserInput!) {
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
