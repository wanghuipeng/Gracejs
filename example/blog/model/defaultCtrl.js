'use strict';

const crypto = require('crypto');
const key = "http://mlsfe.biz/private_key"; //加密的秘钥

function _deciph(user_id) {
  let decipher = crypto.createDecipher('aes-256-cbc', key);
  let dec = decipher.update(user_id, 'hex', 'utf8');
  dec += decipher.final('utf8'); //解密之后的值

  return JSON.parse(dec);
}

function _getItem(arr) {
  var result = {};
  arr.forEach(function(item) {
    result[item.id] = item;
  });
  return result;
}

function _mongoMap(opt) {
  console.log(opt)
}

module.exports = function*() {
  let UserModel = this.mongo('User');
  let CateModel = this.mongo('Category');
  let LinkModel = this.mongo('Link');

  this.siteInfo = {
    path: this.path,
    title: '美丽说商业前端团队博客-http://mlsfe.biz',
    year: new Date().getFullYear()
  }


  let mongoResult = yield [{
    model: UserModel,
    fun: 'list'
  }, {
    model: CateModel,
    fun: 'list'
  }, {
    model: LinkModel,
    fun: 'list'
  }].map(this.mongoMap);

  this.siteInfo.users = mongoResult[0];
  this.siteInfo.users_item = _getItem(this.siteInfo.users);

  this.siteInfo.cates = mongoResult[1];
  this.siteInfo.cates_item = _getItem(this.siteInfo.cates);

  this.siteInfo.links = mongoResult[2];



  let user_id = this.cookies.get('USER_ID');
  let user_info = {};

  // 如果是api开头path的话， 就认为是第三方请求， user_id密钥从请求信息中获取
  if (this.path.indexOf('/api/') == 0) {
    user_id = user_id || this.query.secret_id || this.request.body.secret_id;
  }

  if (!user_id) {
    return;
  }

  try {
    user_info = _deciph(user_id);
  } catch (err) {
    console.log(err)
  }

  if (!user_info.user_id || user_info.ip !== this.request.ip || user_info.time < Date.now()) {
    return;
  }

  this.userInfo = yield this.mongo('User', {}).getUserById(user_info.user_id);
}