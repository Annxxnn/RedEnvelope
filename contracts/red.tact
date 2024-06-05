import "@stdlib/deploy";
import "./RedEnvelop";
message CreateRedEnvelope {
    money: Int;
    redenvelopamount: Int;
    content: Slice;
    owner: Address;
    jetton: Address;
    groupaddresslist: map<Address, Bool>;
    myJettonWallet: Address;
    redamount: map<Int, Int>;
    min: Int;
}
message SetJettonWallet {
    redenvelopeAddress: Address;
    jettonWallet: Address;
}
struct RedenvelopeInfo {
    money: Int;
    redenvelopamount: Int;
    content: Slice;
    owner: Address;
    jetton: Address;
    groupaddresslist: map<Address, Bool>;
    min: Int;
}

contract Red with Deployable {
    redenvelopeAddress: map<Int, Address>;
    count: Int;
    init(){
        self.count = 0;
    }

    //收到创建红包消息，创建红包合约
    receive(msg: CreateRedEnvelope){
        let ctx: Content = context();
        let ton_to_A: Int = ctx.value;
        let sender: Address = ctx.sender;
        //创建红包合约
        let init: StateInit = initOf RedEnvelop(myAddress(),
            msg.money,
            msg.redenvelopamount,
            msg.content,
            msg.owner,
            msg.jetton,
            msg.groupaddresslist,
            msg.min
        );
        let sendValue: Int = msg.redenvelopamount * ton("0.0055+0.3");
        send(SendParameters{
                to: contractAddress(init),
                value: sendValue,
                mode: SendPayGasSeparately,
                code: init.code, // attaching the state init will cause the message to deploy
                data: init.data,
                body: "deploy red envelope".asComment() // we must piggyback the deployment on another message
            }
        );
        //将红包合约地址存储到合约中
        self.redenvelopeAddress.set(self.count, contractAddress(init));
        count += 1;
        //将ctx.value转给红包创建者
        send(SendParameters{
                to: sender,
                value: ton_to_A,
                mode: SendPayGasSeparately,
                body: "send ton to the redEnvelope creater".asComment()
            }
        );
    }

    //设置红包的jetton钱包地址,这里的gas费？？？？
    receive(msg: SetJettonWallet){
        let redenvelopAddress: Address = msg.redenvelopeAddress;
        let myjettonWallet: Address = msg.jettonWallet;
        send(SendParameters{
                to: redenvelopeAddress,
                value: ton("0.1"), // pay for message, the deployment and give some TON for storage
                mode: SendIgnoreErrors,
                code: init.code, // attaching the state init will cause the message to deploy
                data: init.data,
                body: SetMyJettonWallet{jettonWallet: myjettonWallet}.toCell()
            }
        );
    }

    //get methods
    //获取红包合约的地址
    get fun getRedEnvelopeAddress(info: RedenvelopeInfo): Address {
        let init: StateInit = initOf RedEnvelop(info.money,
            info.redenvelopamount,
            info.content,
            info.owner,
            info.jetton,
            info.groupaddresslist,
            info.min
        );
        return contractAddress(init);
    }
}