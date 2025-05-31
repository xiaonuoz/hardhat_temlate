// 可以在index.js中导入所有task，然后hardhat.config.js中引入这个index.js文件，这样就可以在hardhat中使用所有的task了
// 引入另一个 JS 文件中的模块内容，并将其挂载到当前模块的 exports 对象上，名称为 deployFundMe。
exports.deployFundMe = require("./tasks/deploy-fundme.js");
// exports.test = require("./tasks/test.js");

// 导入文件夹时会自动找文件夹下的index.js文件
// require("./tasks");