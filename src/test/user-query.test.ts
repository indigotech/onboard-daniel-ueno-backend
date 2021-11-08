import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';

async function graphqlPost(type: 'query' | 'mutation', variables: any, token: string) {
  const query =
    type === 'query'
      ? `
    query Query($data: UserQuery!) {
      user(data: $data) {
        id
        name
        email
      }
    }`
      : `
    mutation createUser($data: UserInput!) {
      createUser(data: $data) {
        id
        name
        email
      }
    }`;
  return request('localhost:4001')
    .post('/')
    .send({ query, variables: { data: variables } })
    .set({ Authorization: token });
}

const validToken: string = jwt.sign({ id: 1 }, process.env.JWT_KEY, {
  expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
});

describe('user-query test', function () {
  it('should give an error if token is invalid', async function () {
    const variables = { id: 1 };
    const expectedResponse = { message: 'Invalid token', code: 401 };
    const response = await graphqlPost('query', variables, 'invalid token');

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if id is not valid', async function () {
    const variables = { id: 99999 };
    const expectedResponse = { message: 'user not found', code: 404 };
    const response = await graphqlPost('query', variables, validToken);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should get the correct data', async function () {
    const mutationVariables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const testUser = await graphqlPost('mutation', mutationVariables, validToken);

    const variables = { id: testUser.body.data.createUser.id };
    const expectedResponse = {
      user: {
        id: testUser.body.data.createUser.id,
        name: testUser.body.data.createUser.name,
        email: testUser.body.data.createUser.email,
      },
    };
    const response = await graphqlPost('query', variables, validToken);

    expect(response.body.data.user.id).to.equal(expectedResponse.user.id);
    expect(response.body.data.user.name).to.equal(expectedResponse.user.name);
    expect(response.body.data.user.email).to.equal(expectedResponse.user.email);

    const userRepository = getRepository(User);
    await userRepository.delete({ id: testUser.body.data.createUser.id });
  });
});
