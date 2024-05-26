import "@stdlib/deploy";
import "./jetton";
message Clickredenvelope {
    from: Address;
    queryId: Int;
}

contract RedEnvelop with Deployable {
    money: Int;
    redenvelopamount: Int;
    content: Slice;
    owner: Address;
    jetton: Address;
    groupaddresslist: map<Address, Bool>;
    randomAmount: Int;
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
    }

    receive(msg: Clickredenvelope){
        let ctx: Context = context();
        let address: Address = ctx.sender;
        require(self.groupaddresslist.get(address) != null, "You are not in the group");
        require(self.groupaddresslist.get(address) == false, "You have already received the red envelope");
        require(self.redenvelopamount > 0, "The red envelope has been received");
        let amount: Int = self.redenvelop(self.money, self.redenvelopamount, self.jetton, msg.queryId);
        self.groupaddresslist.set(address, true);
        self.redenvelopamount -= 1;
        self.money -= amount;
    }

    fun redenvelop(money: Int, redenvelopamount: Int, jetton: Address, queryId: Int): Int {
        let ctx: Context = context();
        let address: Address = ctx.sender;
        //ton or token
        if (jetton == newAddress(0, 0)) {
            self.randomAmount = self.tonAmount(money, redenvelopamount);
            self.sendTon(ctx.sender, self.randomAmount);
        } else {
            self.randomAmount = self.tokenAmount(money, redenvelopamount);
            self.sendToken(ctx.sender, self.randomAmount, jetton, queryId);
        }
        return self.randomAmount;
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

    fun sendToken(destination: Address, amount: Int, jetton: Address, queryId: Int) {
        let ctx: Context = context();
        let address: Address = ctx.sender;
        let myjettonWallet: StateInit = initOf JettonDefaultWallet(self.jetton, myAddress());
        send(SendParameters{
                to: contractAddress(myjettonWallet),
                value: ton("0.1"),
                mode: SendRemainingValue,
                bounce: false,
                body: TokenTransfer{
                    queryId: queryId,
                    amount: amount,
                    destination: destination,
                    response_destination: address,
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
}