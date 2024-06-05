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
        console.log("sampleJetton.address deploy", sampleJetton.address);
        //部署红包合约
        const contentStr = "test red envelope of token";
        const content = beginCell()
            .storeStringTail(contentStr)
        const money = 70n;
        const redenvelopamount = 3n;
        const jetton = sampleJetton.address;
        let myDictionary = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool()); // Use Dictionary.Keys.Address() to create the key type
        myDictionary.set(user1.address, false);
        myDictionary.set(user2.address, false);
        myDictionary.set(user3.address, false);
        const min = 1n;
        redEnvelop = blockchain.openContract(await RedEnvelop.fromInit(
            money,
            redenvelopamount,
            content.asCell(),
            deployer.address,
            jetton,
            myDictionary,// Convert Map to Dictionary
            min
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
        console.log("redEnvelop.address deploy", redEnvelop.address);
        //向红包合约mint token
        const mintResult = await sampleJetton.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
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
        console.log("mytokenWallet.address in ts", mytokenWallet.address);
        const tokenBalance = (await mytokenWallet.getGetWalletData()).balance;
        console.log("tokenBalance", tokenBalance);
        //设置jetton钱包地址
        const setJettonWalletResult = await redEnvelop.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetMyJettonWallet',
                jettonWallet: mytokenWallet.address,
            }
        );
        const jettonWallet = await redEnvelop.getMyJettonWallet();
        console.log("jettonWallet in tact", jettonWallet);
        //////////ton redenvelope///////////
        // //部署红包合约
        // const contentStr = "test red envelope of ton";
        // const content = beginCell()
        //     .storeStringTail(contentStr)
        // const money = toNano(100);
        // const redenvelopamount = 3n;
        // const jetton = Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
        // let myDictionary = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Bool()); // Use Dictionary.Keys.Address() to create the key type
        // myDictionary.set(user1.address, false);
        // myDictionary.set(user2.address, false);
        // myDictionary.set(user3.address, false);
        // let min = toNano(1);
        // redEnvelop = blockchain.openContract(await RedEnvelop.fromInit(
        //     money,
        //     redenvelopamount,
        //     content.asCell(),
        //     deployer.address,
        //     jetton,
        //     myDictionary,// Convert Map to Dictionary
        //     min
        // ));

        // const deployResult = await redEnvelop.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano('1'),
        //     },
        //     {
        //         $$type: 'Deploy',
        //         queryId: 0n,
        //     }
        // );

        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: redEnvelop.address,
        //     deploy: true,
        //     success: true,
        // });
        //向红包合约转ton
        const tonAmount = toNano(100);
        const sendResult = await redEnvelop.send(
            deployer.getSender(),
            {
                value: tonAmount,
            },
            {
                $$type: 'SendTon',
                from: deployer.address,
            }
        );
        console.log("redEnvelop.address deploy", redEnvelop.address);
        console.log("redenvelop balance", await redEnvelop.getBalance());
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and redEnvelop are ready to use
    });
    it.skip('should get redAmount', async () => {
        const money = await redEnvelop.getMoney();
        console.log("money", money);
        const redAmount = await redEnvelop.getRedamount();
        console.log("redAmount", redAmount);
        const redAmount0 = redAmount.get(0n) || 0n;
        const redAmount1 = redAmount.get(1n) || 0n;
        const redAmount2 = redAmount.get(2n) || 0n;
        const total = redAmount0 + redAmount1 + redAmount2;
        console.log("total", total);
        expect(total).toEqual(money);
    });

    it.skip('should get zero address', async () => {
        const zeroAddress = await redEnvelop.getZeroAddress();
        console.log("zeroAddress", zeroAddress);
    });
    it.skip('should send  red envelope of token', async () => {
        const moneyBefore = await redEnvelop.getMoney();
        const redenvelopamountBefore = await redEnvelop.getRedenvelopamount();
        console.log("moneyBefore", moneyBefore);
        console.log("redenvelopamountBefore", redenvelopamountBefore);
        const sendResult = await redEnvelop.send(
            user1.getSender(),
            {
                value: toNano('0.3'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user1.address,
                queryId: 0n,
            }
        );
        expect(sendResult.transactions).toHaveTransaction({
            from: user1.address,
            to: redEnvelop.address,
            success: true,
        });
        const redAmount = await redEnvelop.getRedamount();
        const redAmount0 = redAmount.get(0n) || 0n;
        console.log("redAmount0", redAmount0);
        const moneyAfter = await redEnvelop.getMoney();
        const redenvelopamountAfter = await redEnvelop.getRedenvelopamount();
        const groupaddresslistAfter = await redEnvelop.getGroupaddresslist();
        console.log("moneyAfter", moneyAfter);
        console.log("redenvelopamountAfter", redenvelopamountAfter);
        console.log("groupaddresslistAfter", groupaddresslistAfter);
        const sendResult1 = await redEnvelop.send(
            user2.getSender(),
            {
                value: toNano('0.3'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user2.address,
                queryId: 1n,
            }
        );
        const redAmount1 = redAmount.get(1n) || 0n;
        console.log("redAmount1", redAmount1);
        const moneyAfter1 = await redEnvelop.getMoney();
        const redenvelopamountAfter1 = await redEnvelop.getRedenvelopamount();
        const groupaddresslistAfter1 = await redEnvelop.getGroupaddresslist();
        console.log("moneyAfter1", moneyAfter1);
        console.log("redenvelopamountAfter1", redenvelopamountAfter1);
        console.log("groupaddresslistAfter1", groupaddresslistAfter1);
        const sendResult2 = await redEnvelop.send(
            user3.getSender(),
            {
                value: toNano('0.3'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user3.address,
                queryId: 2n,
            }
        );
        const redAmount2 = redAmount.get(2n) || 0n;
        console.log("randomAmount2", redAmount2);
        const moneyAfter2 = await redEnvelop.getMoney();
        const redenvelopamountAfter2 = await redEnvelop.getRedenvelopamount();
        const groupaddresslistAfter2 = await redEnvelop.getGroupaddresslist();
        console.log("moneyAfter2", moneyAfter2);
        console.log("redenvelopamountAfter2", redenvelopamountAfter2);
        console.log("groupaddresslistAfter2", groupaddresslistAfter2);
        console.log("total", redAmount0 + redAmount1 + redAmount2);
        const mytokenWallet = blockchain.openContract(await JettonDefaultWallet.fromInit(sampleJetton.address, redEnvelop.address));
        console.log("mytokenWallet.address in ts", mytokenWallet.address);
        const tokenBalance = (await mytokenWallet.getGetWalletData()).balance;
        console.log("tokenBalance after", tokenBalance);
        //expect(moneyAfter).toEqual(moneyBefore - randomAmount);
        //expect(redenvelopamountAfter).toEqual(redenvelopamountBefore - 1n);
    });
    it.skip('should send  red envelope of ton', async () => {
        const moneyBefore = await redEnvelop.getMoney();
        const redenvelopamountBefore = await redEnvelop.getRedenvelopamount();
        console.log("moneyBefore", moneyBefore);
        console.log("redenvelopamountBefore", redenvelopamountBefore);
        const sendResult = await redEnvelop.send(
            user1.getSender(),
            {
                value: toNano('0.3'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user1.address,
                queryId: 0n,
            }
        );
        console.log("redenvelop balance", await redEnvelop.getBalance());
        expect(sendResult.transactions).toHaveTransaction({
            from: user1.address,
            to: redEnvelop.address,
            success: true,
        });

        const moneyAfter = await redEnvelop.getMoney();
        const redenvelopamountAfter = await redEnvelop.getRedenvelopamount();
        const groupaddresslistAfter = await redEnvelop.getGroupaddresslist();
        const redamount = await redEnvelop.getRedamount();
        const redAmount0 = redamount.get(0n) || 0n;
        console.log("redAmount0", redAmount0);
        console.log("moneyAfter", moneyAfter);
        console.log("redenvelopamountAfter", redenvelopamountAfter);
        console.log("groupaddresslistAfter", groupaddresslistAfter);
        expect(redAmount0).toEqual(moneyBefore - moneyAfter);
        expect(moneyAfter).toEqual(moneyBefore - redAmount0);
        expect(redenvelopamountAfter).toEqual(redenvelopamountBefore - 1n);

        const sendResult1 = await redEnvelop.send(
            user2.getSender(),
            {
                value: toNano('0.3'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user2.address,
                queryId: 1n,
            }
        );
        const redAmount1 = redamount.get(1n) || 0n;
        console.log("redAmount1", redAmount1);
        const moneyAfter1 = await redEnvelop.getMoney();
        const redenvelopamountAfter1 = await redEnvelop.getRedenvelopamount();
        const groupaddresslistAfter1 = await redEnvelop.getGroupaddresslist();
        console.log("moneyAfter1", moneyAfter1);
        console.log("redenvelopamountAfter1", redenvelopamountAfter1);
        console.log("groupaddresslistAfter1", groupaddresslistAfter1);
        const sendResult2 = await redEnvelop.send(
            user3.getSender(),
            {
                value: toNano('0.3'),
            },
            {
                $$type: 'Clickredenvelope',
                from: user3.address,
                queryId: 2n,
            }
        );
        const redAmount2 = redamount.get(2n) || 0n;
        console.log("randomAmount2", redAmount2);
        const moneyAfter2 = await redEnvelop.getMoney();
        const redenvelopamountAfter2 = await redEnvelop.getRedenvelopamount();
        const groupaddresslistAfter2 = await redEnvelop.getGroupaddresslist();
        console.log("moneyAfter2", moneyAfter2);
        console.log("redenvelopamountAfter2", redenvelopamountAfter2);
        console.log("groupaddresslistAfter2", groupaddresslistAfter2);
        console.log("total", redAmount0 + redAmount1 + redAmount2);
        console.log("redenvelope balance of ton", await redEnvelop.getBalance());
    });
});

