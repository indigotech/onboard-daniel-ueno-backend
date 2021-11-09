import { setup } from '../setup';

before(async () => {
  await setup();
});

// require('./hello-world.test');
require('./create-user.test');
// require('./user-query.test');
// require('./login.test');
