import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Test } from '../wrappers/Test';
import '@ton/test-utils';

describe('Test', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let test: SandboxContract<Test>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        test = blockchain.openContract(await Test.fromInit(0n, 'info'));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await test.send(
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
            to: test.address,
            deploy: true,
            success: true,
        });
        console.log('deployed address', test.address);
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and test are ready to use
    });
    it.skip('should get ctx value', async () => {
        const result = await test.send(
            deployer.getSender(),
            {
                value: toNano('5'),
            },
            {
                $$type: 'TestCtxValue',
                str: 'test',
            }
        );
        const value = await test.getValue();
        console.log('ctx value', value);
    });

    it('should get transfet value', async () => {
        const result = await test.send(
            deployer.getSender(),
            {
                value: toNano('5'),
            },
            {
                $$type: 'TestCtxValue',
                str: 'test',
            }
        );
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: test.address,
            success: true,
        });
        const value = await test.getValue();
        console.log('transfer value', value);
        const str = await test.getStr();
        console.log('transfer str', str);
        const sender = await test.getSender();
        console.log('transfer sender', sender);
    });
});
