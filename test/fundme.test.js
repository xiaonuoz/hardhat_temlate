const { ethers } = require("hardhat");
const { assert, expect } = require("chai");

const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

// 运行npx hardhat test进行测试，每次执行命令都会重新编译合约
describe("测试 fundMe 合约", async function () {
    let fundMe
    let firstAccount
    let secondAccount

    // 在每个 it 测试用例运行前，重新部署一份干净的测试合约，确保每个测试是独立、无副作用的。
    // 如果只是想初始化资源的话可以使用 before()
    beforeEach(async function () {
        // 根据在 deploy/ 目录下的部署脚本，自动部署tag 名为 "fundMe" 的合约及其依赖项，部署信息会保存到deployments中。
        await deployments.fixture(["mock", "fund_me"]);
        // 获取在 hardhat.config.js 中定义的 namedAccounts 对应的地址
        firstAccount = (await getNamedAccounts()).firstAccount;
        const accounts = await ethers.getSigners();
        secondAccount = accounts[1];
        
        // secondAccount = (await getNamedAccounts()).user1;
        // // 从 deployments 文件中找到名为 FundMe 的合约，然后用 secondAccount 作为调用者返回一个合约实例
        // // 后续使用这个实例调用合约方法，调用者都是secondAccount，但是使用getSigner()+ connect的方式更加灵活
        // fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount);

        // 获取已部署的合约地址和接口信息
        const fundMeDeployment = await deployments.get("FundMe");
        // 获取部署的合约实例
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
    });

    it("测试合约构造函数", async function () {
        // 等待合约部署完成
        await fundMe.waitForDeployment();

        // 判断是否是该地址发布的合约
        assert.equal(await fundMe.owner(), firstAccount);
    });

    it("测试合约的 funme 方法", async function () {
        await fundMe.Fund({value: ethers.parseEther("0.1")});
        const blance = await fundMe.fundersToAmount(firstAccount);
        // 断言：检查 firstAccount 的余额是否等于 0.1 ETH，不相等测试就不通过
        await expect(blance).to.equal(ethers.parseEther("0.1"));

        await time.increase(200); // 把区块链的虚拟时间向前推进 200 秒，模拟时间流逝
        // 仅增加时间并不会立即生效，必须挖一个新块才能让 EVM 状态更新
        await mine(); // 生成一个区块,让前面模拟增加的时间真正“写入链”并生效

        // expect功能是判断是否符合预期
        // 期望这个调用被 revert（失败），并返回错误信息 "window is close"。
        // 如果合约没有抛出这个错误，测试就会失败。
        // 这里的Fund函数不能加await，Chai 会自动等待它完成再继续执行后面的测试语句
        // 而expect 本身需要await, 因为没有 await，也没有 return，测试函数就不会等待断言；测试直接结束了，Mocha 认为通过了
        await expect(fundMe.Fund({value: ethers.parseEther("0.1")}))
            .to.be.revertedWith("window is close");

        console.log("合约的 funme 方法测试通过");
    });

    it("测试合约的 getFund 方法", async function () {
        await fundMe.Fund({value: ethers.parseEther("1")});

        await time.increase(200); // 把区块链的虚拟时间向前推进 200 秒，模拟时间流逝
        await mine(); // 生成一个区块,让前面模拟增加的时间真正“写入链”并生效

        await expect(fundMe.connect(secondAccount).getFund())
            .to.be.revertedWith("this function can only be called by owner");
        console.log("合约的 getFund 方法测试通过");

        // 预期 fundMe 合约的 getFund 方法会触发 getFundEvent 事件，事件的参数值是 firstAccount 和 1 ETH，不符合则测试失败
        await expect(fundMe.getFund())
            .to.be.emit(fundMe, "getFundEvent")
            .withArgs(firstAccount, ethers.parseEther("1"));
    });
})