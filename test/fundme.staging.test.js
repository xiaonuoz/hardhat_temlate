const { ethers } = require("hardhat");
const { assert, expect } = require("chai");

// 由于真实环境有网络等问题，最好将测试用例的超时时间拉大一点
describe("真实环境测试 fundMe 合约", async function () {
    let fundMe
    let firstAccount

    beforeEach(async function () {
        await deployments.fixture(["mock", "fund_me"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        
        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
    });

    it("真实环境测试getfund",async function() {
        await fundMe.Fund({value: ethers.parseEther("0.5")});
        await new Promise((resolve) => setTimeout(resolve, 200*1000)); // 让当前异步函数等待 200 秒再继续执行，确保交易被打包到区块中

        // 获取交易对象
        const getFundTx =await fundMe.getFund()
        // 等待上一步发送的交易被矿工打包和执行成功，执行完后返回的是一个 交易回执
        // 因为执行getFund()只是发起了交易，后续需要wait等待交易成功的回执
        // 如果不加wait，emit事件可能获取的是空，因为交易可能未完成，事件还没有抛出
        const getFundReceipt = await getFundTx.wait();
        // 前面已经获取了回执，所以expect不需要await关键字
        expect(getFundReceipt)
            .to.be.emit(fundMe, "getFundEvent")
            .withArgs(firstAccount, ethers.parseEther("0.5"));
    })
})