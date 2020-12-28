/**
  * IndexDB库
  * @author 大花猫花大
  * @date 2020-12-28
  * @version 1.0
  * https://github.com/aiv367/idb
  */
class IDB {

 	constructor(databaseName, opts) {

		this.opts = Object.assign({
			version: 1,
			onupgradeneeded() { },
			onsuccess() { },
			onerror() { },
			blocked() { }
		}, opts)

		this.request = undefined; //IDBRequest
		this.db = undefined; //IDBDatabase promise

		if ((window.mozIndexedDB || window.webkitIndexedDB)) {
			console.log('不支持indexDB');
			return false;
		}

		this.open(databaseName, this.opts.version);

	}

	open(databaseName, version) {

		let resolve, reject;
		this.db = new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});

		let request = window.indexedDB.open(databaseName, version);

		request.onupgradeneeded = evt => {
			this.opts.onupgradeneeded(evt.target.result);
		};

		request.onsuccess = evt => {

			let db = evt.target.result;
			this.opts.onsuccess(db);

			//避免多窗口时造成数据错误
			db.onversionchange = evt => {
				db.close();
				alert("IndexDB: 页面内容已过期，请刷新");
			}

			resolve(db);
		};

		request.onerror = evt => {
			this.opts.onerror(evt.target.error);
			reject(evt.target.error);
		};

		request.blocked = evt => {
			this.opts.blocked(evt);
		};

		this.request = request;

		return this.request;

	}

	close(){
		return new Promise((resolve, reject) => {

			this.db.then(db => {
				db.close();
			});

		});
	}

	store(storeName) {

		let that = this;

		let params = {
			index: undefined, //索引
			range: undefined, //范围 IDBKeyRange
			limit: [0, 0],

		};

		return {

			add(data) {

				return new Promise((resolve, reject) => {

					that.db.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).add(data);
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});

			},

			update(data) {

				return new Promise((resolve, reject) => {

					that.db.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).put(data);
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});

			},

			remove() {

				return new Promise((resolve, reject) => {

					//没有条件终止
					if (!params.range) {
						resolve(false);
						return;
					}

					that.db.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).delete(params.range);
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});
			},

			clear() {

				return new Promise((resolve, reject) => {

					that.db.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).clear();
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});

			},

			//获得多条
			//direction = next（从头开始向后遍历）、nextunique（从头开始向后遍历，重复的值只遍历一次）、prev（从尾部开始向前遍历）、prevunique（从尾部开始向前遍历，重复的值只遍历一次）。
			gets(direction = 'next') {

				return new Promise((resolve, reject) => {

					that.db.then(db => {

						let request = db.transaction([storeName], 'readonly').objectStore(storeName);
						let isAdvancing = false; //是否移动游标
						let result = [];

						let start = params.limit[0]; //limit start, length
						let length = params.limit[1]; //limit start, length

						if (params.index) {
							request = request.index(params.index);
						}

						request = request.openCursor(params.range, direction);

						request.onsuccess = evt => {

							let cursor = evt.target.result;

							//移动游标从此处开始
							if (!isAdvancing && cursor && start) {
								isAdvancing = true;
								cursor.advance(start);
								return;
							}

							if (cursor) {

								result.push(cursor.value);

								if (length && result.length >= length) {
									resolve(result);
								} else {
									cursor.continue();
								}

							} else {
								resolve(result);
							}
						};

						request.onerror = evt => {
							reject(evt);
						};

					});
				});

			},

			//获得单条
			get() {
				return new Promise((resolve, reject) => {

					//没有条件终止
					if (!params.range) {
						resolve('');
						return;
					}

					that.db.then(db => {

						let request = db.transaction([storeName], 'readonly').objectStore(storeName);

						if (params.index) {
							request = request.index(params.index);
						}

						request = request.openCursor(params.range);

						request.onsuccess = evt => {
							resolve(evt.target.result.value);
						};

						request.onerror = evt => {
							reject(evt);
						};

					});
				});
			},

			//统计记录数
			count() {

				return new Promise((resolve, reject) => {

					that.db.then(db => {

						let request = db.transaction([storeName], 'readonly').objectStore(storeName);

						if (params.index) {
							request = request.index(params.index);
						}

						request = request.count(params.range);//获得总记录数

						request.onsuccess = evt => {
							resolve(evt.target.result);
						};

						request.onerror = evt => {
							reject(evt);
						};

					});
				});
			},

			//设置索引
			index(index) {
				params.index = index;
				return this;
			},

			//https://www.bookstack.cn/read/javascript-tutorial/spilt.11.docs-bom-indexeddb.md
			// IDBKeyRange.lowerBound()：指定下限。
			// IDBKeyRange.upperBound()：指定上限。
			// IDBKeyRange.bound()：同时指定上下限。
			// IDBKeyRange.only()：指定只包含一个值。
			//查询范围 IDBKeyRange
			range(range) {
				params.range = range;
				return this;
			},

			//设置分页
			limit(start, length) {
				params.limit = [start, length];
				return this;
			}

		};

	}

}

IDB.prototype.removeDatabase = function (dbName) {
	this.request.removeDatabase(dbName);
}

export default IDB;