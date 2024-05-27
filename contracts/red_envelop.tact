import "@stdlib/deploy";
import "./jetton";
message Clickredenvelope {
    from: Address;
    queryId: Int;
}
message SetMyJettonWallet {
    jettonWallet: Address;
}

contract RedEnvelop with Deployable {
    money: Int;
    redenvelopamount: Int;
    content: Slice;
    owner: Address;
    jetton: Address;
    groupaddresslist: map<Address, Bool>;
    randomAmount: Int;
    myJettonWallet: Address;
    init(money: Int,
        redenvelopamount: Int,
        content: Slice,
        owner: Address,
        jetton: Address,
        groupaddresslist: map<Address, Bool>){
        self.money = money;
        self.redenvelopamount = redenvelopamount;
        self.content = content;
        self.owner = owner;
        self.jetton = jetton;
        self.groupaddresslist = groupaddresslist;
        self.randomAmount = 0;
        self.myJettonWallet = newAddress(0, 0);
    }

    receive(msg: SetMyJettonWallet){
        let ctx: Context = context();
        require(ctx.sender == self.owner, "The sender is not the owner!");
        self.myJettonWallet = msg.jettonWallet;
    }

    receive(msg: Clickredenvelope){
        let ctx: Context = context();
        //require(self.groupaddresslist.get(address) != null, "You are not in the group");
        //require(self.groupaddresslist.get(address) == false, "You have already received the red envelope");
        //require(self.redenvelopamount > 0, "The red envelope has been received");
        //ton or token
        if (self.jetton == newAddress(0, 0)) {
            self.randomAmount = self.tonAmount(self.money, self.redenvelopamount);
            self.sendTon(ctx.sender, self.randomAmount);
        } else {
            self.randomAmount = self.tokenAmount(self.money, self.redenvelopamount);
            self.sendToken(ctx.sender, self.randomAmount, msg.queryId);
        }
        self.groupaddresslist.set(ctx.sender, true);
        self.redenvelopamount -= 1;
        self.money -= self.randomAmount;
    }

    //发送ton
    fun sendTon(destination: Address, amount: Int) {
        send(SendParameters{
                to: destination,
                value: amount,
                mode: SendRemainingValue,
                bounce: true,
                body: "send red envelope of ton to the user successfully!".asComment()
            }
        );
    }
    //发送token

    fun sendToken(destination: Address, amount: Int, queryId: Int) {
        send(SendParameters{
                to: self.myJettonWallet,
                value: ton("1"),
                mode: SendRemainingValue,
                bounce: false,
                body: TokenTransfer{
                    queryId: queryId,
                    amount: amount,
                    destination: destination,
                    response_destination: destination,
                    custom_payload: emptyCell(),
                    forward_ton_amount: 0,
                    forward_payload: emptySlice()
                }.toCell()
            }
        );
    }

    fun tonAmount(money: Int, redenvelopamount: Int): Int {
        //二倍均值法
        if (redenvelopamount == 1) {
            return money;
        }
        let min: Int = ton("0.1");
        let max: Int = money / redenvelopamount * 2;
        let amount: Int = random(min, max);
        return amount;
    }

    fun tokenAmount(money: Int, redenvelopamount: Int): Int {
        //二倍均值法
        if (redenvelopamount == 1) {
            return money;
        }
        let min: Int = 1;
        let max: Int = money / redenvelopamount * 2;
        let amount: Int = random(min, max);
        return amount;
    }
    //////////////////////////

    get fun randomAmount(): Int {
        return self.randomAmount;
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
}