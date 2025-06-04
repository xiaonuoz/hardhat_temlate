module.exports=async ({})=> {
    // 禁止不加 tags 执行，当不加tags时，是按deploy目录下顺序执行的，那么第一个直接报错就能保证必须加tags
    // throw new Error(
    //     "必须指定 --tags 参数，否则不允许执行部署！"
    // );
}