
// IDBKeyRange.lowerBound()：指定下限。
// IDBKeyRange.upperBound()：指定上限。
// IDBKeyRange.bound()：同时指定上下限。
// IDBKeyRange.only()：指定只包含一个值。

class IDB {

	constructor(databaseName, opts) {

		this.opts = Object.assign({
			version: 1,
			onupgradeneeded() { },
			onsuccess() { },
			onerror() { },
			blocked() { }
		}, opts)

		this.db = undefined; //IDBDatabase
		this.request = undefined; //IDBRequest

		let resolve, reject;
		this.dbPromise = new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});

		let request = window.indexedDB.open(databaseName, this.opts.version);

		request.onupgradeneeded = evt => {
			this.opts.onupgradeneeded(evt.target.result);
		};

		request.onsuccess = evt => {

			let db = evt.target.result;
			this.db = db;
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

	}

	store(storeName) {

		let that = this;

		let params = {
			index: undefined, //索引
			range: undefined, //范围 IDBKeyRange
			filter: undefined, //过滤函数
			limit: [0, 0],//
		};

		return {

			add(data) {

				return new Promise((resolve, reject) => {

					that.dbPromise.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).add(data);
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});

			},

			update(data) {

				return new Promise((resolve, reject) => {

					that.dbPromise.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).put(data);
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});

			},

			remove(key) {

				return new Promise((resolve, reject) => {

					that.dbPromise.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).delete(key !== undefined ? key : params.range);
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});
			},

			clear(){

				return new Promise((resolve, reject) => {

					that.dbPromise.then(db => {
						let request = db.transaction([storeName], 'readwrite').objectStore(storeName).clear();
						request.onsuccess = resolve;
						request.onerror = reject
					});

				});

			},

			//获得多条
			gets(resultType = 'rows') { //resultType = rows | single | count

				return new Promise((resolve, reject) => {

					that.dbPromise.then(db => {

						let result = resultType === 'count' ? 0 : [];
						let request = db.transaction([storeName], 'readonly').objectStore(storeName);
						let isAdvancing = false; //是否移动游标
						let start = params.limit[0]; //limit start, length
						let length = params.limit[1]; //limit start, length

						if (params.index) {
							request = request.index(params.index);
						}

						request = request.openCursor(params.range);

						request.onsuccess = evt => {

							let cursor = evt.target.result;

							//从此处开始
							if (!isAdvancing && cursor && start) {
								isAdvancing = true;
								cursor.advance(start);
								return;
							}

							if (cursor) {

								if (!params.filter || (params.filter && params.filter(cursor.value) === true)) {

									if (resultType === 'count') {
										result++;
									} else {
										result.push(cursor.value);
									}
								}

								if (resultType === 'single') {
									resolve(result[0]);
								} else {

									let count = resultType === 'rows' ? result.length : result;

									if (length && count >= length) {
										resolve(result);
									} else {
										cursor.continue();
									}
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
				return this.gets('single');
			},

			//统计记录数
			count(start, length){
				return this.gets('count');
			},

			//设置索引
			index(index) {
				params.index = index;
				return this;
			},

			//https://www.bookstack.cn/read/javascript-tutorial/spilt.11.docs-bom-indexeddb.md
			//查询范围 IDBKeyRange
			range(range) {
				params.range = range;
				return this;
			},

			//结果过滤器
			filter(filter) {
				params.filter = filter;
				return this;
			},

			//设置分页
			limit(start, length){
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