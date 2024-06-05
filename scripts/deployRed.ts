import { toNano } from '@ton/core';
import { Red } from '../wrappers/Red';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const red = provider.open(await Red.fromInit());

    await red.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(red.address);

    // run methods on `red`
}
