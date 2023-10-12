import { UPLOAD_INFO, CHUNK_SIZE } from './config';
import axios from 'axios';
import SparkMD5 from 'spark-md5';
(() => {
  const Progress = document.querySelector('#uploadProgress');
  const videoUploader = document.querySelector('#videoUploader');
  const uploadBtn = document.querySelector('#uploadBtn');
  const uploadInfo = document.querySelector('#uploadInfo');

  const init = () => {
    bindEvent();
  };

  function bindEvent() {
    uploadBtn.addEventListener('click', uploadVideo, false);
  }
  async function uploadVideo() {
    // const file = videoUploader.files[0];
    const {
      files: [file],
    } = videoUploader;
    const { name, type, size } = file || {};
    if (!file) {
      uploadInfo.innerText = UPLOAD_INFO.NO_FILE;
      return;
    }
    if (!file.type.startsWith('video/')) {
      uploadInfo.innerText = UPLOAD_INFO.INVALID_TYPE;
      return;
    }
    // 创建分片，返回的是一个分片数组
    const chunks = createChunks(file, CHUNK_SIZE);
    // hash文件确保准确性、唯一性
    const result = await hash(chunks);
    // 上传了的大小（暂时没有使用到）
    let uploadedSize = 0;
    // 上传进度条
    Progress.max = chunks.length;
    uploadInfo.innerText = '';
    // 定义变量接收接口返回结果（打算变成一个数组用来接收接口返回上传成功的切片名称push进去）
    // 为以后做断点续传，秒传功能铺垫
    let uploadRes = null;
    // 分片上传
    for (let i = 0; i < chunks.length; i++) {
      const formData = createFormData({
        name,
        type,
        size: chunks.length,
        // hashStr: result,
        // hash加上下标，好区分文件
        hashStr: result + '_' + i,
        // 分片上传
        file: chunks[i],
        // 暂时无用
        uploadedSize,
      });
      try {
        uploadRes = await axios.post(
          'http://localhost:3333/upload_video',
          formData
        );
        console.log(uploadRes);
      } catch (error) {
        return (uploadInfo.innerText = '上传失败' + error.message);
      }
      Progress.value = i;
      uploadedSize++;
    }
    Progress.value++;
    uploadInfo.innerText = '上传成功';
  }

  // 分块函数
  function createChunks(file, chunkSize) {
    const result = [];
    for (let i = 0; i < file.size; i += chunkSize) {
      result.push(file.slice(i, i + chunkSize));
    }
    return result;
  }

  // 计算文件MD5函数
  // 如果是十分巨大的文件，需要使用web worker单独开一个线程
  function hash(chunks) {
    // 使用promise异步去计算
    return new Promise(resolve => {
      const spark = new SparkMD5();
      function _read(i) {
        if (i >= chunks.length) {
          resolve(spark.end());
          return;
        }
        const blob = chunks[i];
        const reader = new FileReader();
        reader.onload = e => {
          const bytes = e.target.result; //读取到的字节数组
          spark.append(bytes);
          _read(i + 1);
        };
        reader.readAsArrayBuffer(blob);
      }
      _read(0);
    });
  }

  // 文件提交表单函数
  function createFormData({ name, type, size, hashStr, file, uploadedSize }) {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('type', type);
    fd.append('size', size);
    fd.append('hashStr', hashStr);
    fd.append('uploadedSize', uploadedSize);
    fd.append('file', file);
    return fd;
  }
  init();
})();
