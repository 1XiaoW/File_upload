const fs = require('fs');
// let chunkLength = 93;
// for (let i = 0; i <= 93; i++) {
//   const rs = fs.createReadStream('./efff0e82311482d950bf145e967da5c2_' + i);
//   if (i === 0) {
//     rs.on('data', chunk => {
//       fs.writeFileSync('./yingjiang.mp4', chunk);
//     });
//   } else {
//     rs.on('data', chunk => {
//       fs.appendFileSync('./yingjiang.mp4', chunk);
//     });
//   }
// }

// 创建可写流
const writeStream = fs.createWriteStream('./yingjiang.mp4', { flags: 'a' });

(async () => {
  for (let i = 0; i <= 93; i++) {
    const rs = fs.createReadStream('./efff0e82311482d950bf145e967da5c2_' + i);

    for await (const chunk of rs) {
      // 将数据写入文件
      writeStream.write(chunk);
      console.log(chunk, '这是第' + i);
    }

    if (i === 93) {
      // 最后一个文件读取完毕后，执行 end 回调
      writeStream.end();
      console.log('写入完成');
    }
  }
})();
