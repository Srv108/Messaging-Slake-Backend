import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { ExpressAdapter } from '@bull-board/express';

import mailQueue from '../queue/mailQueue.js';
import testQueue from '../queue/testQueue.js';

const bullServerAdapter = new ExpressAdapter();
bullServerAdapter.setBasePath('/ui');

createBullBoard({
    queues: [new BullAdapter(mailQueue), new BullAdapter(testQueue)],
    serverAdapter: bullServerAdapter
});

export default bullServerAdapter;
