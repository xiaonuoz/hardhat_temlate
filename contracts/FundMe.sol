// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {MockV3Aggregator} from "@chainlink/contracts/src/v0.8/shared/mocks/MockV3Aggregator.sol";

contract FundMe {
    // 记录投资人信息，
    mapping (address=>uint256) public fundersToAmount;

    // 最小筹款ETH值，solidity中没有float浮点类型，1 ETH= 10^18 个Wei，如果要表示0.1个ETH就是 10^17 Wei
    // uint256 MINIMUM_VALUE = 1*10**18;
  
    // constant 常量修饰符
    // 最小筹款美元值，由于 convertEthToUsd 的单位是 USD * 10 ** 18（ETH传入参数单位是Wei），所以最小值也要乘以
    // uint256 constant MINIMUM_USD = 10*10**18;

    // uint256 constant TARGET= 1000*10**18;

    address erc20Addr;

    AggregatorV3Interface internal dataFeed;

    // public 修饰符会为变量自动生成一个和变量同名的 getter 函数（读取方法），但不会生成 setter 函数（写入方法）
    // 如果没有定义setter函数就只有合约内部代码和继承合约可以修改这个值
    uint256 public deploymentTimestamp; // 合约部署Unix时间戳，在智能合约中，时间戳通常是以秒为单位的。
    uint256 lockTime;   // 锁定期时间

    bool public getFundSuccess;

    address public owner;

    // 定义一个 event事件，作用是 在区块链日志中记录一条信息，供前端或离线程序监听和读取
    event getFundEvent(
        address indexed funder,
        uint256 amount
    );

    // 构造函数：在合约部署的时候进行一次调用，并且以后再也不会调用
    constructor(uint256 _lockTime, address _dataFeed) {
        dataFeed = AggregatorV3Interface(
            _dataFeed
        );
        owner=msg.sender;

        // block 代表当前交易所在的区块，这里指的是部署合约交易的区块。timestamp为区块的当前时间戳
        deploymentTimestamp = block.timestamp;
        lockTime=_lockTime;
    }

    // 获取当前 ETH 的 USD 美元价格
    // 链上的智能合约没有办法主动获取链下的任何数据，因为很多计算在不同节点可能会不相同，这就没办法达成共识
    // 因此就需要通过调用代理合约，代理合约去调用聚合合约，而预言机会将常用的数据发送至聚合合约中
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEthToUsd(uint256 ethAmount) internal view returns(uint256){
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        // 精度问题，预言机获取的价格通常是一个8位小数的整数，但是solidity中没有浮点类型，因此结果会乘以10的8次方，所以需要对价格除10的8次方
        // 例如，ETH/USD 价格为 $3,000.12345678 时，answer 会返回 300012345678（即 3000.12345678 * 10^8）。
        return ethAmount * ethPrice / (10 ** 8);
    }


    // 收款函数
    // payable 是一个关键修饰符，用于标记函数或地址能够接收以太币（ETH）。
    // 没有 payable 修饰的函数如果尝试接收 ETH（例如调用时附带 value），交易会 自动回滚。
    function Fund() external payable{
        // require: 如果条件不成立，交易就会回退 revert
        // require(convertEthToUsd(msg.value) >= MINIMUM_USD,"Send more ETH");

        // 锁定期过了就无法再收款
        require(block.timestamp < deploymentTimestamp + lockTime, "window is close");
        uint256 amount = fundersToAmount[msg.sender];
        fundersToAmount[msg.sender] = msg.value+amount;
    }

    function getUsd() public view returns(uint256){
        return uint256(getChainlinkDataFeedLatestAnswer());
    }

    // 合约所有权转移
    function transferOwnership(address newOwner) public {
        require(msg.sender==owner,"this function can only be called by owner");
        owner=newOwner;
    }

    function getOwner() public view returns(address){
        return owner;
    }

    // 提款，合约的所有者才能操作这个函数，只有从其他地址转入这个合约才会定义函数为payable
    // 因为发送 ETH 是合约主动触发的操作，不涉及接收 ETH，只会在具体发送的代码处将address强转为payable
    function getFund() external windowClosed onlyOwner{
        // this 指代当前这个合约
        // require(convertEthToUsd(address(this).balance)>=TARGET,"Target is not reached");

        // getFund只能被合约拥有者调用
        require(msg.sender==owner,"this function can only be called by owner");

        // // 锁定期没过无法提款
        // require(block.timestamp >= deploymentTimestamp + lockTime, "window is not close");

        fundersToAmount[msg.sender]=0;
  
        // address类型需要转换成payable类型，只有payable类型才能进行转账功能
        // transfer: 纯转账函数 将当前合约的balance转到msg.sender中，如果交易失败则会出现回退 revert
        // payable(msg.sender).transfer(address(this).balance);

      
        // send: 纯转账函数，用法和transfer一样，但是会返回一个bool值来告知交易是否成功
        // bool success=payable(msg.sender).send(address(this).balance);
        // require(success,"tx failed");


        // call: 在转账的同时可以处理一些额外的逻辑，官方推荐使用这种调用方式
        // value是要转账的数量，而括号则是要调用的函数
        // 需要注意 当转账成功，但函数调用失败时success会返回false，但是转账已经成功了，如果不对success处理就会导致逻辑出错
        // 对success显式检查才能触发revert

        uint256 balance = address(this).balance;
        (bool success,)=payable(msg.sender).call{value: balance}("");
        require(success,"tx failed");
        getFundSuccess = true;

        // 触发事件，记录日志
        emit getFundEvent(msg.sender, balance);
    }

    // 退款
    function refund() external windowClosed{
        // require(convertEthToUsd(address(this).balance)<TARGET,"Target is reached");
        uint256 amount = fundersToAmount[msg.sender];
        require(amount !=0,"there is no fund for you");
        // require(block.timestamp >= deploymentTimestamp + lockTime, "window is not close");

        // 为了避免重入攻击，即攻击者通过递归调用合约函数，在合约状态未更新前重复提取资金，导致资金被盗
        // 一定要 先更新状态，再执行外部调用。或者使用互斥锁和优先使用高阶抽象
        fundersToAmount[msg.sender]=0;

        (bool success,)=payable(msg.sender).call{value: amount}("");
        require(success,"tx failed");
    }

    function setErc20Addr(address _erc20Addr) external onlyOwner{
        erc20Addr=_erc20Addr;
    }

    function setFunderToAmount(address funder, uint256 amount) external {
        require(msg.sender==erc20Addr, "this function can only be called by erc20Addr");
        // 领取代币后减去相同数量的 eth
        fundersToAmount[funder] -= amount;
    }

    // 修饰器，类似于gin的中间件，通过在函数的定义时加入，可以去除很多重复代码，让逻辑更清晰
    // _; 这个符号表示 继续执行 被修饰函数 的逻辑
    // 如果 _; 放在 modifier 的 结尾（最常见的情况），表示 先执行修饰器的逻辑（如检查条件），再执行被修饰的函数。
    // 如果在开头则是先执行 被修饰的函数。放在中间则可以实现“前后包裹”逻辑
    // 如果 modifier 里没有 _;，那么被修饰的函数的代码会被 完全跳过，除非显式调用
    modifier windowClosed() {
        require(block.timestamp >= deploymentTimestamp + lockTime, "window is not close");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender==owner, "this function can only be called by owner");
        _;
    }
}


