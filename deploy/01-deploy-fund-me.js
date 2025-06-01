// 参数是 Hardhat 在运行部署脚本时自动注入的工具对象，让你方便地访问账户、部署合约等功能
// 这种方式只在 deploy/ 目录下的部署脚本中才会被 Hardhat-deploy 自动注入上下文参数，放到 scripts/ 目录下是不会自动生效的
// hardhat-deploy 会按照文件名的字母顺序（ASCII顺序）执行 deploy/ 目录下的脚本，所以文件名一般会加数字来控制部署顺序，不加就会按照字母排序
module.exports = async ({getNamedAccounts,deployments,network})=> {
    // 在测试环境下绕过限制，测试代码已经指定了部署的合约，不需要检测tags参数
    const currentNetwork = network.name;
    // 增加 --tag限制，避免执行 npx hardhat deploy 时不加参数导致默认部署了deploy目录下的所有合约
    if (!process.env.HARDHAT_DEPLOY_TAGS && !["hardhat", "localhost"].includes(currentNetwork)) {
        throw new Error(
        "必须指定 --tags 参数，否则不允许执行部署！"
        );
    }

    // 获取在 hardhat.config.js 中定义的 namedAccounts 对应的地址
    // 获取第一个账户，如果想取的是 getNamedAccounts()中的firstAccount属性，定义相同名字的变量加上花括号就等价于 (await getNamedAccounts()).firstAccount
    const {firstAccount} = await getNamedAccounts();
    console.log(`Deployer account address: ${firstAccount}`);

    // 获取 deployments对象中的 deploy 函数，这是一个对象，提供了由 hardhat-deploy 插件暴露的部署工具
    const {deploy} = await deployments

    // deploy 一定要加await，因为它是一个异步函数，如果不加可能导致后续逻辑出错，因为合约可能还没有部署完成
    await deploy("FundMe", {
        // 部署合约的账户
        from: firstAccount,
        // 传入构造函数参数
        args: [180], // 传入的参数是一个数组
        // 自动打印部署日志到终端
        log: true,
    });
}

module.exports.tags = ["all", "fund_me"]; // 为部署脚本添加标签，方便在运行时指定特定的部署脚本，为多个脚本添加相同的标签可以一起部署