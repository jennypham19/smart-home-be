/*
  Tạo kết nối DB một lần duy nhất, tự động nạp mọi model trong thư mục models, đầu quan hệ giữa chúng, rồi export ra một object db duy nhất để các module khác import vào dùng chung.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
/**
 * basename = 'index.js' — lát nữa dùng để file này tự loại trừ chính nó khỏi vòng lặp nạp model, tránh require đệ quy vô hạn.
 * env đọc NODE_ENV, không có thì mặc định 'development'.
 * config lấy đúng nhánh môi trường trong config/index.js:82-83. Với development, nó ra object { username, password, database, host, port, dialect: 'postgres' }.
 * db = {} là cái giỏ rỗng, sẽ được nhét model vào.
 */
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configFromFile = require(__dirname + '/../config/index.js');
const config = configFromFile[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file !== 'enum.js' &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.OP = Sequelize.Op;

module.exports = db;
