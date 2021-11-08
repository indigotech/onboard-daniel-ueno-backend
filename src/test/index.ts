import { setup } from '../setup';

before(async () => {
  await setup();
});

require('./hello-world.test');
