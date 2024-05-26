import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address, beginCell } from '@ton/core';
import { RedEnvelop } from '../wrappers/RedEnvelop';
import { SampleJetton } from '../wrappers/SampleJetton';
import '@ton/test-utils';
import { JettonDefaultWallet } from '../build/SampleJetton/tact_JettonDefaultWallet';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { Dictionary } from '@ton/core'; // Add this import
describe('RedEnvelop', () => {
    let blockchain: Blockchain;
    let sampleJetton: SandboxContract<SampleJetton>;
    let deployer: SandboxContract<TreasuryContract>;
    let redEnvelop: SandboxContract<RedEnvelop>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;

    const jettonParams = {
        name: "test xx",
        description: "This is the first jetton from live2",
        symbol: "xx",
        image: "https://avatars.githubusercontent.com/u/115602512?s=96&v=4",
    };
    beforeEach(async () => {

        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');

        // 部署token
        let toekncontent = buildOnchainMetadata(jettonParams);
        let max_supply = toNano(123456766689011);

        sampleJetton = blockchain.openContract(await SampleJetton.fromInit(deployer.address, toekncontent, max_supply));

        const jettonDeployResult = await sampleJetton.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(jettonDeployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sampleJetton.address,
            deploy: true,
            success: true,
        });
        console.log("sampleJetton.address", sampleJetton.address);
        //部署红包合约
        const contentStr = "test red envelope of token";
        const content = beginCell()
            .storeStringTail(contentStr)
        const money = 7n;
        const redenvelopamount = 3n;
        const jetton = sampleJetton.address;
        let myDictionary = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool()); // Use Dictionary.Keys.Address() to create the key type
        myDictionary.set(user1.address, false);
        myDictionary.set(user2.address, false);
        myDictionary.set(user3.address, false);
        redEnvelop = blockchain.openContract(await RedEnvelop.fromInit(
            money,
            redenvelopamount,
            content.asCell(),
            deployer.address,
            jetton,
            myDictionary// Convert Map to Dictionary
        ));

        const deployResult = await redEnvelop.send(
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
            to: redEnvelop.address,
            deploy: true,
            success: true,
        });
        console.log("redEnvelop.address", redEnvelop.address);
        //向红包合约mint token
        const mintResult = await sampleJetton.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Mint',
                amount: 100n,
                receiver: redEnvelop.address,
            }
        );
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sampleJetton.address,
            success: true,
        });
        const mytokenWallet = blockchain.openContract(await JettonDefaultWallet.fromInit(sampleJetton.address, redEnvelop.address));
        const tokenBalance = (await mytokenWallet.getGetWalletData()).balance;
        console.log("tokenBalance", tokenBalance);
        const wallet = await mytokenWallet.getGetWalletData();
        console.log("wallet", wallet);
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and redEnvelop are ready to use
    });
    it.skip('should send success red envelope', async () => {
        const moneyBefore = await redEnvelop.getMoney();
        const redenvelopamountBefore = await redEnvelop.getRedenvelopamount();
        console.log("moneyBefore", moneyBefore);
        console.log("redenvelopamountBefore", redenvelopamountBefore);
        const sendResult = await redEnvelop.send(
            user1.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user1.address,
                queryId: 0n,
            }
        );
        const randomAmount = await redEnvelop.getRandomAmount();
        console.log("randomAmount", randomAmount);
        expect(sendResult.transactions).toHaveTransaction({
            from: user1.address,
            to: redEnvelop.address,
            success: true,
        });

        const moneyAfter = await redEnvelop.getMoney();
        const redenvelopamountAfter = await redEnvelop.getRedenvelopamount();
        console.log("moneyAfter", moneyAfter);
        console.log("redenvelopamountAfter", redenvelopamountAfter);
        expect(moneyAfter).toEqual(moneyBefore - randomAmount);
        expect(redenvelopamountAfter).toEqual(redenvelopamountBefore - 1n);
    });
});

