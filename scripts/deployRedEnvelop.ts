import { toNano } from '@ton/core';
import { RedEnvelop } from '../wrappers/RedEnvelop';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const redEnvelop = provider.open(await RedEnvelop.fromInit());

    await redEnvelop.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(redEnvelop.address);

    // run methods on `redEnvelop`
}
