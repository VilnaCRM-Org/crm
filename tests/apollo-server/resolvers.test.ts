import { GraphQLError } from 'graphql';

import { resolvers, clearUsers } from '../../docker/apollo-server/lib/resolvers';
import { CreateUserInput } from '../../docker/apollo-server/lib/types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('resolvers', () => {
  describe('Mutation', () => {
    describe('createUser', () => {
      beforeEach(() => {
        // Clear users map between tests
        clearUsers();
      });

      describe('successful user creation', () => {
        it('should create a user with valid input', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });

          expect(result).toEqual({
            user: {
              id: 'mocked-uuid-1234',
              confirmed: true,
              email: 'test@example.com',
              initials: 'John Doe',
            },
            clientMutationId: 'mutation-123',
          });
        });

        it('should create multiple users with different emails', async () => {
          const input1: CreateUserInput = {
            email: 'user1@example.com',
            initials: 'User One',
            clientMutationId: 'mutation-1',
          };

          const input2: CreateUserInput = {
            email: 'user2@example.com',
            initials: 'User Two',
            clientMutationId: 'mutation-2',
          };

          const result1 = await resolvers.Mutation.createUser(undefined, { input: input1 });
          const result2 = await resolvers.Mutation.createUser(undefined, { input: input2 });

          expect(result1.user.email).toBe('user1@example.com');
          expect(result2.user.email).toBe('user2@example.com');
        });
      });

      describe('email validation', () => {
        it('should throw error for missing email', async () => {
          const input = {
            email: '',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          } as CreateUserInput;

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );
          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toMatchObject({
            message: 'Invalid email format',
            extensions: {
              code: 'BAD_REQUEST',
              http: { status: 400 },
            },
          });
        });

        it('should throw error for invalid email format - missing @', async () => {
          const input: CreateUserInput = {
            email: 'invalidemail.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );
        });

        it('should throw error for invalid email format - missing domain', async () => {
          const input: CreateUserInput = {
            email: 'test@',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );
        });

        it('should throw error for invalid email format - invalid characters', async () => {
          const input: CreateUserInput = {
            email: 'test @example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );
        });

        it('should accept valid email with special characters', async () => {
          const input: CreateUserInput = {
            email: 'test.user+tag@example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });
          expect(result.user.email).toBe('test.user+tag@example.com');
        });
      });

      describe('initials validation', () => {
        it('should throw error for missing initials', async () => {
          const input = {
            email: 'test@example.com',
            initials: '',
            clientMutationId: 'mutation-123',
          } as CreateUserInput;

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );
          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toMatchObject({
            message: 'Invalid initials',
            extensions: {
              code: 'BAD_REQUEST',
              http: { status: 400 },
            },
          });
        });

        it('should throw error for initials shorter than 2 characters', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'A',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );
        });

        it('should accept initials with exactly 2 characters', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'AB',
            clientMutationId: 'mutation-123',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });
          expect(result.user.initials).toBe('AB');
        });

        it('should accept initials longer than 2 characters', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'John Doe Smith',
            clientMutationId: 'mutation-123',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });
          expect(result.user.initials).toBe('John Doe Smith');
        });
      });

      describe('duplicate email handling', () => {
        it('should throw error when creating user with duplicate email', async () => {
          const input: CreateUserInput = {
            email: 'duplicate@example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-1',
          };

          // First creation should succeed
          await resolvers.Mutation.createUser(undefined, { input });

          // Second creation with same email should fail
          const input2 = { ...input, clientMutationId: 'mutation-2' };
          await expect(resolvers.Mutation.createUser(undefined, { input: input2 })).rejects.toThrow(
            GraphQLError
          );
          await expect(
            resolvers.Mutation.createUser(undefined, { input: input2 })
          ).rejects.toMatchObject({
            message: 'Email already exists',
            extensions: {
              code: 'BAD_REQUEST',
              http: { status: 409 },
            },
          });
        });
      });

      describe('user properties', () => {
        it('should set confirmed to true by default', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });
          expect(result.user.confirmed).toBe(true);
        });

        it('should generate a unique ID for the user', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });
          expect(result.user.id).toBe('mocked-uuid-1234');
        });

        it('should return clientMutationId in response', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'John Doe',
            clientMutationId: 'custom-mutation-id',
          };

          const result = await resolvers.Mutation.createUser(undefined, { input });
          expect(result.clientMutationId).toBe('custom-mutation-id');
        });
      });

      describe('validation order', () => {
        it('should validate email before checking duplicates', async () => {
          const input: CreateUserInput = {
            email: 'invalid-email',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toMatchObject({
            message: 'Invalid email format',
          });
        });

        it('should validate initials before checking duplicates', async () => {
          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'A',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toMatchObject({
            message: 'Invalid initials',
          });
        });
      });

      describe('error handling in catch block', () => {
        it('should handle unexpected errors during user creation', async () => {
          const uuid = require('uuid');
          const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

          // Mock uuid to throw an error
          uuid.v4.mockImplementationOnce(() => {
            throw new Error('UUID generation failed');
          });

          const input: CreateUserInput = {
            email: 'test@example.com',
            initials: 'John Doe',
            clientMutationId: 'mutation-123',
          };

          await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
            GraphQLError
          );

          expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create user:', expect.any(Error));

          consoleErrorSpy.mockRestore();
        });
      });
    });
  });
});
