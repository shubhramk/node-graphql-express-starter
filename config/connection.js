const DB_NAME = 'bt';
const DB_USER = 'btuser';
const DB_PWD  = 'btuser';
const DB_URL = `mongodb+srv://${DB_USER}:${DB_PWD}@bt-pljwq.mongodb.net/${DB_NAME}?authSource=admin&replicaSet=bt-shard-0&readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=true`;

module.exports  = {
    DB_URL
};