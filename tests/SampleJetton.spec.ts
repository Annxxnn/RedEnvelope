import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { SampleJetton } from '../wrappers/SampleJetton';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
const jettonParams = {
    name: "test xx",
    description: "This is the first jetton from live2",
    symbol: "xx",
    image: "https://avatars.githubusercontent.com/u/115602512?s=96&v=4",
};
describe('SampleJetton', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let sampleJetton: SandboxContract<SampleJetton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        // 部署token
        let toekncontent = buildOnchainMetadata(jettonParams);
        let max_supply = toNano(123456766689011);
        sampleJetton = blockchain.openContract(await SampleJetton.fromInit(deployer.address, toekncontent, max_supply));
        const deployResult = await sampleJetton.send(
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
            to: sampleJetton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and sampleJetton are ready to use
    });
});
