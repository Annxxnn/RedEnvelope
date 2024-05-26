import { toNano } from '@ton/core';
import { SampleJetton } from '../wrappers/SampleJetton';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const sampleJetton = provider.open(await SampleJetton.fromInit());

    await sampleJetton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(sampleJetton.address);

    // run methods on `sampleJetton`
}
