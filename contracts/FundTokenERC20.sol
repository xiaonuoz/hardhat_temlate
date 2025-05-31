// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ERC20: Fungible Token 通证可以交换，并且每个通证不是唯一性的，每个通证都没区别，可以切分
// ERC721: NFT - Non-Fungible Token 通证不可交换，通证具有唯一性和独特印记，不可切分

// abstrace 抽象合约 与 virtual 虚函数一起使用，类似于golang的定义接口
// 当函数定义为 virtual 时，如果没有为这个虚函数编写函数体，那么继承这个抽象合约的子合约就必须对虚函数进行重写实现
// 但是当虚函数有函数体时，子合约就可写可不写，不写就会使用虚函数默认的函数体逻辑，反之就使用子合约自己重写的逻辑
// 对虚函数进行重写操作时，函数定义需要增加 override 关键字
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./FundMe.sol";

// is 就是继承其他合约
contract FundTokenERC20 is ERC20 {
    FundMe fundMe;

    // 在当前合约的构造函数声明后，用 父合约名(参数) 的方式调用父合约的构造函数
    // 先执行父合约的构造函数，再执行当前合约的构造函数，且父合约的执行顺序是 is 之后继承的顺序
    // 如果父合约的构造函数带参数，子合约必须显式调用，否则会编译错误。没有参数可以不写，Solidity 会自动调用，但显式写出更清晰。
    constructor(address fundMeAddr,uint256 initialSupply) ERC20("Gold", "GLD") {
        // 部署合约时直接铸造相应的代币，用户ETH购买时转账给他
        // 也可以不铸造，用户ETH购买时再为用户铸造代币
        _mint(msg.sender, initialSupply);

        // 这里的FundMe(Addr)是一种类型转换【不同于new FundMe(Addr)】，相当于把 已经部署好的FundMe合约地址 转换为 FundMe合约类型 对应的实例，这样就可以调用其他部署好的合约的方法
        fundMe=FundMe(fundMeAddr);
    }

    // 铸造代币函数，让FundMe的参与者，基于 mapping 来领取相应数量的通证
    function mint(uint256 amountToMint) public getFundSuccess{
        // 用户支付的原生币数量不能小于要铸造的数量
        // 这里mapping使用圆括号是因为 public 自动生成了一个getter函数
        // require(fundMe.fundersToAmount(msg.sender) >= amountToMint, "You cannot mint this many tokens");
        _mint(msg.sender, amountToMint);
        // fundMe.setFunderToAmount(msg.sender, amountToMint);
    }

    // 代币转账功能已经在ERC20.sol中实现  _transfer(from, to, value);

    function claim(uint256 amount) public getFundSuccess{
        // 判断当前用户是否有足够的代币
        require(balanceOf(msg.sender)>= amount, "You do not have enough ERC20 tokens");

        // 烧掉对应数量的代币
        _burn(_msgSender(), amount);
    }

    modifier getFundSuccess(){
        require(fundMe.getFundSuccess(),"Not getfund success");
        _;
    }
}

