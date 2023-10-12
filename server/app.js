// 导入express服务器框架
const express = require('express');
// 请求体解析模块
const bodyParser = require('body-parser');
// formdata格式请求解析，文件上传获取：req.files
const uploader = require('express-fileupload');

const path = require('path');
const fs = require('fs');

const app = express();
// 引入lowdb
const db = require('./db/lowdb');
// 端口设置
const PORT = 3333;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(uploader());
app.use('/', express.static('upload_temp'));

// 跨域请求，也可以引入cors进行跨域访问
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST,GET');
  next();
});

// 上传文件请求接口
app.post('/upload_video', (req, res) => {
  // 解构出需要使用的属性
  const { name, type, size, hashStr, uploadedSize } = req.body;
  const { file } = req.files;
  if (!file) {
    res.send({
      code: 1001,
      msg: '没有文件上传',
    });
    return;
  }
  if (!type.startsWith('video/')) {
    res.send({
      code: 1002,
      msg: '上传文件类型错误，请选择视频文件',
    });
    return;
  }
  const filePath = path.resolve(__dirname, './upload_temp/' + hashStr);
  /*  以下代码是直接合并完成一个视频文件再保存到本地
  if (uploadedSize !== '0') {
    console.log(fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) {
      res.send({
        code: 1003,
        msg: '上传文件不存在',
      });
      return;
    }

    fs.appendFileSync(filePath, file.data);
    res.send({
      code: 0,
      msg: 'Appended',
      video_url: 'http://localhost:3333' + hashStr,
      // 还需返回上传成功的文件分片，在前端push进数组
    });
    return;
  } */

  // 将每一个分片都保存到本地
  fs.writeFileSync(filePath, file.data);
  res.send({
    code: 0,
    msg: '文件保存成功',
  });

  // 保存文件为每一分片，当分片保存完时，进行长度校验 检查是否有上传失败的分片
  // 通过lowdb 保存上传成功的分片名称，到时候前端断点续传时，会请求获取已上传成功的分片
  // 最后进行过滤将未上传的分片进行上传
  const dbTableName = `${hashStr.split('_')[0]}Chunks`;

  // 检查表是否存在，不存在则创建
  if (!db.has(`ChunkList.${dbTableName}`).value()) {
    db.set(`ChunkList.${dbTableName}`, []).write();
  }

  // 检查数据是否已存在
  const existingData = db
    .get(`ChunkList.${dbTableName}`)
    .find({ id: hashStr.split('_')[1] })
    .value();

  // 如果不存在，则向表中添加新数据
  if (!existingData) {
    db.get(`ChunkList.${dbTableName}`)
      .push({ id: hashStr.split('_')[1], hashStr })
      .write();
  }

  // 判断是否有上传完成进行分片合并
  const ChunkListLength = db.get(`ChunkList.${dbTableName}`).value().length;
  if (hashStr.split('_')[1] == size - 1) {
    console.log(1);
    if (ChunkListLength === size - 0) {
      // 合并分片
      // 创建可写流
      const writeStream = fs.createWriteStream(
        `./upload_temp/${dbTableName}.mp4`,
        {
          flags: 'a',
        }
      );
      // 写成立即函数用async await包裹，
      // 因为将rs获取到的数据流写入可写流是异步的无法保证循环的执行顺序
      (async () => {
        for (let i = 0; i < ChunkListLength; i++) {
          let filesPath = path.join(
            __dirname,
            `/upload_temp/${hashStr.split('_')[0]}_${i}`
          );
          const rs = fs.createReadStream(filesPath);

          for await (const chunk of rs) {
            // 将数据写入文件
            writeStream.write(chunk);
            console.log(chunk, '这是第' + i);
          }

          if (i === ChunkListLength - 1) {
            // 最后一个文件读取完毕后，执行 end 回调
            writeStream.end();
            console.log('写入完成');
          }
        }
      })();
    }
  }
});

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});
