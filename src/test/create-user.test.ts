import { setup } from '../setup';
import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

before(() => {
  setup();
});

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
  it('password not validated', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456' };
    const expectedResponse = 'wrong password format';
    const response = await createUserMutation(variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse);
  });

  it('email not validated', async function () {
    const variables = { email: 'daniel.email.cm', name: 'daniel', password: '123456a' };
    const expectedResponse = 'wrong email format';
    const response = await createUserMutation(variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse);
  });

  it('user created', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const expectedResponse = variables;
    const response = await createUserMutation(variables);

    expect(response.body.data.createUser.name).to.equal(expectedResponse.name);
    expect(response.body.data.createUser.email).to.equal(expectedResponse.email);
  });

  it('error user already created', async function () {
    const variables = { email: 'daniel@email.com', name: 'daniel', password: '123456a' };
    const expectedResponse = 'email already exists';
    const response = await createUserMutation(variables);

    expect(response.body.errors[0].message).to.equal(expectedResponse);

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ email: variables.email });
    await userRepository.delete(user);
  });
});
