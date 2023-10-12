// 导入 lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const filePath = path.join(__dirname, 'db.json');
const adapter = new FileSync(filePath);
const db = low(adapter);

// Set some defaults
// db.defaults({ chunk: [] }).write();

// // Add a post
// db.get('posts').push({ id: 1, title: 'lowdb is awesome' }).write();

// // Set a user using Lodash shorthand syntax
// db.set('user[name]', 'typicode').write();

module.exports = db;
