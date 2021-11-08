import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';

async function graphqlPost(type: 'login' | 'createUser', variables: any, token?: string) {
  const query =
    type === 'login'
      ? `mutation Login($data: LoginInput!) {
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
}`
      : `
    mutation createUser($data: UserInput!) {
      createUser(data: $data) {
        id
        name
        email
      }
    }`;

  return token
    ? request('localhost:4001')
        .post('/')
        .send({ query, variables: { data: variables } })
        .set({ Authorization: token })
    : request('localhost:4001')
        .post('/')
        .send({ query, variables: { data: variables } });
}

const validToken: string = jwt.sign({ id: 1 }, process.env.JWT_KEY, {
  expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
});

describe('Login tests', function () {
  it('should give an error if password is not valid', async function () {
    const variables = { email: 'daniel@email.com', password: '123456', rememberMe: true };
    const expectedResponse = { message: 'wrong password format', code: 400 };
    const response = await graphqlPost('login', variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if password does not match', async function () {
    const createUserVariables = { name: 'daniel', email: 'daniel@email.com', password: '123456a' };
    const testUser = await graphqlPost('createUser', createUserVariables, validToken);
    const { id } = testUser.body.data.createUser;
    const variables = { email: 'daniel@email.com', password: '123456b', rememberMe: true };
    const expectedResponse = { message: 'e-mail or password not correct', code: 401 };
    const response = await graphqlPost('login', variables);

    const userRepository = getRepository(User);
    await userRepository.delete({ id });

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if email is not valid', async function () {
    const variables = { email: 'daniel.email.com', password: '123456a', rememberMe: true };
    const expectedResponse = { message: 'wrong email format', code: 400 };
    const response = await graphqlPost('login', variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if cannot find email at database', async function () {
    const variables = { email: 'unknown@email.com', password: '123456a', rememberMe: true };
    const expectedResponse = { message: 'e-mail or password not correct', code: 401 };
    const response = await graphqlPost('login', variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should get the correct data', async function () {
    const createUserVariables = { name: 'daniel', email: 'daniel@email.com', password: '123456a' };
    const testUser = await graphqlPost('createUser', createUserVariables, validToken);

    const variables = { email: 'daniel@email.com', password: '123456a', rememberMe: true };
    const expectedResponse = {
      login: {
        user: {
          id: testUser.body.data.createUser.id,
          name: testUser.body.data.createUser.name,
          email: testUser.body.data.createUser.email,
        },
        token: 'some string',
      },
    };

    const response = await graphqlPost('login', variables);

    const userRepository = getRepository(User);
    await userRepository.delete({ id: testUser.body.data.createUser.id });

    expect(response.body.data.login.login.user.id).to.equal(expectedResponse.login.user.id);
    expect(response.body.data.login.login.user.name).to.equal(expectedResponse.login.user.name);
    expect(response.body.data.login.login.user.email).to.equal(expectedResponse.login.user.email);
    expect(response.body.data.login.login.token).to.be.a('string');
  });
});
