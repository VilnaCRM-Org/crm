import { GraphQLError } from 'graphql';

import { buildCreateUserInput, buildFullName } from '@tests/builders';

import { resolvers, clearUsers, __test__ } from '../../docker/apollo-server/lib/resolvers';
import { CreateUserInput } from '../../docker/apollo-server/lib/types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-1234'),
}));

describe('resolvers Mutation createUser', () => {
  beforeEach(() => {
    // Clear users map between tests
    clearUsers();
  });

  describe('successful user creation', () => {
    it('should create a user with valid input', async () => {
      const input: CreateUserInput = buildCreateUserInput();

      const result = await resolvers.Mutation.createUser(undefined, { input });

      expect(result).toEqual({
        user: {
          id: 'mocked-uuid-1234',
          confirmed: true,
          email: input.email,
          initials: input.initials,
        },
        clientMutationId: input.clientMutationId,
      });
    });

    it('should create multiple users with different emails', async () => {
      const input1: CreateUserInput = buildCreateUserInput();
      const input2: CreateUserInput = buildCreateUserInput();

      const result1 = await resolvers.Mutation.createUser(undefined, { input: input1 });
      const result2 = await resolvers.Mutation.createUser(undefined, { input: input2 });

      expect(result1.user.email).toBe(input1.email);
      expect(result2.user.email).toBe(input2.email);
    });
  });

  describe('email validation', () => {
    it('should throw error for missing email', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: '' });

      const promise = resolvers.Mutation.createUser(undefined, { input });
      await expect(promise).rejects.toThrow(GraphQLError);
      await expect(promise).rejects.toMatchObject({
        message: 'Invalid email format',
        extensions: {
          code: 'BAD_REQUEST',
          http: { status: 400 },
        },
      });
    });

    it('should throw error for invalid email format - missing @', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'invalidemail.com' });

      await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
        GraphQLError
      );
    });

    it('should throw error for invalid email format - missing domain', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'test@' });

      await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
        GraphQLError
      );
    });

    it('should throw error for invalid email format - invalid characters', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'test @example.com' });

      await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
        GraphQLError
      );
    });

    it('should accept valid email with special characters', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'test.user+tag@example.com' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.email).toBe('test.user+tag@example.com');
    });
  });

  describe('initials validation', () => {
    it('should throw error for missing initials', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: '' });

      const promise = resolvers.Mutation.createUser(undefined, { input });
      await expect(promise).rejects.toThrow(GraphQLError);
      await expect(promise).rejects.toMatchObject({
        message: 'Invalid initials',
        extensions: {
          code: 'BAD_REQUEST',
          http: { status: 400 },
        },
      });
    });

    it('should throw error for initials shorter than 2 characters', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: 'A' });

      await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toThrow(
        GraphQLError
      );
    });

    it('should accept initials with exactly 2 characters', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: 'AB' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.initials).toBe('AB');
    });

    it('should accept initials longer than 2 characters', async () => {
      const initials = buildFullName();
      const input: CreateUserInput = buildCreateUserInput({ initials });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.initials).toBe(initials);
    });
  });

  describe('duplicate email handling', () => {
    it('should throw error when creating user with duplicate email', async () => {
      const input: CreateUserInput = buildCreateUserInput();

      // First creation should succeed
      await resolvers.Mutation.createUser(undefined, { input });

      // Second creation with same email should fail
      const input2 = { ...input, clientMutationId: buildCreateUserInput().clientMutationId };
      const promise = resolvers.Mutation.createUser(undefined, { input: input2 });
      await expect(promise).rejects.toThrow(GraphQLError);
      await expect(promise).rejects.toMatchObject({
        message: 'Email already exists',
        extensions: {
          code: 'CONFLICT',
          http: { status: 409 },
        },
      });
    });

    it('should allow custom conflict metadata via rejectIfExists helper', () => {
      const map = new Map<string, string>();

      __test__.rejectIfExists(map, 'a', 'Custom message', 410, 'GONE');

      map.set('a', 'value');
      expect(() => __test__.rejectIfExists(map, 'a', 'Custom message', 410, 'GONE')).toThrow(
        expect.objectContaining({
          message: 'Custom message',
          extensions: expect.objectContaining({
            code: 'GONE',
            http: expect.objectContaining({ status: 410 }),
          }),
        })
      );
    });

    it('should use default conflict metadata when no overrides are provided', () => {
      const map = new Map<string, string>([['dup@example.com', 'existing']]);

      expect(() => __test__.rejectIfExists(map, 'dup@example.com')).toThrow(
        expect.objectContaining({
          message: 'Item already exists',
          extensions: expect.objectContaining({
            code: 'CONFLICT',
            http: expect.objectContaining({ status: 409 }),
          }),
        })
      );
    });
  });

  describe('user properties', () => {
    it('should set confirmed to true by default', async () => {
      const input: CreateUserInput = buildCreateUserInput();

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.confirmed).toBe(true);
    });

    it('should generate a unique ID for the user', async () => {
      const input: CreateUserInput = buildCreateUserInput();

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.id).toBe('mocked-uuid-1234');
    });

    it('should return clientMutationId in response', async () => {
      const input: CreateUserInput = buildCreateUserInput();

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.clientMutationId).toBe(input.clientMutationId);
    });
  });

  describe('validation order', () => {
    it('should validate email before checking duplicates', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'invalid-email' });

      await expect(resolvers.Mutation.createUser(undefined, { input })).rejects.toMatchObject({
        message: 'Invalid email format',
      });
    });

    it('should validate initials before checking duplicates', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: 'A' });

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

      const input: CreateUserInput = buildCreateUserInput();

      const promise = resolvers.Mutation.createUser(undefined, { input });
      await expect(promise).rejects.toThrow(GraphQLError);
      await expect(promise).rejects.toMatchObject({
        message: 'Internal Server Error: Failed to create user',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          http: {
            status: 500,
            headers: { 'x-error-type': 'server-error' },
          },
        },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create user:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should reject email with only spaces', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: '   ' });

      const promise = resolvers.Mutation.createUser(undefined, { input });
      await expect(promise).rejects.toThrow(GraphQLError);
      await expect(promise).rejects.toMatchObject({
        message: 'Invalid email format',
      });
    });

    it('should accept email with subdomain', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'user@mail.example.com' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.email).toBe('user@mail.example.com');
    });

    it('should accept email with numbers', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'user123@example456.com' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.email).toBe('user123@example456.com');
    });

    it('should accept email with consecutive dots (current regex allows this)', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'user..name@example.com' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.email).toBe('user..name@example.com');
    });

    it('should accept initials with only spaces if length >= 2 (current validation)', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: '   ' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.initials).toBe('   ');
    });

    it('should handle very long initials', async () => {
      const longInitials = 'A'.repeat(200);
      const input: CreateUserInput = buildCreateUserInput({ initials: longInitials });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.initials).toBe(longInitials);
    });

    it('should handle unicode characters in initials', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: 'Иван Петров' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.initials).toBe('Иван Петров');
    });

    it('should handle special characters in initials', async () => {
      const input: CreateUserInput = buildCreateUserInput({ initials: "O'Brien-Smith" });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.initials).toBe("O'Brien-Smith");
    });

    it('should handle email with hyphen in domain', async () => {
      const input: CreateUserInput = buildCreateUserInput({ email: 'user@ex-ample.com' });

      const result = await resolvers.Mutation.createUser(undefined, { input });
      expect(result.user.email).toBe('user@ex-ample.com');
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple users being created concurrently', async () => {
      const inputs = Array.from({ length: 5 }, () => buildCreateUserInput());

      const results = await Promise.all(
        inputs.map((input) => resolvers.Mutation.createUser(undefined, { input }))
      );

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.user.email).toBe(inputs[i].email);
        expect(result.user.initials).toBe(inputs[i].initials);
      });
    });
  });
});
