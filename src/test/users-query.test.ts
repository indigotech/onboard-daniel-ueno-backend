import * as request from 'supertest';
import { expect } from 'chai';
import { getRepository, Repository } from 'typeorm';
import { User } from '../entity/user';
import * as jwt from 'jsonwebtoken';
import { generateSeed } from '../seed';

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
describe('users-query test', function () {
  let userRepository: Repository<User>;
  let seedUsers;
  let totalCount: number;

  before(async () => {
    await generateSeed();
    userRepository = getRepository(User);
    const [users, count] = await userRepository.findAndCount({ order: { name: 'ASC' } });
    seedUsers = users.map((user) => {
      return { id: String(user.id), name: user.name, email: user.email };
    });
    totalCount = count;
  });
  after(async () => {
    await getRepository('User').clear();
  });

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

  it('should give an error if limit is not valid', async function () {
    const variables = { limit: -1 };

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = { message: 'limit must be higher than zero', code: 400 };
    expect(response.body.errors[0].message).to.equal(expectedResponse.message);
    expect(response.body.errors[0].extensions.exception.code).to.equal(expectedResponse.code);
  });

  it('should get the correct data, 1st page', async function () {
    const variables = { limit: 5, page: 1 };
    const page = variables.page;
    const take = variables.limit;
    const skip = take * (page - 1);
    const totalPage = Math.floor(totalCount / variables.limit);

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = {
      users: seedUsers.slice(skip, skip + take),
      page,
      totalPage,
      hasPreviousPage: false,
      hasNextPage: true,
    };
    expect(response.body.data.users).deep.equal(expectedResponse);
  });

  it('should get the correct data, page in the middle', async function () {
    const variables = { limit: 5, page: 5 };
    const page = variables.page;
    const take = variables.limit;
    const skip = take * (page - 1);
    const totalPage = Math.floor(totalCount / variables.limit);

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = {
      users: seedUsers.slice(skip, skip + take),
      page,
      totalPage,
      hasPreviousPage: true,
      hasNextPage: true,
    };
    expect(response.body.data.users).deep.equal(expectedResponse);
  });

  it('should get the correct data, last page', async function () {
    const variables = { limit: 5, page: 10 };
    const page = variables.page;
    const take = variables.limit;
    const skip = take * (page - 1);
    const totalPage = Math.floor(totalCount / variables.limit);

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = {
      users: seedUsers.slice(skip, skip + take),
      page,
      totalPage,
      hasPreviousPage: true,
      hasNextPage: false,
    };
    expect(response.body.data.users).deep.equal(expectedResponse);
  });

  it('should give an empty array if page is higher than the last page', async function () {
    const variables = { limit: 5, page: 11 };
    const page = variables.page;
    const take = variables.limit;
    const skip = take * (page - 1);
    const totalPage = Math.floor(totalCount / variables.limit);

    const response = await graphqlPost(variables, validToken);

    const expectedResponse = {
      users: seedUsers.slice(skip, skip + take + 1),
      page,
      totalPage,
      hasPreviousPage: true,
      hasNextPage: false,
    };
    expect(response.body.data.users).deep.equal(expectedResponse);
  });
});
