import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

async function createUserMutation(variables: any) {
  const query = `
    mutation createUser($data: UserInput!) {
      createUser(data: $data) {
        id
        name
        email
      }
    }`;
  return request('localhost:4001')
    .post('/')
    .send({ query, variables: { data: variables } });
}

describe('create-user test', function () {
  it('should give an error if password is not valid', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456' };
    const expectedResponse = 'wrong password format';
    const response = await createUserMutation(variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse);
  });

  it('should give an error if email is not valid', async function () {
    const variables = { email: 'daniel.email.cm', name: 'daniel', password: '123456a' };
    const expectedResponse = 'wrong email format';
    const response = await createUserMutation(variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse);
  });

  it('should create user,saving it at database and return user name and email at response', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const expectedResponse = variables;
    const response = await createUserMutation(variables);

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
    await createUserMutation(variables);
    const expectedResponse = 'email already exists';

    const response = await createUserMutation(variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse);

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ email: variables.email });
    await userRepository.delete(user);
  });
});
