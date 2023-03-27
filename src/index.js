
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const types = require('@babel/types');
const generator = require("@babel/generator").default;
const { VM } = require('vm2');

const environment = fs.readFileSync(path.resolve(__dirname, './environment.js'), {
    encoding: 'utf-8'
});

const source = fs.readFileSync(path.resolve(__dirname, './source/source.js'), {
    encoding: 'utf-8'
});

const whiteModules = ['sign'];
const ast = parser.parse(source);

/**
 * @type {import('@babel/types').ObjectExpression}
 */
var modules = ast.program.body[0].expression.argument.arguments[0]; // 全部模块
let next = false;

do {
    next = false;

    for (let item of modules.properties) {

        let objKey = item.key.value ?? item.key.name;

        if (whiteModules.includes(objKey)) continue; // 白名单内的模块不进行处理

        let func = item.value;
        if (types.isFunctionExpression(func)) {
            if (Array.isArray(func.body.body) && func.body.body.length > 0) {
                let backOfBody = func.body.body;
                func.body.body = []; // 清空函数体

                const newCode = generator(ast).code;

                try {
                    new VM().run(`
                    ${environment}
                    ${newCode}

                    var sign = getModel("sign");
                    var key = sign('daofeng');
                    console.log("签名结果：" + key);
                    console.log("正确结果：e541c26007f7791ffaff528d91059119"); 
                    if(key != 'e541c26007f7791ffaff528d91059119'){
                        throw new Error('计算结果不正确');
                    }

                    `
                    );
                    next = true; // 一旦有模块被删除，就需要再删除一轮
                    console.log(`恭喜：[${objKey}] 删除成功`);
                } catch (e) {
                    e instanceof Error && console.error(e.message);
                    func.body.body = backOfBody; // 如果删掉就报错，就给放回去
                }
            }
        }
    }

    // 过滤掉空数组模块(需要在模块分发处加上兼容空模块的代码)
    modules.properties = modules.properties.filter(item => {
        let func = item.value;
        if (Array.isArray(func.body.body)) {
            return func.body.body.length > 0;
        } else
            return true;
    });
} while (next);



fs.writeFileSync(
    path.resolve(__dirname, 'source/new-mini.js'),
    generator(ast, {
        minified: true
    }).code,
    {
        encoding: 'utf-8'
    }
);

fs.writeFileSync(
    path.resolve(__dirname, 'source/new.js'),
    generator(ast, {
        minified: false
    }).code,
    {
        encoding: 'utf-8'
    }
);

console.log('任务完成');