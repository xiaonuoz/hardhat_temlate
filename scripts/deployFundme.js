// import ethers.js 引入ethers包
const { ethers } = require("hardhat");

// async 非同步函数，异步函数，使用await必须定义函数为 async
async function main() {
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

    // 测试合约方法

    // 获取在配置文件中配置的合约地址
    // ethers.getSigners()：当在hardhat配置文件中为网络配置了多个账户的私钥时，getSigners()会返回一个包含所有账户的信息的数组
    // 只取一个就是第一个账户，想取多个就定义多个变量，只想取后面的可以将前面的定义为 _（下划线），表示不使用第一个变量
    const [firstAccount,secondAccount] = await ethers.getSigners();
    console.log(`First account address: ${firstAccount.address}`);
    console.log(`Second account address: ${secondAccount.address}`);

    // 调用合约的Fund方法，这步操作只是发起交易，还需要等待交易完成
    const fundTx = await fundMe.Fund({
        // // 发送者地址
        // from: firstAccount.address,
        // 发送的以太币数量，单位是wei
        value: ethers.parseEther("0.1") // 0.1 ETH，ethers.parseEther() 将以太币的数量转换为 wei
    });
    // 等待转账交易完成
    await fundTx.wait();

    // ethers.provider.getBalance()：获取地址的以太币余额
    const balance = await ethers.provider.getBalance(fundMe.target);
    console.log(`FundMe contract balance: ${ethers.formatEther(balance)} ETH`);

    // connect 是为了 明确指定交易的发送者（msg.sender）
    // 如果没有显式调用 .connect() 会默认使用当前连接的提供者的第一个账户，通常是通过 ethers.getSigners() 获取的第一个地址
    const fundTxSecond = await fundMe.connect(secondAccount).Fund({
        // 发送的以太币数量，单位是wei
        value: ethers.parseEther("0.1") // 0.1 ETH，ethers.parseEther() 将以太币的数量转换为 wei
    });
    await fundTxSecond.wait();
    
    const balanceSecond = await ethers.provider.getBalance(secondAccount.address);
    console.log(`FundMe contract balance: ${ethers.formatEther(balanceSecond)} ETH`);

    // 获取合约中的public变量的值
    const firstToMapping = await fundMe.fundersToAmount(firstAccount.address)
    const secondToMapping = await fundMe.fundersToAmount(secondAccount.address)

    console.log(`First account fund amount: ${ethers.formatEther(firstToMapping)} ETH`);
    console.log(`Second account fund amount: ${ethers.formatEther(secondToMapping)} ETH`);

    console.log(`deployment timestamp: ${await fundMe.deploymentTimestamp()}`);
}

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

// 调用main函数
main().catch((error) => {
    console.error(error);
    // 如果main函数执行出错，打印错误信息并退出进程
    process.exit(1); 
});