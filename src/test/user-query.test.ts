import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';
import { HashManager } from '../services';

const query = `
  query Query($data: UserQuery!) {
    user(data: $data) {
      id
      name
      email
    }
  }`;

async function graphqlPost(variables: any, token: string) {
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

    const response = await graphqlPost(variables, 'invalid token');

    const expectedResponse = { message: 'Invalid token', code: 401 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if id is not valid', async function () {
    const variables = { id: 99999 };

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = { message: 'user not found', code: 404 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should get the correct data', async function () {
    const userRepository = getRepository(User);
    const hashManager = new HashManager();
    const testUserVariables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const hashPassword = await hashManager.hash(testUserVariables.password);

    const testUser = new User();
    testUser.name = testUserVariables.name;
    testUser.email = testUserVariables.email;
    testUser.password = hashPassword;
    await userRepository.save(testUser);
    const variables = { id: testUser.id };
    const response = await graphqlPost(variables, validToken);
    await userRepository.delete({ id: testUser.id });

    const expectedResponse = {
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
      },
    };
    expect(Number(response.body.data.user.id)).to.equal(expectedResponse.user.id);
    expect(response.body.data.user.name).to.equal(expectedResponse.user.name);
    expect(response.body.data.user.email).to.equal(expectedResponse.user.email);
  });
});
