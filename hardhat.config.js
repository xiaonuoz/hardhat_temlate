require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
// 引入自定义的task
require("./tasks/deploy-fundme.js");

// 使用 namedAccounts 功能需要引入 hardhat-deploy 插件
require("hardhat-deploy");

// process.env.SEPOLIA_URL 就是这个进程的环境变量，dotenv包会加载 .env 文件中的内容到 process.env 中。
// 如果 process.env.SEPOLIA_URL 是 undefined、null、""、false、0 等 “假值”，就赋值为空字符串 ""
// 如果 SEPOLIA_URL 没设置，则它会是 undefined。保证这个变量永远有一个字符串类型的值
const SEPOLIA_URL = process.env.SEPOLIA_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const PRIVATE_KEY1 = process.env.PRIVATE_KEY1 || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity的编译版本
  solidity: "0.8.28",
  // 单个测试用例默认40S超时，增加超时时间到200s
  mocha: {
    timeout: 300000
  },
  gasReporter: {
    enabled: true
  },
  // 发布的链配置
  networks: {
    sepolia: {
      url: SEPOLIA_URL, // SEPOLIA地址
      accounts: [PRIVATE_KEY, PRIVATE_KEY1], // 私钥
      chainId: 11155111  // Sepolia的链ID
    }
  },
  // 合约验证
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY, // Etherscan API密钥
    },
  },
  // namedAccounts 配合插件 hardhat-deploy 使用，用来给账户地址设置别名，部署或测试脚本中可以直接通过 getNamedAccounts() 使用
  namedAccounts: {
    firstAccount: {
      default: 0, // default指的是默认的网络，0表示第一个账户
      sepolia: 0, // Sepolia网络的第一个账户
    },
    user1: {
      default: 1, // 第二个账户作为用户1
      sepolia: 1, // Sepolia网络的第二个账户
    },
  },
};
