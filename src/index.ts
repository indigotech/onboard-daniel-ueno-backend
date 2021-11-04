import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { User } from './entity/User';

createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'testando123',
  password: 'senha123',
  database: 'database123',
  entities: [User],
  synchronize: true,
  logging: false,
});
