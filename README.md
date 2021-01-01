# idb
一个精致的 IndexDB 库，不要那么复杂，不要那么臃肿，简简单单，灵活好用。
内部采用 Promise 技术对原生 IndexDB 各种回调进行封装，降低了 indexDB 使用难度, 让你的代码更简洁易读。

- [IndexDB中文文档](https://www.bookstack.cn/read/javascript-tutorial/docs-bom-indexeddb.md)

- [Demo](https://aiv367.github.io/idb/demo/index.html)

### 引入库

html
```html
<script src="idb.js"></script>
```

JSModule 
```javascript
// CommonJS
let IDB = require('./idb.js');

// Webpack
import IDB from './idb.js';
```
### 创建数据库

```javascript
let idb = new IDB('mydb', {
	version: 1, //默认是1
	onupgradeneeded: db => { //db: IDBDatabase 对象
		//创建数据仓库，索引等
		//这里创建数据仓库，为什么没有设计成其它库那样json对象配置数据库的形式，是为了应对后续数据库升级后的各种需求
		if (!db.objectStoreNames.contains('dicom')) { //判断表是否存在
			let objectStore = db.createObjectStore('dicom', { keyPath: 'imageId' }); //创建数据仓库
			objectStore.createIndex('imageId', 'imageId', { unique: false }); //创建索引
		}
	}
    //还有一些其它属性，看源码
});

```

### 新增记录

```javascript
idb.store('dicom').add({ imageId: 1, data: '我是数据字段' }).then(res => { console.log('add:', res) })
```

### 修改记录

```javascript
idb.store('dicom').update({imageId: 1, data: '新文本'}).then(res=>{console.log('update:', res)})
```

### 删除记录

```javascript
idb.store('dicom').remove(1).then(res => { console.log('remove:', res) }) //通过remove参数，删除索引值是 1 的记录
idb.store('dicom').range(IDBKeyRange.only(1)).remove().then(res => { console.log('remove:', res) }) //通过设置range, 删除索引值是 1 的记录
```

### 清空表

```javascript
idb.store('dicom').clear().then(res => { console.log('clear:', res) });
```

### 查询一条记录

```javascript
idb.store('dicom').get(2).then(res => console.log(res)); //通过设置get参数，查找主键是2的记录
idb.store('dicom').range(IDBKeyRange.only(2)).get().then(res => console.log(res)); //通过设置range，查找主键是2的记录
idb.store('dicom').index('imageId').get(2).then(res => console.log(res));//设置索引imageId，查找主键是2的记录
```

### 查询一组记录

```javascript
idb.store('dicom').gets().then(res => console.log(res)); //查询全部记录
idb.store('dicom').gets('prev').then(res => console.log(res)); //反向查询全部记录
idb.store('dicom').limit(10, 20).gets().then(res => console.log(res)); //查询全部记录, 从第10位置开始的20条记录，limit 主要用于分页
idb.store('dicom').range(IDBKeyRange.bound(100, 999)).limit(10, 20).gets().then(res => console.log(res)); //查询主键100 - 999区间，从第10位置开始的20条记录。limit 主要用于分页
idb.store('dicom').range(IDBKeyRange.bound(10, 20)).gets().then(res => console.log(res)); //查询主键10-20之间的数据
idb.store('dicom').range(IDBKeyRange.lowerBound(10)).gets().then(res => console.log(res)); //查询主键下限，大于等于10的数据
```

### 关于查询中的range 参数，使用原生的 IDBKeyRange对象，具体IDBKeyRange说明请参考：
[https://www.bookstack.cn/read/javascript-tutorial/spilt.11.docs-bom-indexeddb.md](https://www.bookstack.cn/read/javascript-tutorial/spilt.11.docs-bom-indexeddb.md)

```javascript
IDBKeyRange.upperBound(x);// All keys ≤ x
IDBKeyRange.upperBound(x, true);// All keys < x
IDBKeyRange.lowerBound(y);// All keys ≥ y
IDBKeyRange.lowerBound(y, true);// All keys > y
IDBKeyRange.bound(x, y);// All keys ≥ x && ≤ y
IDBKeyRange.bound(x, y, true, true);// All keys > x &&< y
IDBKeyRange.bound(x, y, true, false);// All keys > x && ≤ y
IDBKeyRange.bound(x, y, false, true);// All keys ≥ x &&< y
IDBKeyRange.only(z);// The key = z
```

### 获得数据库 IDBDatabase 对象，实现更复杂的操作
```javascript
idb.db.then(db=>{
	//db 这里得到 IDBDatabase 对象，可以做更多的原生操作
});
```