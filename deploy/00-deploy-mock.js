module.exports = async ({getNamedAccounts,deployments,network})=> {
    const currentNetwork = network.name;
    if (!process.env.HARDHAT_DEPLOY_TAGS && !["hardhat", "localhost"].includes(currentNetwork)) {
        throw new Error(
        "必须指定 --tags 参数，否则不允许执行部署！"
        );
    }

    const {firstAccount} = await getNamedAccounts();
    console.log(`Deployer account address: ${firstAccount}`);

    const {deploy} = await deployments

    await deploy("MockV3Aggregator", {
        from: firstAccount,
        args: [8, 300000000000],
        log: true,
    });
}

module.exports.tags = ["all", "mock"];