const { DECIMAL, INITIAL_ANSWER, developmentChains, networkConfig  } = require("../helper-hardhat-config");

module.exports = async ({getNamedAccounts,deployments,network})=> {
    // 不是本地网络不需要部署
    if (!developmentChains.includes(network.name)){
        throw new Error(
        "非本地网络不需要部署 MockV3Aggregator 合约！"
        );
    }

    const {firstAccount} = await getNamedAccounts();
    console.log(`Deployer account address: ${firstAccount}`);

    const {deploy} = await deployments

    await deploy("MockV3Aggregator", {
        from: firstAccount,
        args: [DECIMAL, INITIAL_ANSWER],
        log: true,
    });
}

module.exports.tags = ["all", "mock"];