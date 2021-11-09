import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import * as jwt from 'jsonwebtoken';

const query = `
query Users($data: UsersQuery!) {
  users(data: $data) {
    users {
      name
      id
      email
    }
    page
    totalPage
    hasPreviousPage
    hasNextPage
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
    const variables = {};

    const response = await graphqlPost(variables, 'invalid token');

    const expectedResponse = { message: 'Invalid token', code: 401 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if page is negative', async function () {
    const variables = { page: -1 };

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = { message: 'page must not be negative', code: 400 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if page is higher than the last page', async function () {
    const userRepository = getRepository(User);
    const variables = { page: 10, limit: 25 };
    const count = await userRepository.count();
    const totalPage = Math.floor(count / variables.limit);

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = { message: `page must be between 1 and ${totalPage}`, code: 400 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should give an error if limit is not valid', async function () {
    const variables = { limit: -1 };

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = { message: 'limit must not be negative', code: 400 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should get the correct data', async function () {
    const userRepository = getRepository(User);
    const variables = { limit: 5, page: 1 };
    const page = variables.page ?? 1;
    const take = variables.limit ?? 10;
    const skip = take * (page - 1);
    const [users, count] = await userRepository.findAndCount({ order: { name: 'ASC' }, skip, take });
    const totalPage = Math.floor(count / variables.limit);

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = {
      users: users.map((user) => {
        return { id: String(user.id), name: user.name, email: user.email };
      }),
      page,
      totalPage,
      hasPreviousPage: false,
      hasNextPage: true,
    };
    expect(response.body.data.users.users).deep.equal(expectedResponse.users);
    expect(response.body.data.users.page).to.equal(expectedResponse.page);
    expect(response.body.data.users.hasPreviousPage).to.equal(expectedResponse.hasPreviousPage);
    expect(response.body.data.users.hasNextPage).to.equal(expectedResponse.hasNextPage);
  });
});
