const { task } = require("hardhat/config");

// 定义task
// 可以通过addParam定义命令行的参数，参数传递的方式是 --addr 合约地址
task("deploy-fundme", "部署FundMe合约的命令")
.addParam("addr","合约地址")
.setAction(async (taskArgs, hre) => {
    // 创建合约工厂 await：等待异步操作完成才能继续执行
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    // 通过工厂部署合约
    const fundMe = await fundMeFactory.deploy(10);
    // 等待合约部署完成，deploy只是发送一个部署交易操作，需要等待部署完成后再继续向下执行
    fundMe.waitForDeployment(); 
    // 等待合约部署完成
    console.log(`FundMe contract deployed at address: ${fundMe.target}`);

    // 如果是在Sepolia测试网络上部署合约，则需要验证合约
    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        // 当合约部署完成后，它已经存在于区块链上，但是etherscan可能还没有更新合约地址信息，可以等待5个区块确认，让etherscan更新合约地址信息
        // 获取部署交易对象
        const tx = fundMe.deploymentTransaction();
        if (!tx) {
            throw new Error("Deployment transaction not found.");
        }
        await tx.wait(2); // 等待 2 个确认块

        console.log("Waited for 2 blocks to confirm the deployment.");
        await verifyFundMe(fundMe.target, [10]);
    }else{
        console.log("Skipping contract verification, not on Sepolia or ETHERSCAN_API_KEY not set.");
    }

    // 获取已经部署的合约
    const fundMeFac = await ethers.getContractFactory("FundMe");
    // 与合约地址关联，得到合约的信息
    const fundMeInfo = fundMeFac.attch(taskArgs.addr);
    console.log(`FundMe contract info: ${fundMeInfo.target}`);
})

// 验证合约
async function verifyFundMe(fundMeAddr, args) {
    // hre就是hadrhat的运行时环境，run可以在js脚本中运行hardhat命令
    await hre.run("verify:verify", {
        // 合约地址
        address: fundMeAddr,
        // 构造函数参数
        // 验证合约需要知道当时部署合约时传入的构造函数参数
        constructorArguments: args
    });
}

// module.exports 是一个核心机制，用于 导出模块（变量、函数、对象等），使其可以被其他文件通过 require 导入使用
module.exports = {}