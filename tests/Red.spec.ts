import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Red } from '../wrappers/Red';
import '@ton/test-utils';

describe('Red', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let red: SandboxContract<Red>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        red = blockchain.openContract(await Red.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await red.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: red.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and red are ready to use
    });
});
