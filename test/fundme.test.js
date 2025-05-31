const { ethers } = require("hardhat");
const { assert } = require("chai");

// 运行npx hardhat test进行测试，每次执行命令都会重新编译合约
describe("测试 fundMe 合约", async function () {
    it("测试合约构造函数", async function () {
        // 获取配置文件中的第一个地址
        const [deployer] = await ethers.getSigners();

        // 创建合约工厂
        const fundMeFactory = await ethers.getContractFactory("FundMe");
        // 通过工厂部署合约 不加connect()方法，默认使用第一个账户部署合约
        const fundMe = await fundMeFactory.deploy(180);
        // 等待合约部署完成
        await fundMe.waitForDeployment();

        // 判断是否是该地址发布的合约
        assert.equal(await fundMe.owner(), deployer.address);
    });
})