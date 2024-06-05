import "@stdlib/deploy";
message TestCtxValue {
    str: String;
}
message TestCtxValuetransfer {
    str: String;
}

contract Test with Deployable {
    value: Int;
    str: String;
    sender: Address;
    init(value: Int, str: String){
        self.value = value;
        self.str = str;
        self.sender = newAddress(0, 0);
    }

    receive(msg: TestCtxValue){
        let ctx: Context = context();
        self.value = ctx.value;
        self.str = msg.str;
        send(SendParameters{
                to: myAddress(),
                value: 0,
                mode: SendRemainingBalance,
                bounce: false,
                body: TestCtxValuetransfer{str: "test transfer ctx value"}.toCell()
            }
        );
    }

    receive(msg: TestCtxValuetransfer){
        let ctx: Context = context();
        self.value = ctx.value;
        self.str = msg.str;
        self.sender = ctx.sender;
    }

    get fun value(): Int {
        return self.value;
    }

    get fun str(): String {
        return self.str;
    }

    get fun sender(): Address {
        return self.sender;
    }
}