const { ethers } = require("hardhat");
const { assert } = require("chai");

// 运行npx hardhat test进行测试，每次执行命令都会重新编译合约
describe("测试 fundMe 合约", async function () {
    let fundMe
    let firstAccount

    // 在每个 it 测试用例运行前，重新部署一份干净的测试合约，确保每个测试是独立、无副作用的。
    // 如果只是想初始化资源的话可以使用 before()
    beforeEach(async function () {
        // 根据在 deploy/ 目录下的部署脚本，自动部署tag 名为 "fundMe" 的合约及其依赖项，部署信息会保存到deployments中。
        await deployments.fixture(["fund_me"]);
        // 获取在 hardhat.config.js 中定义的 namedAccounts 对应的地址
        firstAccount = (await getNamedAccounts()).firstAccount;
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
})