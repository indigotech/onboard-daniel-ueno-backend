import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';

async function query(variables: any, token: string) {
  const query = `
    query Query($data: UserQuery!) {
      user(data: $data) {
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

describe('create-user test', function () {
  it('should give an error if password is not valid', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456' };
    const expectedResponse = { message: 'wrong password format', code: 400 };
    const response = await query(variables, validToken);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if email is not valid', async function () {
    const variables = { email: 'daniel.email.cm', name: 'daniel', password: '123456a' };
    const expectedResponse = { message: 'wrong email format', code: 400 };
    const response = await query(variables, validToken);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should create user,saving it at database and return user name and email at response', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const expectedResponse = variables;
    const response = await query(variables, validToken);

    const userRepository = getRepository(User);
    const savedUser = await userRepository.findOne({ email: response.body.data.createUser.email });

    expect(savedUser.id).to.be.a('number');
    expect(savedUser.name).to.equal(expectedResponse.name);
    expect(savedUser.email).to.equal(expectedResponse.email);
    expect(savedUser.password).to.be.a('string');
    expect(savedUser.password).to.not.equal(variables.password);

    expect(response.body.data.createUser.name).to.equal(expectedResponse.name);
    expect(response.body.data.createUser.email).to.equal(expectedResponse.email);
    await userRepository.delete(savedUser);
  });

  it('should give an error if user is already created', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    await query(variables, validToken);
    const expectedResponse = { message: 'email already exists', code: 409 };
    const response = await query(variables, validToken);

    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ email: variables.email });
    await userRepository.delete(user);
  });
});
