import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';
import { HashManager } from '../services';

const query = `
    mutation createUser($data: UserInput!) {
      createUser(data: $data) {
        id
        name
        email
      }
    }`;

async function createUserMutation(variables: any, token: string) {
  return request('localhost:4001')
    .post('/')
    .send({ query, variables: { data: variables } })
    .set({ Authorization: token });
}

const validToken: string = jwt.sign({ id: 1 }, process.env.JWT_KEY, {
  expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
});

describe('create-user test', function () {
  it('should give an error if password is not valid', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456' };
    const expectedResponse = { message: 'wrong password format', code: 400 };
    const response = await createUserMutation(variables, validToken);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if email is not valid', async function () {
    const variables = { email: 'daniel.email.cm', name: 'daniel', password: '123456a' };
    const expectedResponse = { message: 'e-mail or password not correct', code: 400 };
    const response = await createUserMutation(variables, validToken);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should create user,saving it at database and return user name and email at response', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const expectedResponse = variables;
    const response = await createUserMutation(variables, validToken);

    const userRepository = getRepository(User);
    const savedUser = await userRepository.findOne({ email: response.body.data.createUser.email });
    const hashManager = new HashManager();
    const isPasswordCorrect = await hashManager.compare(variables.password, savedUser.password);

    await userRepository.delete(savedUser);

    expect(Number(response.body.data.createUser.id)).to.be.equal(savedUser.id);
    expect(savedUser.name).to.equal(expectedResponse.name);
    expect(savedUser.email).to.equal(expectedResponse.email);
    expect(isPasswordCorrect).to.equal(true);
    expect(savedUser.password).to.not.equal(variables.password);
    expect(response.body.data.createUser.name).to.equal(expectedResponse.name);
    expect(response.body.data.createUser.email).to.equal(expectedResponse.email);
  });

  it('should give an error if user is already created', async function () {
    const userRepository = getRepository(User);
    const hashManager = new HashManager();
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const hashPassword = await hashManager.hash(variables.password);

    const testUser = new User();
    testUser.name = variables.name;
    testUser.email = variables.email;
    testUser.password = hashPassword;
    await userRepository.save(testUser);

    const expectedResponse = { message: 'email already exists', code: 409 };
    const response = await createUserMutation(variables, validToken);

    await userRepository.delete(testUser);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });
});
