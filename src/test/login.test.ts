import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/user';
import { Authenticator, HashManager } from '../services';

const query = `mutation Login($data: LoginInput!) {
  login(data: $data) {
    login {
      user {
        name
        id
        email
      }
      token
    }
  }
}`;

async function graphqlPost(variables: any) {
  return request('localhost:4001')
    .post('/')
    .send({ query, variables: { data: variables } });
}

describe('Login tests', function () {
  it('should give an error if password is not valid', async function () {
    const variables = { email: 'daniel@email.com', password: '123456', rememberMe: true };

    const response = await graphqlPost(variables);

    const expectedResponse = { message: 'wrong password format', code: 400 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if password does not match', async function () {
    const userRepository = getRepository(User);
    const hashManager = new HashManager();
    const variables = { email: 'daniel@email.com', password: '123456b', rememberMe: true };
    const testUserVariables = { name: 'daniel', email: 'daniel@email.com', password: '123456a' };
    const hashPassword = await hashManager.hash(testUserVariables.password);

    const testUser = new User();
    testUser.name = testUserVariables.name;
    testUser.email = testUserVariables.email;
    testUser.password = hashPassword;
    await userRepository.save(testUser);
    const response = await graphqlPost(variables);
    await userRepository.delete(testUser);

    const expectedResponse = { message: 'e-mail or password not correct', code: 401 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if email is not valid', async function () {
    const variables = { email: 'daniel.email.com', password: '123456a', rememberMe: true };

    const response = await graphqlPost(variables);

    const expectedResponse = { message: 'wrong email format', code: 400 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if cannot find email at database', async function () {
    const variables = { email: 'unknown@email.com', password: '123456a', rememberMe: true };

    const response = await graphqlPost(variables);

    const expectedResponse = { message: 'e-mail or password not correct', code: 401 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should get the correct data', async function () {
    const userRepository = getRepository(User);
    const hashManager = new HashManager();
    const variables = { email: 'daniel@email.com', password: '123456a', rememberMe: true };
    const testUserVariables = { name: 'daniel', email: 'daniel@email.com', password: '123456a' };
    const hashPassword = await hashManager.hash(testUserVariables.password);
    const authenticator = new Authenticator();

    const testUser = new User();
    testUser.name = testUserVariables.name;
    testUser.email = testUserVariables.email;
    testUser.password = hashPassword;
    await userRepository.save(testUser);

    const response = await graphqlPost(variables);
    const isTokenValid = authenticator.isTokenValid(String(response.body.data.login.login.token));
    await userRepository.delete(testUser);

    const expectedResponse = {
      login: {
        user: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email,
        },
        token: 'some string',
      },
    };
    expect(Number(response.body.data.login.login.user.id)).to.equal(expectedResponse.login.user.id);
    expect(response.body.data.login.login.user.name).to.equal(expectedResponse.login.user.name);
    expect(response.body.data.login.login.user.email).to.equal(expectedResponse.login.user.email);
    expect(isTokenValid).to.equal(true);
  });
});
