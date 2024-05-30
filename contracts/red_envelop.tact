import "@stdlib/deploy";
import "./jetton";
import "@stdlib/content";
message Clickredenvelope {
    from: Address;
    queryId: Int;
}
message SetMyJettonWallet {
    jettonWallet: Address;
}
message SendTon {
    from: Address;
}
contract RedEnvelop with Deployable {
    money: Int;
    redenvelopamount: Int;
    content: Slice;
    owner: Address;
    jetton: Address;
    groupaddresslist: map<Address, Bool>;
    myJettonWallet: Address;
    redamount: map<Int, Int>;
    min: Int;
    init(money: Int,
        redenvelopamount: Int,
        content: Slice,
        owner: Address,
        jetton: Address,
        groupaddresslist: map<Address, Bool>,minAmount: Int){
        self.money = money;
        self.redenvelopamount = redenvelopamount;
        self.content = content;
        self.owner = owner;
        self.jetton = jetton;
        self.groupaddresslist = groupaddresslist;
        self.myJettonWallet = newAddress(0, 0);
        self.min = minAmount;
        self.redamount = self.Amount(minAmount);
    }

    receive(msg: SetMyJettonWallet){
        let ctx: Context = context();
        require(ctx.sender == self.owner, "The sender is not the owner!");
        require(self.myJettonWallet == newAddress(0, 0), "The jetton wallet has been set!");
        require(msg.jettonWallet != newAddress(0, 0), "The jetton wallet is not correct!");
        self.myJettonWallet = msg.jettonWallet;
    }

    receive(msg: Clickredenvelope){
        let ctx: Context = context();
        require(self.groupaddresslist.get(ctx.sender) != null, "You are not in the group");
        require(self.groupaddresslist.get(ctx.sender) == false, "You have already received the red envelope");
        require(self.redenvelopamount > 0, "The red envelope has been received");
        require(msg.queryId >= 0 && msg.queryId < self.redenvelopamount, "The queryId is not correct");
        require(msg.from == newAddress(0,0), "The sender is not correct");
        //ton or token
        if (self.jetton == newAddress(0, 0)) {
            self.sendTon(msg.from, self.redamount.get(msg.queryId)!!);
        } else {
            self.sendJetton(ctx.sender, self.redamount.get(msg.queryId)!!, msg.queryId,ton("0.3"));
        }
        self.groupaddresslist.set(ctx.sender, true);
        self.money -= self.redamount.get(msg.queryId)!!;
        self.redenvelopamount -= 1;
    }

    receive(msg: SendTon){
        let ctx: Context = context();
        require(ctx.sender == self.owner, "The sender is not the owner!");
        send(SendParameters{
                to: ctx.sender,
                value: 0,
                mode: SendPayGasSeparately,
                body: "send ton to the redenvelope contract successfully!".asComment()
            }
        );
    }

    //发送ton
    fun sendTon(destination: Address, amount: Int) {
        send(SendParameters{
                to: destination,
                value: amount,
                mode: 0,
                bounce: false,
                body: "send red envelope of ton to the user successfully!".asComment()
            }
        );
    }
    //发送token
    fun sendJetton(to: Address, amount: Int, queryId: Int,value: Int){
        let ctx: Context = context();
        require(amount > 0, "The amount of Jetton is not enough!");
        require(to != newAddress(0, 0), "The address is not correct!");

        send(SendParameters{
            to: self.myJettonWallet, 
            value: ton("0.3")+value,
            mode: SendRemainingValue, 
            bounce: false,
            body: TokenTransfer{
                queryId: queryId,
                amount: amount,
                destination: to,
                response_destination: myAddress(),
                custom_payload: createOffchainContent("custom"),
                forward_ton_amount: value,
                forward_payload: createOffchainContent("forward").asSlice()
            }.toCell()
        });
    }
    fun Amount(minAmount: Int): map<Int, Int>{
        //二倍均值法
        let index : Int= 0;
        if (self.redenvelopamount == 1) {
            self.redamount.set(index, self.money);
        } else {
            let total: Int = self.money;
            let redcount: Int = self.redenvelopamount;
            let repeatcount: Int = self.redenvelopamount;
            repeat(repeatcount - 1) {
            let min: Int = minAmount;
            let max: Int = total / redcount * 2;
            let amount: Int = random(min, max);
            self.redamount.set(index, amount);
            index += 1;
            total -= amount;
            redcount -= 1;
            }
            self.redamount.set(index, total);
        }
        return self.redamount;
    }
    fun createOffchainContent(pram: String): Cell {
        let s:StringBuilder = beginStringFromBuilder(beginCell().storeBool(true).storeUint(0, 32));
        s.append(pram);
        return s.toCell();
    }
    //////////////////////////

    get fun redamount(): map<Int, Int> {
        return self.redamount;
    }

    get fun money(): Int {
        return self.money;
    }

    get fun redenvelopamount(): Int {
        return self.redenvelopamount;
    }

    get fun groupaddresslist(): map<Address, Bool> {
        return self.groupaddresslist;
    }

    get fun myJettonWallet(): Address {
        return self.myJettonWallet;
    }

    get fun ZeroAddress(): Address {
        return newAddress(0, 0);
    }

    get fun balance(): Int {
        return myBalance();
    }
}