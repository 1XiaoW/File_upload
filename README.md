# File_upload
大文件分片上传Demo

### 已完成
-- 上传文件进行分片上传，会先保存每一个分片在server/upload_video文件中，然后再进行合并。
-- 使用lowdb进行数据保存

### 未完成
-- 文件断点续传秒传
-- 可以在lowdb保存字段添加isMerge：boolean，进行文件是否已经完成分片合并。
-- 新增新的接口查询文件hash是否已有保存，再查询分片是否完整，是否需要断点续传。isMeger是否为true有直接返回保存文件的路径（秒传）
-- 后端还需返回已保存在本地的分片的文件名给前端。前端再将返回的文件名push进特定数组，方便以后进行断点续传
-- 还有很多功能优化添加的地方，例如并发上传，设置一次性请求上传大小。
-- 需要的可以自行修改或者联系我添加（有空的话）

### 采用原生js编写，express
