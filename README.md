​		该项目为在JS逆向中，抠出来一大堆webpack模块后，里面其实有非常多的模块是用不上的，需要剥离，本项目的职责正是干这个的。



- `src/source.js`存放需要剥离模块的代码，该文件内的代码仅能有一句`expression`，也就是只能由一句代码，代码的模式为典型的`webpack`打包后的数据格式

  ```javascript
  !function (t) {
   	var e = {};
      function n(r) {
          if (e[r]) return e[r].exports;
          var i = e[r] = {
              i: r,
              l: !1,
              exports: {}
          };
          // 需要添加上这样一段代码，用来兼容无用的空模块
  		if(t[r] === null || t[r] === undefined){
  			t[r] = function(){}
  		}
          return t[r].call(i.exports, i, i.exports, n),
              i.l = !0,
              i.exports;
      }
  }({
  	'module1':function(a,b,c){ ... },
  	'module2':function(a,b,c){ ... },
  	'module3':function(a,b,c){ ... },
      ...
  });
  ```

- `src/enviroment.js`存放运行时需要补充的环境信息

  ```javascript
  // 例如一些环境信息，不能直接写在source.js内，必须写在该文件内
  window = {};
  navigator = {};
  ...
  ```

- 在`new VM().run(...)`处编写测试代码
- 执行`npm run test`
- 一切顺利的话会在`source`文件夹下得到两个新文件`new.js`和`new-mini.js`，这两个文件就是瘦身过后的代码，一个压缩了，一个没压缩
