---
layout: post
title: Frida常用的api大全
tags: [blog]
author: author1
---
# Frida常用的api大全（准确说是一些功能的实现）

> 本文复制自：[frida常用api大全-万物皆可逆向](https://onejane.github.io/2021/11/13/frida%E5%B8%B8%E7%94%A8api%E5%A4%A7%E5%85%A8/#%E7%AF%87%E5%B9%85%E6%9C%89%E9%99%90)（因为原文需要扫码观看，复制下来以便后续观看）
>
> 后文中有一些地方加上了自己的使用方法

# java类型

## 基础类型

| java type   | 语法                        |
| :---------- | :-------------------------- |
| int类型     | `int`                     |
| float类型   | `float`                   |
| boolean类型 | `boolean`                 |
| string类型  | `java.lang.String`        |
| byte类型    | `[B`                      |
| char类型    | `[C`                      |
| list结构    | `java.util.List`          |
| 安卓上下文  | `android.content.Context` |

| 符号       | 作用                   |
| :--------- | :--------------------- |
| `$init`  | hook构造函数           |
| `$new()` | 实例化对象用户主动调用 |

## 数组

frida中数组格式 `[java.lang.String;`

| **java type** | **so type**    |
| ------------------- | -------------------- |
| `int`             | `I`                |
| `float`           | `F`                |
| `boolean`         | `Z`                |
| `string`          | `java.lang.String` |
| `byte`            | `B`                |
| `long`            | `J`                |
| `short`           | `S`                |
| `double`          | `D`                |
| `char`            | `C`                |

```js
// byte array to string
// 方法一
var JavaString = Java.use("java.lang.String");
JavaString.$new('byte array').toString();

// 方法二
var ByteString = Java.use("com.android.okhttp.okio.ByteString");
// 转成 hex 在转 string
ByteString.of('byte array').hex();

// 使用 Java.cast 把 java byet 转成 java Object
var javaBytes = Java.use('java.lang.String').$new("aaaaa").getBytes();
var javaBytesClass = Java.cast(javaBytes, Java.use('java.lang.Object')).getClass();

// 使用 Java.array 把 js array 转成 java Object array
var params = [
    Java.use('java.lang.String').$new('str1'),
    Java.use('java.lang.String').$new('str2'),
    Java.use('java.lang.Boolean').$new(false),
    Java.use('java.lang.Integer').$new(0)
];
var ps = Java.array('Ljava.lang.Object;', params);
```



# 动静态函数

## 静态函数 use

```js
function static() {
    Java.perform(function () {//只要是java的代码都要跑在Java.perform里面
        // hook
        Java.use("com.example.junior.util.Utils").dip2px.implementation = function (context, float) {
            //return null;
            var result = this.dip2px(context, 100)
            console.log("context,float,result  ==> ", context, float, result);
            // 打印log
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            return 26;
        }
       
		Java.use('com.xx.app.ShufferMap').show.implementation = function (map) {
       		 console.log(JSON.stringify(map));
			var hm = Java.use('java.util.HashMap').$new();
			hm.put("user","dajianbang");
			hm.put("pass","87654321");
			hm.put("code","123456");
			return this.show(hm);
		}   
      
        var myBytes = StringClass.$new("Hello World").getBytes();
        var base64Class = Java.use("android.util.Base64");
        // 主动调用
        var result = Java.use("com.xiaojianbang.app.RSA").encrypt(myBytes);
        console.log("result is :", result);
        console.log(JSON.stringify(result));
        console.log("base64 result is :", base64Class.encodeToString(result,0));      
      
        Java.use("java.lang.String").valueOf(1); 
      
    })
}
```


## 实例函数 choose

```js
function dynamic(){
    Java.perform(function(){
    	// 主动调用 函数
        Java.choose("com.example.junior.CalculatorActivity",{
            onMatch:function(instance){
                console.log("found instance =>",instance);
                console.log("instance showText is =>",instance.clear("666"))
                console.log("instance showText is =>",instance.showText.value)
            },onComplete:function(){
                console.log('Search complete')
            }
        })  
        Java.choose("com.xiaojianbang.app.Money",{
            onMatch : function(instance){
                console.log("find it!!", instance.getInfo());
            }, 
            onComplete: function(){
                console.log("compelete!!!");
            }
        })
        // $new 实例化类
        Java.use("java.lang.String").$new().toString();
    })
}
```

# so导出函数

```js
var native_func = Module.findExportByName("${so file name}", "${so export function name}");

Interceptor.attach(native_func, {
    // 函数开始
    onEnter: function (args) {},
    // 函数结束
    onLeave: function (return_val) {}
});
```



# so偏移地址

```js
var native_func_addr = Module.findBaseAddress("${so file name}");
var native_addr = native_func_addr.add(${so 函数偏移地址});

Interceptor.attach(native_addr, {
    // 函数开始
    onEnter: function (args) {
        // 读取 r0 的数据
        this.context.r0.readCString()
    },
    // 函数结束
    onLeave: function (return_val) {}
});
```





# JNIEnv函数

```js
// 获取 JNIEnv
var env = Java.vm.getEnv();
var jstring = env.newStringUtf('xiaojianbang');
```



# 动静态变量修改

静态变量 use

```js
function staticField(){
    Java.perform(function(){
        var divscale = Java.use("com.example.junior.util.Arith").DEF_DIV_SCALE.value;
        console.log("divscale1 is =>",divscale);
        Java.use("com.example.junior.util.Arith").DEF_DIV_SCALE.value=20;
        divscale = Java.use("com.example.junior.util.Arith").DEF_DIV_SCALE.value;
        console.log("divscale2 is =>",divscale);
    })
}
```



动态变量 choose

```js
function dynamicField(){
    Java.perform(function(){
        Java.choose("com.example.junior.CalculatorActivity",{
            onMatch:function(instance){
                console.log("found instance =>",instance);
                console.log("instance showText is =>",instance.showText.value)
                instance.showText.value = "123"
            },onComplete:function(){
                console.log('Search complete')
            }
        })
    })
}
```



# 构造函数 实例化

```js
// Utils.test(new Money(200，"美元"))  
Java.perform(function () {
    var money = Java.use('com.xx.app.Money')  // 如果要自定义实例化就要获取并重写
    var utils = Java.use('com.xx.app.Utils');
    utils.test.overload("com.xx.app.Money").implementation = function (obj) { 
        var myBytes = StringClass.$new("Hello World").getBytes();
        // 重新实例化  $new()
        var mon = money.$new(999,'我的天')
        return mon.getInfo();  // 根据需求return
    }
});
```



# Hook实例化

```js
JavaClass.$new.implementation = function () {}
```



# Hook构造函数

```js
// JavaClass.$init.implementation = function () {}
Java.perform(function () {
    var money = Java.use('com.xx.app.Money');
    money.$init.implementation = function (a, b) {
        console.log("构造函数Hook中...", a, b);
        return this.$init(a, b);
    }

    // hook 构造方法 $init
    var MoneyClass = Java.use("com.kevin.app.Money");
    MoneyClass.$init.overload().implementation = function () {
        console.log("hook Money $init");
        this.$init();
    }

    var StringClass = Java.use("java.lang.String");
    var MoneyClass = Java.use("com.xiaojianbang.app.Money");
    MoneyClass.$init.overload('java.lang.String', 'int').implementation = function (x, y) {
        console.log('hook Money init');
        var myX = StringClass.new("Hello World!");
        var myY = 9999;
        this.$init(myX, myY);
    }	  
});
```



# sleep

```js
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}

// 毫秒级别
sleep(1000)
```



# 枚举类所有方法

```js
//Hook类的所有方法
Java.perform(function(){
    var md5 = Java.use("com.xxx.xxx.xxx");
    var methods = md5.class.getDeclaredMethods();
    for(var j = 0; j < methods.length; j++){
        var methodName = methods[j].getName();
        console.log(methodName); 
    }
});

function main() {
    Java.perform(function () {
        // return String[] class name
        var classList = Java.enumerateLoadedClassesSync();
        for (var i = 0; i < classList.length; i++) {
            var targetClass = classList[i];
            if (targetClass.indexOf("com.xiaojianbang.app.Money") != -1) {
                console.log("hook the class: ", targetClass);
                var TargetClass = Java.use(targetClass);
                // 利用反射获取类中的所有方法
                var methodsList = TargetClass.class.getDeclaredMethods();
                for (var k = 0; k < methodsList.length; k++) {
                    console.log(methodsList[k].getName());
  				
                    // hook methodName 这个类的所有方法（难点在于每个方法的参数是不同的）
                    for (var k = 0; k < TargetClass[methodName].overloads.length; k++) {
                        TargetClass[methodName].overloads[k].implementation = function () {
                            // 这是 hook 逻辑
                            for (var i = 0; i < arguments.length; i++) {
                                console.log(arguments[i]);
                            }
                            return this[methodName].apply(this, arguments);  // 重新调用
                        }
                    }
                }
            }
        }
    })
}

function main(){
    Java.perform(function(){
        Java.enumerateLoadedClasses({
            onMatch: function(name,handle){
                if (name.indexOf("com.xiaojianbang.app.Money") != -1){
                    console.log(name,handle);
                    // 利用反射 获取类中的所有方法
                    var TargetClass = Java.use(name);
                    // return Method Object List
                    var methodsList = TargetClass.class.getDeclaredMethods(); 
                    for (var i = 0; i < methodsList.length; i++){
                        // Method Objection getName()
                        console.log(methodsList[i].getName());
                    }
                }
            },

            onComplete: function(){
                console.log("complete!!!")
            }
        })
    })
}
```



# 特殊不可见字符

当方法名被混淆时֏，打印出来所有的类名 `%D6%8F`,用编码后的字符串hook

```js
Java.perform(
    function x() {

        var targetClass = "com.example.hooktest.MainActivity";

        var hookCls = Java.use(targetClass);
        var methods = hookCls.class.getDeclaredMethods();

        for (var i in methods) {
            console.log(methods[i].toString());
            console.log(encodeURIComponent(methods[i].toString().replace(/^.*?\.([^\s\.\(\)]+)\(.*?$/, "$1")));
        }

        hookCls[decodeURIComponent("%D6%8F")].implementation = function (x) {
                console.log("original call: fun(" + x + ")");
                var result = this[decodeURIComponent("%D6%8F")](900);
                return result;
            }
    }
)
```



# wallbreaker

```js
function main(){
    Java.perform(function(){
        var Class = Java.use("java.lang.Class");

      	function inspectObject(obj){
            var obj_class = Java.cast(obj.getClass(), Class);
            var fields = obj_class.getDeclaredFields();
            var methods = obj_class.getMethods();
            console.log("Inspectiong " + obj.getClass().toString());
            console.log("\t Fields:")
            for (var i in fields){
                console.log("\t\t" + fields[i].toString());
            }
            console.log("\t Methods:")
            for (var i in methods){
                console.log("\t\t" + methods[i].toString())
            }
        }

        Java.choose("com.baidu.lbs.waimai.WaimaiActivity",{
            onComplete: function(){
                console.log("complete!");

            },
            onMatch: function(instance){
                console.log("find instance", instance);
                inspectObject(instance);
            }
        })
    })
}

setImmediate(main)
```



# 枚举所有类

```js
Java.perform(function (){
  console.log("\n[*] enumerating classes...");
  Java.enumerateLoadedClasses({
    onMatch: function(_className){
      console.log("[*] found instance of '"+_className+"'");
    },
    onComplete: function(){
      console.log("[*] class enuemration complete");
    }
  });
});
```



# 枚举接口实现

获取指定包下所有类的接口实现

```js
function searchInterface(){
    Java.perform(function(){
        Java.enumerateLoadedClasses({
            onComplete: function(){},
            onMatch: function(name,handle){
                if (name.indexOf("com.r0ysue.a0526printout") > -1) { // 使用包名进行过滤
                    console.log("find class");
                    var targetClass = Java.use(name);
                    var interfaceList = targetClass.class.getInterfaces(); // 使用反射获取类实现的接口数组
                    if (interfaceList.length > 0) {
                        console.log(name) // 打印类名
                        for (var i in interfaceList) {
                            console.log("\t", interfaceList[i].toString()); // 直接打印接口名称
                        }
                    }
                }
            }
        })
    })
}
```



多个ClassLoader时枚举指定类所有关联的接口实现和父子类关系

```js
Java.perform(function () {
    console.log("start")
    // 枚举classLoader设置含有关键类的classLoader  动态dex切换classLoader
    Java.enumerateClassLoaders({
        onMatch: function (loader) {
            try {
                if (loader.findClass("com.jdd.motorfans.modules.detail.RecordFinishListener")) {
                    console.log("Successfully found loader")
                    console.log(loader);
                    Java.classFactory.loader = loader;
                }
            }
            catch (error) {
                console.log("find error:" + error)
            }
        },
        onComplete: function () {
            console.log("end1")
        }
    })
    // 枚举所有的类
    Java.enumerateLoadedClasses({
        onMatch: function (className) {
            if (className.toString().indexOf("RecordFinishListener") > 0 &&
                className.toString().indexOf("$") > 0
            ) {
                console.log("found => ", className)
                // 使用反射获取类实现的接口数组
                var interFaces = Java.use(className).class.getInterfaces();
                if(interFaces.length>0){
                    console.log("interface is => ");
                    for(var i in interFaces){
                        console.log("\t",interFaces[i].toString())
                    }
                }
                // 获取该类的父类名包含指定名称
                if (Java.use(className).class.getSuperclass()) {
                    var superClass = Java.use(className).class.getSuperclass().getName();
                    // console.log("superClass is => ",superClass);
                    if (superClass.indexOf("XC_MethodHook") > 0) {
                        console.log("found class is => ", className.toString())
                        traceClass(className);
                    }
                }

            }
        }, onComplete: function () {
            console.log("search completed!")
        }
    }) 
    console.log("end2")
})
```



# Hook Char&Byte

```js
Java.perform(function () {
    // 调用 自写dex
    Java.openClassFile("/data/local/tmp/r0gson.dex").load();
    const gson = Java.use('com.r0ysue.gson.Gson');

    // 打印CharArray数组
    Java.use("java.util.Arrays").toString.overload('[C').implementation = function(charArray){
        // Java.array('char', [ '一','去','二','三','里' ]);
        // Java.use('java.lang.String').$new(Java.array('char', [ '烟','村','四','五','家'])) 
        // Java.array("java.lang.String",["一","二","三"]);
        var result = this.toString(charArray);
        var result1 = JSON.stringify(charArray);
        console.log("charArray,result:",charArray,result)
        console.log(ArrayClass.toString(result));
        console.log("charArray Object Object:",gson.$new().toJson(charArray));
        return result;
    }

    // 打印char字符
    var CharClass = Java.use("java.lang.Character");
    CharClass.toString.overload("char").implementation = function(inputChar){
        var result = this.toString(inputChar);
        console.log("inputChar, result: ", inputChar, result);
        return result;
    }  

    // byteArray
    Java.use("java.util.Arrays").toString.overload('[B').implementation = function(byteArray){
        var result = this.toString(byteArray);
        var result1 = JSON.stringify(byteArray);
        console.log("byteArray,result):",byteArray,result)
        console.log("byteArray Object Object:",gson.$new().toJson(byteArray));
        return result;
    }

    var StringClass = Java.use("java.lang.String");
    var byteArray = StringClass.$new("Hello World").getBytes();
    Java.openClassFile("/data/local/tmp/r0gson.dex").load();
    var gson = Java.use("com.r0ysue.gson.Gson");
    console.log(gson.$new().toJson(byteArray));
    // // console byte[]
    var ByteString = Java.use("com.android.okhttp.okio.ByteString");
    console.log(ByteString.of(byteArray).hex()); // byte转16进制字符串
    // // 创建自定义Java数组 并打印
    var MyArray = Java.array("byte",[13,4,4,2]);
    console.log(gson.$new().toJson(MyArray));

});
```



# Hook Map

```js
遍历打印
function main() {
    Java.perform(function () {
        var targetClass = Java.use("com.xiaojianbang.app.ShufferMap");
        targetClass.show.implementation = function (map) {
            // 遍历 map
            var result = "";
            var it = map.keySet().iterator();
            while (it.hasNext()) {
                var keyStr = it.next();
                var valueStr = map.get(keyStr);
                result += valueStr;
            }
            console.log("result :", result);

            // 修改 map
            map.put("pass", "fxxk");
            map.put("code", "Hello World");
            console.log(JSON.stringify(map));

            return this.show(map);
        }
    })
}

setImmediate(main);
cast打印 HashMap
function main() {
    Java.perform(function () {
        var HashMapNode = Java.use("java.util.HashMap$Node");
        var targetClass = Java.use("com.xiaojianbang.app.ShufferMap");

        var targetClass.show.implementation = function (map) {
            var result = "";
            var iterator = map.entrySet().iterator();
            while (iterator.hasNext()) {
                console.log("entry", iterator.next());
                var entry = Java.cast(iterator.next(), HashMapNode);
                console.log(entry.getKey());
                console.log(entry.getValue());
                return += entry.getValue();
            }

            console.log("result is :", result);
        }
    })
}

function main(){
    Java.perform(function(){
        var targetClass = Java.use("com.xiaojianbang.app.ShufferMap");
        var HashMap = Java.use('java.util.HashMap');
        targetClass.show.implementation = function(map){
            // 直接调用 toString()
            var args_map = Java.cast(param_hm, HashMap);
            console.log("打印hashmap: -> " + map.toString() + args_map.toString());
            return this.show.apply(this,arguments);
        }
    })
}

setImmediate(main);
```



# Hook 重载

```js
function hookdecodeimgkey() {
    Java.perform(function () {
        var base64 = Java.use("android.util.Base64")
        Java.use("com.ilulutv.fulao2.other.i.b").b.overload('[B', '[B', 'java.lang.String').implementation = function (key, iv, image) {
            var result = this.b(key, iv, image);
            console.log("key", base64.encodeToString(key, 0));
            console.log("iv", base64.encodeToString(iv, 0));
            return result;
        }

        var UtilsClass = Java.use("com.kevin.app.Utils");
        // 重载无参方法
        UtilsClass.test.overload().implementation = function () {
            console.log("hook overload no args");
            return this.test();
        }

        // 重载有参方法 - 基础数据类型
		UtilsClass.test.overload('int').implementation = function(num){
            console.log("hook overload int args");
            var myNum = 9999;
            var oriResult = this.test(num);
            console.log("oriResult is :" + oriResult);
            return this.test(myNum);
        }

        // 重载有参方法 - 引用数据类型
        UtilsClass.test.overload('com.kevin.app.Money').implementation = function(money){
            console.log("hook Money args");
            return this.test(money);
        }

        // hook 指定方法的所有重载
        var ClassName = Java.use("com.xiaojianbang.app.Utils");
        var overloadsLength = ClassName.test.overloads.length;
        for (var i = 0; i < overloadsLength; i++){
            ClassName.test.overloads[i].implementation = function () {
                // 遍历打印 arguments 
                for (var a = 0; a < arguments.length; a++){
                    console.log(a + " : " + arguments[a]);
                }
                // 调用原方法
                return this.test.apply(this,arguments);
            }
        }      
    })
}
```



# Hook 内部类

```js
function main(){
    Java.perfor(function(){
        // hook 内部类
        // 内部类使用$进行分隔 不使用.
        var InnerClass = Java.use("com.xiaojianbang.app.Money$innerClass");
        // 重写内部类的 $init 方法
        InnerClass.$init.overload("java.lang.String","int").implementation = function(x,y){
            console.log("x: ",x);
            console.log("y: ",y);
            this.$init(x,y);
        }
    })
}

setImmediate(main)
```



# Hook 匿名类

```js
// 接口, 抽象类, 不可以被new
// 接口, 抽象类 要使用必须要实例化, 实例化不是通过new, 而是通过实现接口方法, 继承抽象类等方式
// new __接口__{} 可以理解成 new 了一个实现接口的匿名类, 在匿名类的内部(花括号内),实现了这个接口

function main(){
    Java.perform(function(){
        // hook 匿名类
        // 匿名类在 smail中以 $1, $2 等方式存在, 需要通过 java 行号去 smail 找到准确的匿名类名称 
        var NiMingClass = Java.use("com.xiaojianbang.app.MainActivity$1");
        NiMingClass.getInfo.implementation = function (){
            return "kevin change 匿名类";
        }
    })
}

setImmediate(main)
```



# Hook 枚举类

```js
function enumPrint(){
    Java.perform(function(){
        Java.choose("com.r0ysue.a0526printout.Signal",{
            onComplete: function(){},
            onMatch: function(instance){
                console.log('find it ,',instance);
                console.log(instance.class.getName());
            }
        })
    })
}
```



# Hook 动态加载dex

```js
function main(){
    Java.perform(function(){
        Java.enumerateClassLoaders({
            onMatch : function(loader){
                try {
                    // loadClass or findClass 并切换classLoader
                    if (loader.loadClass("com.xiaojianbang.app.Dynamic")){
                        Java.classFactory.loader = loader;
                        var hookClass = Java.use("com.xiaojianbang.app.Dynamic");
                        console.log("success hook it :", hookClass);
                    }
                } catch (error) {
                }
            },

            onComplete: function () {
                console.log("complete !!! ")
            }
        })
    })
}

setImmediate(main);
```



经常在加壳的 app 中, 没办法正确找到正常加载 app 类的 classloader

```js
function hook() {
    Java.perform(function () {
        Java.enumerateClassLoadersSync().forEach(function (classloader) {
            try {
                console.log("classloader", classloader);
                classloader.loadClass("com.kanxue.encrypt01.MainActivity");
                Java.classFactory.loader = classloader;
                var mainActivityClass = Java.use("com.kanxue.encrypt01.MainActivity");
                console.log("mainActivityClass", mainActivityClass);
            } catch (error) {
                console.log("error", error);
            }
        });
    })
}
```



# trace类调用栈

```js
function uniqBy(array, key) {
    var seen = {};
    return array.filter(function (item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}

// trace a specific Java Method
function traceMethod(targetClassMethod) {
    var delim = targetClassMethod.lastIndexOf(".");
    if (delim === -1) return;

    var targetClass = targetClassMethod.slice(0, delim)
    var targetMethod = targetClassMethod.slice(delim + 1, targetClassMethod.length)

    var hook = Java.use(targetClass);
    var overloadCount = hook[targetMethod].overloads.length;

    console.log("Tracing " + targetClassMethod + " [" + overloadCount + " overload(s)]");



    // hook all class_method
    for (var i = 0; i < overloadCount; i++) {

        hook[targetMethod].overloads[i].implementation = function () {
            console.warn("\n*** entered " + targetClassMethod);

            // print backtrace
            // Java.perform(function() {
            //	var bt = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
            //	console.log("\nBacktrace:\n" + bt);
            // });

            // print args
            if (arguments.length) console.log();
            for (var j = 0; j < arguments.length; j++) {
                console.log("arg[" + j + "]: " + arguments[j]);

            }

            // print retval
            var retval = this[targetMethod].apply(this, arguments); // rare crash (Frida bug?)
            console.log("\nretval: " + retval);
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.warn("\n*** exiting " + targetClassMethod);
            return retval;
        }
    }


}

function traceClass(targetClass) {
    //Java.use是新建一个对象哈，大家还记得么？
    var hook = Java.use(targetClass);
    //利用反射的方式，拿到当前类的所有方法
    var methods = hook.class.getDeclaredMethods();
    // var methods = hook.class.getMethods();
    //建完对象之后记得将对象释放掉哈
    hook.$dispose;
    //将方法名保存到数组中
    var parsedMethods = [];
    methods.forEach(function (method) {
        parsedMethods.push(method.toString().replace(targetClass + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
    });
    //去掉一些重复的值
    var targets = uniqBy(parsedMethods, JSON.stringify);
    //对数组中所有的方法进行hook，traceMethod也就是第一小节的内容
    targets.forEach(function (targetMethod) {
        traceMethod(targetClass + "." + targetMethod);
    });
}
```



# 调用栈打印

```js
function printStacks(name){
    console.log("====== printStacks start ====== " + name + "==============================")

    // sample 1
    var throwable = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new());
    console.log(throwable);

    // sample 2
    var exception = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
    console.log(exception);

    console.log("====== printStacks end ======== " + name + "==============================")
}
```



# 手动注册类

```js
Java.perform(function () {

    var Runnable = Java.use("java.lang.Runnable");
    var saveImg = Java.registerClass({
        name: "com.roysue.runnable",
        implements: [Runnable],
        fields: {
            bm: "android.graphics.Bitmap",
        },
        methods: {
            $init: [{
                returnType: "void",
                argumentTypes: ["android.graphics.Bitmap"],
                implementation: function (bitmap) {
                    this.bm.value = bitmap;
                }
            }],
            run: function () {
                var path = "/sdcard/Download/tmp/" + guid() + ".jpg"
                console.log("path=> ", path)
                var file = Java.use("java.io.File").$new(path)
                var fos = Java.use("java.io.FileOutputStream").$new(file);

                this.bm.value.compress(Java.use("android.graphics.Bitmap$CompressFormat").JPEG.value, 100, fos)
                fos.flush();
                fos.close();

            },
            onRequest: function (request, response) {
          	  // 主动调用代码直接写这里
            	response.send(JSON.stringify({
                	"code": 0,
	                "message": " 服务已经注册成功, 默认端口8181"
    	        }));
        	}
        }
    });


    Java.use("android.graphics.BitmapFactory").decodeByteArray.overload('[B', 'int', 'int', 'android.graphics.BitmapFactory$Options').implementation = function (data, offset, length, opts) {
        var result = this.decodeByteArray(data, offset, length, opts);
        var ByteString = Java.use("com.android.okhttp.okio.ByteString");

        var runnable = saveImg.$new(result);
        runnable.run()
        return result;
    }
})



Java.perform(function() {
   // https://developer.android.com/reference/android/view/WindowManager.LayoutParams.html#FLAG_SECURE
   var FLAG_SECURE = 0x2000;
   var Runnable = Java.use("java.lang.Runnable");
   var DisableSecureRunnable = Java.registerClass({
      name: "me.bhamza.DisableSecureRunnable",
      implements: [Runnable],
      fields: {
          activity: "android.app.Activity",
       },
       methods: {
          $init: [{
             returnType: "void",
             argumentTypes: ["android.app.Activity"],
             implementation: function (activity) {
                this.activity.value = activity;
             }
          }],
          run: function() {
             var flags = this.activity.value.getWindow().getAttributes().flags.value; // get current value
             flags &= ~FLAG_SECURE; // toggle it
             this.activity.value.getWindow().setFlags(flags, FLAG_SECURE); // disable it!
             console.log("Done disabling SECURE flag...");
          }
       }
    });

    Java.choose("com.example.app.FlagSecureTestActivity", {
       "onMatch": function (instance) {
          var runnable = DisableSecureRunnable.$new(instance);
          instance.runOnUiThread(runnable);
       },
       "onComplete": function () {}
    });
 });
```



# Hook Click

```js
var jclazz = null;
var jobj = null;

function getObjClassName(obj) {
    if (!jclazz) {
        var jclazz = Java.use("java.lang.Class");
    }
    if (!jobj) {
        var jobj = Java.use("java.lang.Object");
    }
    return jclazz.getName.call(jobj.getClass.call(obj));
}

function watch(obj, mtdName) {
    var listener_name = getObjClassName(obj);
    var target = Java.use(listener_name);
    if (!target || !mtdName in target) {
        return;
    }
    // send("[WatchEvent] hooking " + mtdName + ": " + listener_name);
    target[mtdName].overloads.forEach(function (overload) {
        overload.implementation = function () {
            //send("[WatchEvent] " + mtdName + ": " + getObjClassName(this));
            console.log("[WatchEvent] " + mtdName + ": " + getObjClassName(this))
            return this[mtdName].apply(this, arguments);
        };
    })
}

function OnClickListener() {
    Java.perform(function () {

        //以spawn启动进程的模式来attach的话
        Java.use("android.view.View").setOnClickListener.implementation = function (listener) {
            if (listener != null) {
                watch(listener, 'onClick');
            }
            return this.setOnClickListener(listener);
        };

        //如果frida以attach的模式进行attch的话
        Java.choose("android.view.View$ListenerInfo", {
            onMatch: function (instance) {
                instance = instance.mOnClickListener.value;
                if (instance) {
                    console.log("mOnClickListener name is :" + getObjClassName(instance));
                    watch(instance, 'onClick');
                }
            },
            onComplete: function () {
            }
        })
    })
}
setImmediate(OnClickListener);
```



# Hook Activity

```js
Java.perform(function () {
    var Activity = Java.use("android.app.Activity");
    //console.log(Object.getOwnPropertyNames(Activity));
    Activity.startActivity.overload('android.content.Intent').implementation=function(p1){
        console.log("Hooking android.app.Activity.startActivity(p1) successfully,p1="+p1);
        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
        console.log(decodeURIComponent(p1.toUri(256)));
        this.startActivity(p1);
    }
    Activity.startActivity.overload('android.content.Intent', 'android.os.Bundle').implementation=function(p1,p2){
        console.log("Hooking android.app.Activity.startActivity(p1,p2) successfully,p1="+p1+",p2="+p2);
        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
        console.log(decodeURIComponent(p1.toUri(256)));
        this.startActivity(p1,p2);
    }
    Activity.startService.overload('android.content.Intent').implementation=function(p1){
        console.log("Hooking android.app.Activity.startService(p1) successfully,p1="+p1);
        console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
        console.log(decodeURIComponent(p1.toUri(256)));
        this.startService(p1);
    }
})
```



# Hook 绕过root检测

```js
// $ frida -l antiroot.js -U -f com.example.app --no-pause
// CHANGELOG by Pichaya Morimoto (p.morimoto@sth.sh): 
//  - I added extra whitelisted items to deal with the latest versions 
// 						of RootBeer/Cordova iRoot as of August 6, 2019
//  - The original one just fucked up (kill itself) if Magisk is installed lol
// Credit & Originally written by: https://codeshare.frida.re/@dzonerzy/fridantiroot/
// If this isn't working in the future, check console logs, rootbeer src, or libtool-checker.so

Java.perform(function() {

    var RootPackages = ["com.noshufou.android.su", "com.noshufou.android.su.elite", "eu.chainfire.supersu",
        "com.koushikdutta.superuser", "com.thirdparty.superuser", "com.yellowes.su", "com.koushikdutta.rommanager",
        "com.koushikdutta.rommanager.license", "com.dimonvideo.luckypatcher", "com.chelpus.lackypatch",
        "com.ramdroid.appquarantine", "com.ramdroid.appquarantinepro", "com.devadvance.rootcloak", "com.devadvance.rootcloakplus",
        "de.robv.android.xposed.installer", "com.saurik.substrate", "com.zachspong.temprootremovejb", "com.amphoras.hidemyroot",
        "com.amphoras.hidemyrootadfree", "com.formyhm.hiderootPremium", "com.formyhm.hideroot", "me.phh.superuser",
        "eu.chainfire.supersu.pro", "com.kingouser.com", "com.android.vending.billing.InAppBillingService.COIN","com.topjohnwu.magisk"
    ];

    var RootBinaries = ["su", "busybox", "supersu", "Superuser.apk", "KingoUser.apk", "SuperSu.apk","magisk"];

    var RootProperties = {
        "ro.build.selinux": "1",
        "ro.debuggable": "0",
        "service.adb.root": "0",
        "ro.secure": "1"
    };

    var RootPropertiesKeys = [];

    for (var k in RootProperties) RootPropertiesKeys.push(k);

    var PackageManager = Java.use("android.app.ApplicationPackageManager");

    var Runtime = Java.use('java.lang.Runtime');

    var NativeFile = Java.use('java.io.File');

    var String = Java.use('java.lang.String');

    var SystemProperties = Java.use('android.os.SystemProperties');

    var BufferedReader = Java.use('java.io.BufferedReader');

    var ProcessBuilder = Java.use('java.lang.ProcessBuilder');

    var StringBuffer = Java.use('java.lang.StringBuffer');

    var loaded_classes = Java.enumerateLoadedClassesSync();

    send("Loaded " + loaded_classes.length + " classes!");

    var useKeyInfo = false;

    var useProcessManager = false;

    send("loaded: " + loaded_classes.indexOf('java.lang.ProcessManager'));

    if (loaded_classes.indexOf('java.lang.ProcessManager') != -1) {
        try {
            //useProcessManager = true;
            //var ProcessManager = Java.use('java.lang.ProcessManager');
        } catch (err) {
            send("ProcessManager Hook failed: " + err);
        }
    } else {
        send("ProcessManager hook not loaded");
    }

    var KeyInfo = null;

    if (loaded_classes.indexOf('android.security.keystore.KeyInfo') != -1) {
        try {
            //useKeyInfo = true;
            //var KeyInfo = Java.use('android.security.keystore.KeyInfo');
        } catch (err) {
            send("KeyInfo Hook failed: " + err);
        }
    } else {
        send("KeyInfo hook not loaded");
    }

    PackageManager.getPackageInfo.overload('java.lang.String', 'int').implementation = function(pname, flags) {
        var shouldFakePackage = (RootPackages.indexOf(pname) > -1);
        if (shouldFakePackage) {
            send("Bypass root check for package: " + pname);
            pname = "set.package.name.to.a.fake.one.so.we.can.bypass.it";
        }
        return this.getPackageInfo.call(this, pname, flags);
    };

    NativeFile.exists.implementation = function() {
        var name = NativeFile.getName.call(this);
        var shouldFakeReturn = (RootBinaries.indexOf(name) > -1);
        if (shouldFakeReturn) {
            send("Bypass return value for binary: " + name);
            return false;
        } else {
            return this.exists.call(this);
        }
    };

    var exec = Runtime.exec.overload('[Ljava.lang.String;');
    var exec1 = Runtime.exec.overload('java.lang.String');
    var exec2 = Runtime.exec.overload('java.lang.String', '[Ljava.lang.String;');
    var exec3 = Runtime.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;');
    var exec4 = Runtime.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;', 'java.io.File');
    var exec5 = Runtime.exec.overload('java.lang.String', '[Ljava.lang.String;', 'java.io.File');

    exec5.implementation = function(cmd, env, dir) {
        if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id" || cmd == "sh") {
            var fakeCmd = "grep";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "su") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "which") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass which command");
            return exec1.call(this, fakeCmd);
        }
        return exec5.call(this, cmd, env, dir);
    };

    exec4.implementation = function(cmdarr, env, file) {
        for (var i = 0; i < cmdarr.length; i = i + 1) {
            var tmp_cmd = cmdarr[i];
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id" || tmp_cmd == "sh") {
                var fakeCmd = "grep";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }

            if (tmp_cmd == "su") {
                var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }
        }
        return exec4.call(this, cmdarr, env, file);
    };

    exec3.implementation = function(cmdarr, envp) {
        for (var i = 0; i < cmdarr.length; i = i + 1) {
            var tmp_cmd = cmdarr[i];
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id" || tmp_cmd == "sh") {
                var fakeCmd = "grep";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }

            if (tmp_cmd == "su") {
                var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
                send("Bypass " + cmdarr + " command");
                return exec1.call(this, fakeCmd);
            }
        }
        return exec3.call(this, cmdarr, envp);
    };

    exec2.implementation = function(cmd, env) {
        if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id" || cmd == "sh") {
            var fakeCmd = "grep";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "su") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        return exec2.call(this, cmd, env);
    };

    exec.implementation = function(cmd) {
        for (var i = 0; i < cmd.length; i = i + 1) {
            var tmp_cmd = cmd[i];
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id" || tmp_cmd == "sh") {
                var fakeCmd = "grep";
                send("Bypass " + cmd + " command");
                return exec1.call(this, fakeCmd);
            }

            if (tmp_cmd == "su") {
                var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
                send("Bypass " + cmd + " command");
                return exec1.call(this, fakeCmd);
            }
        }

        return exec.call(this, cmd);
    };

    exec1.implementation = function(cmd) {
        if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id" || cmd == "sh") {
            var fakeCmd = "grep";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        if (cmd == "su") {
            var fakeCmd = "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled";
            send("Bypass " + cmd + " command");
            return exec1.call(this, fakeCmd);
        }
        return exec1.call(this, cmd);
    };

    String.contains.implementation = function(name) {
        if (name == "test-keys") {
            send("Bypass test-keys check");
            return false;
        }
        return this.contains.call(this, name);
    };

    var get = SystemProperties.get.overload('java.lang.String');

    get.implementation = function(name) {
        if (RootPropertiesKeys.indexOf(name) != -1) {
            send("Bypass " + name);
            return RootProperties[name];
        }
        return this.get.call(this, name);
    };

    Interceptor.attach(Module.findExportByName("libc.so", "fopen"), {
        onEnter: function(args) {
            var path1 = Memory.readCString(args[0]);
            var path = path1.split("/");
            var executable = path[path.length - 1];
            var shouldFakeReturn = (RootBinaries.indexOf(executable) > -1)
            if (shouldFakeReturn) {
                Memory.writeUtf8String(args[0], "/ggezxxx");
                send("Bypass native fopen >> "+path1);
            }
        },
        onLeave: function(retval) {

        }
    });

    Interceptor.attach(Module.findExportByName("libc.so", "fopen"), {
        onEnter: function(args) {
            var path1 = Memory.readCString(args[0]);
            var path = path1.split("/");
            var executable = path[path.length - 1];
            var shouldFakeReturn = (RootBinaries.indexOf(executable) > -1)
            if (shouldFakeReturn) {
                Memory.writeUtf8String(args[0], "/ggezxxx");
                send("Bypass native fopen >> "+path1);
            }
        },
        onLeave: function(retval) {

        }
    });

    Interceptor.attach(Module.findExportByName("libc.so", "system"), {
        onEnter: function(args) {
            var cmd = Memory.readCString(args[0]);
            send("SYSTEM CMD: " + cmd);
            if (cmd.indexOf("getprop") != -1 || cmd == "mount" || cmd.indexOf("build.prop") != -1 || cmd == "id") {
                send("Bypass native system: " + cmd);
                Memory.writeUtf8String(args[0], "grep");
            }
            if (cmd == "su") {
                send("Bypass native system: " + cmd);
                Memory.writeUtf8String(args[0], "justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled");
            }
        },
        onLeave: function(retval) {

        }
    });

    /*
    TO IMPLEMENT:
    Exec Family
    int execl(const char *path, const char *arg0, ..., const char *argn, (char *)0);
    int execle(const char *path, const char *arg0, ..., const char *argn, (char *)0, char *const envp[]);
    int execlp(const char *file, const char *arg0, ..., const char *argn, (char *)0);
    int execlpe(const char *file, const char *arg0, ..., const char *argn, (char *)0, char *const envp[]);
    int execv(const char *path, char *const argv[]);
    int execve(const char *path, char *const argv[], char *const envp[]);
    int execvp(const char *file, char *const argv[]);
    int execvpe(const char *file, char *const argv[], char *const envp[]);
    */

    BufferedReader.readLine.overload().implementation = function() {
        var text = this.readLine.call(this);
        if (text === null) {
            // just pass , i know it's ugly as hell but test != null won't work :(
        } else {
            var shouldFakeRead = (text.indexOf("ro.build.tags=test-keys") > -1);
            if (shouldFakeRead) {
                send("Bypass build.prop file read");
                text = text.replace("ro.build.tags=test-keys", "ro.build.tags=release-keys");
            }
        }
        return text;
    };

    var executeCommand = ProcessBuilder.command.overload('java.util.List');

    ProcessBuilder.start.implementation = function() {
        var cmd = this.command.call(this);
        var shouldModifyCommand = false;
        for (var i = 0; i < cmd.size(); i = i + 1) {
            var tmp_cmd = cmd.get(i).toString();
            if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd.indexOf("mount") != -1 || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd.indexOf("id") != -1) {
                shouldModifyCommand = true;
            }
        }
        if (shouldModifyCommand) {
            send("Bypass ProcessBuilder " + cmd);
            this.command.call(this, ["grep"]);
            return this.start.call(this);
        }
        if (cmd.indexOf("su") != -1) {
            send("Bypass ProcessBuilder " + cmd);
            this.command.call(this, ["justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled"]);
            return this.start.call(this);
        }

        return this.start.call(this);
    };

    if (useProcessManager) {
        var ProcManExec = ProcessManager.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;', 'java.io.File', 'boolean');
        var ProcManExecVariant = ProcessManager.exec.overload('[Ljava.lang.String;', '[Ljava.lang.String;', 'java.lang.String', 'java.io.FileDescriptor', 'java.io.FileDescriptor', 'java.io.FileDescriptor', 'boolean');

        ProcManExec.implementation = function(cmd, env, workdir, redirectstderr) {
            var fake_cmd = cmd;
            for (var i = 0; i < cmd.length; i = i + 1) {
                var tmp_cmd = cmd[i];
                if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id") {
                    var fake_cmd = ["grep"];
                    send("Bypass " + cmdarr + " command");
                }

                if (tmp_cmd == "su") {
                    var fake_cmd = ["justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled"];
                    send("Bypass " + cmdarr + " command");
                }
            }
            return ProcManExec.call(this, fake_cmd, env, workdir, redirectstderr);
        };

        ProcManExecVariant.implementation = function(cmd, env, directory, stdin, stdout, stderr, redirect) {
            var fake_cmd = cmd;
            for (var i = 0; i < cmd.length; i = i + 1) {
                var tmp_cmd = cmd[i];
                if (tmp_cmd.indexOf("getprop") != -1 || tmp_cmd == "mount" || tmp_cmd.indexOf("build.prop") != -1 || tmp_cmd == "id") {
                    var fake_cmd = ["grep"];
                    send("Bypass " + cmdarr + " command");
                }

                if (tmp_cmd == "su") {
                    var fake_cmd = ["justafakecommandthatcannotexistsusingthisshouldthowanexceptionwheneversuiscalled"];
                    send("Bypass " + cmdarr + " command");
                }
            }
            return ProcManExecVariant.call(this, fake_cmd, env, directory, stdin, stdout, stderr, redirect);
        };
    }

    if (useKeyInfo) {
        KeyInfo.isInsideSecureHardware.implementation = function() {
            send("Bypass isInsideSecureHardware");
            return true;
        }
    }

});
```



# frida主线程运行

使用一些方法的时候出现报错 `on a thread that has not called Looper.prepare()`

```js
Java.perform(function() {
  var Toast = Java.use('android.widget.Toast');
  // 获取 androidcontext
  var currentApplication = Java.use('android.app.ActivityThread').currentApplication(); 
  var context = currentApplication.getApplicationContext();

  Java.scheduleOnMainThread(function() {
    Toast.makeText(context, "Hello World", Toast.LENGTH_LONG.value).show();
  })
})
```



# 过滤打印

```js
function hook_lnf() {
    var activate = false;

    Java.perform(function(){
        var hashmapClass = Java.use("java.util.HashMap");
        hashmapClass.put.implementation = function(key,value){
            if (activate){
                console.log("key:", key, "value:", value);
            }
            return this.put(key,value);
        };
    });

    Java.perform(function () {
        var lnfClazz = Java.use("tb.lnf");
        lnfClazz.a.overload('java.util.HashMap', 'java.util.HashMap', 'java.lang.String',
            'java.lang.String', 'boolean').implementation = function (hashmap, hashmap2, str, str2, z) {
                printHashMap("hashmap", hashmap);
                printHashMap("hashmap2", hashmap2);
                console.log("str", str);
                console.log("str2", str2);
                console.log("boolean", z);
                activate = true;
                var result = this.a(hashmap, hashmap2, str, str2, z);
                activate = false
                printHashMap("result", result);
                return result;
            };
    })
}
```



# 禁止退出

```js
function hookExit(){
    Java.perform(function(){
        console.log("[*] Starting hook exit");
        var exitClass = Java.use("java.lang.System");
        exitClass.exit.implementation = function(){
            console.log("[*] System.exit.called");
        }
        console.log("[*] hooking calls to System.exit");
    })
}

setImmediate(hookExit);
```



# 修改设备参数

```js
// frida hook 修改设备参数
Java.perform(function() {
	var TelephonyManager = Java.use("android.telephony.TelephonyManager");

    //IMEI hook
    TelephonyManager.getDeviceId.overload().implementation = function () {
               console.log("[*]Called - getDeviceId()");
               var temp = this.getDeviceId();
               console.log("real IMEI: "+temp);
               return "867979021642856";
    };
    // muti IMEI
    TelephonyManager.getDeviceId.overload('int').implementation = function (p) {
               console.log("[*]Called - getDeviceId(int) param is"+p);
               var temp = this.getDeviceId(p);
               console.log("real IMEI "+p+": "+temp);
               return "867979021642856";
    };

    //IMSI hook
	TelephonyManager.getSimSerialNumber.overload().implementation = function () {
               console.log("[*]Called - getSimSerialNumber(String)");
               var temp = this.getSimSerialNumber();
               console.log("real IMSI: "+temp);
               return "123456789";
    };
    //////////////////////////////////////

    //ANDOID_ID hook
    var Secure = Java.use("android.provider.Settings$Secure");
    Secure.getString.implementation = function (p1,p2) {
    	if(p2.indexOf("android_id")<0) return this.getString(p1,p2);
    	console.log("[*]Called - get android_ID, param is:"+p2);
    	var temp = this.getString(p1,p2);
    	console.log("real Android_ID: "+temp);
    	return "844de23bfcf93801";

    }

    //android的hidden API，需要通过反射调用
    var SP = Java.use("android.os.SystemProperties");
    SP.get.overload('java.lang.String').implementation = function (p1) {
    	var tmp = this.get(p1);
    	console.log("[*]"+p1+" : "+tmp);

    	return tmp;
    }
    SP.get.overload('java.lang.String', 'java.lang.String').implementation = function (p1,p2) {
  
  
    	var tmp = this.get(p1,p2)
    	console.log("[*]"+p1+","+p2+" : "+tmp);
    	return tmp;
    } 
    // hook MAC
    var wifi = Java.use("android.net.wifi.WifiInfo");
    wifi.getMacAddress.implementation = function () {
    	var tmp = this.getMacAddress();
    	console.log("[*]real MAC: "+tmp);
    	return tmp;
    }

})
```



# 请求调用栈

```js
var class_Socket = Java.use("java.net.Socket");
class_Socket.getOutputStream.overload().implementation = function(){
    send("getOutputSteam");
    var result = this.getOutputStream();
    var bt = Java.use("android.util.Log").getStackTraceString(
        Java.use("java.lang.Exception").$new();
    )
    console.log("Backtrace:" + bt);
    send(result);
    return result;
}
```



# 上下文Context

```js
function getContext(){
    Java.perform(function(){
        var currentApplication = Java.use("android.app.ActivityThread").currentApplication();
        console.log(currentApplication);
        var context = currentApplication.getApplicationContext();
        console.log(context);
        var packageName = context.getPackageName();
        console.log(packageName);
        console.log(currentApplication.getPackageName());
    })
}
```



# RPC

```js
frida 传递参数
function main(){
    Java.perform(function () {
        console.log("enter perform");
        // 获取要hook的类
        var TextViewClass = Java.use("android.widget.TextView");
        // 要hook的方法
        TextViewClass.setText.overload('java.lang.CharSequence').implementation = function (ori_input) {
            console.log('enter', 'java.lang.CharSequence');
            console.log('ori_input',ori_input.toString());

            // 定义用于接受python传参的data
            var receive_data;
            // 将原参数传递给python 在python中进行处理
            send(ori_input.toString());
            // recv 从python接收传递的内容 默认传过来的是个json对象
            recv(function (json_data) {
                console.log('data from python ' + json_data.data);
                receive_data = json_data.data;
                console.log(typeof (receive_data));
            }).wait(); //wait() 等待python处理 阻塞

            // 转java字符串
            receive_data = Java.use("java.lang.String").$new(receive_data);
            this.setText(receive_data);
        };
    })
}

setImmediate(main);
python 处理收到的参数
# -*- coding: utf-8 -*-
__author__ = "K"
__time__ = "2020-08-06 09:48"

import sys
import time
import base64
import frida
from loguru import logger

def on_message(message,data):
    logger.info(str(message)) # dict
    logger.info(str(data) if data else "None")

    if message['type'] == 'error':
        logger.error('error:' + str(message['description']))
        logger.error('stack: ' + str(message['stack']))

    if message['type'] == 'send':
        logger.info('get message [*] --> ' + message['payload'])

        payload = message['payload']
        # 处理逻辑 sending to the server: YWFhOmJiYg==
        tmp = payload.split(':')
        sts = tmp[0]
        need_to_db64 = tmp[1]
        user_pass = base64.b64decode(need_to_db64.encode()).decode()

        mine_str = 'admin' + ':' + user_pass.split(':')[-1]
        mine_b64_str = base64.b64encode(mine_str.encode()).decode()
        mine_b64_str = sts + mine_b64_str
        logger.info(mine_b64_str)

        # python返回数据给js script.post
        script.post({'data':mine_b64_str})
        logger.info('python complete')

device = frida.get_usb_device()
# pid = device.spawn(['com.kevin.demo04'])
# time.sleep(1)
session = device.attach('com.kevin.demo02')
with open('./hulianhutong.js','r') as f:
    script = session.create_script(f.read())

script.on("message",on_message)
script.load()
input()
```



# 强制类型转换

```js
// Java.cast() 子类可以强转成父类, 父类不能转成子类
// 可以使用Java.cast()将子类强转成父类, 再调用父类的动态方法

function castDemo(){
    Java.perform(function(){
        var JuiceHandle = null; // 用来存储内存中找到的Juice对象
        var WaterClass = Java.use("com.r0ysue.a0526printout.Water");

        Java.choose("com.r0ysue.a0526printout.Juice",{
			onComplete: function(){},
             onMatch: function(instance){
                JuiceHandle = instance;
                console.log("instance:", instance);
                // 调用Juice对象的方法
                console.log(JuiceHandle.fillEnergy());
                // 子类Juice转父类Water 并调用父类的动态方法
                var WaterInstance = Java.cast(JuiceHandle,WaterClass);
                console.log(WaterInstance.still(WaterInstance));
            }
        })
    })
}
```



# map2json

```js
function map2json(mapSet) {
    try {
        var result = {};
        var key_set = mapSet.keySet();
        var it = key_set.iterator();
        while (it.hasNext()) {
            var key_str = it.next().toString();
            result[key_str] = mapSet.get(key_str).toString();
        }
        return result
    } catch (error) {
        return mapSet
    }
}
```



# bytes2Hex

```js
function bytes2Hex(arrBytes){
    var str = "";
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp;
        var num = arrBytes[i];
        if (num < 0) {
            //此处填坑，当byte因为符合位导致数值为负时候，需要对数据进行处理
            tmp = (255 + num + 1).toString(16);
        } else {
            tmp = num.toString(16);
        }
        if (tmp.length == 1) {
            tmp = "0" + tmp;
        }
        if(i>0){
            str += " "+tmp;
        }else{
            str += tmp;
        }
    }
    return str;
}
```



# string2Bytes

```js
function string2Bytes(str) {
    var bytes = new Array();
    var len, c;
    len = str.length;
    for(var i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if(c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if(c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        } else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}
```



# bytes2String

```js
function bytes2String(arr) {
    if(typeof arr === 'string') {
        return arr;
    }
    var str = '',
        _arr = arr;
    for(var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if(v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for(var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            try {
                str += String.fromCharCode(parseInt(store, 2));
            } catch (error) {
                str += parseInt(store, 2).toString(); 
                console.log(error);
            }
            i += bytesLength - 1;
        } else {
            try {
                str += String.fromCharCode(_arr[i]);
            } catch (error) {
                str += parseInt(store, 2).toString(); 
                console.log(error);
            }
        }
    }
    return str;
}
```



# bytes2Base64

```js
function bytes2Base64(e) {
    var base64EncodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var r, a, c, h, o, t;
    for (c = e.length, a = 0, r = ''; a < c;) {
        if (h = 255 & e[a++], a == c) {
            r += base64EncodeChars.charAt(h >> 2),
                r += base64EncodeChars.charAt((3 & h) << 4),
                r += '==';
            break
        }
        if (o = e[a++], a == c) {
            r += base64EncodeChars.charAt(h >> 2),
                r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
                r += base64EncodeChars.charAt((15 & o) << 2),
                r += '=';
            break
        }
        t = e[a++],
            r += base64EncodeChars.charAt(h >> 2),
            r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
            r += base64EncodeChars.charAt((15 & o) << 2 | (192 & t) >> 6),
            r += base64EncodeChars.charAt(63 & t)
    }
    return r
}
```



# 常见算法hook

```js
Java.perform(function () {
    var secretKeySpec = Java.use('javax.crypto.spec.SecretKeySpec');
    secretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function (a, b) {
        showStacks();
        var result = this.$init(a, b);
        send("======================================");
        send("算法名：" + b + "|Dec密钥:" + bytesToString(a));
        send("算法名：" + b + "|Hex密钥:" + bytesToHex(a));
        return result;
    }
    var mac = Java.use('javax.crypto.Mac');
    mac.getInstance.overload('java.lang.String').implementation = function (a) {
        showStacks();
        var result = this.getInstance(a);
        send("======================================");
        send("算法名：" + a);
        return result;
    }
    mac.update.overload('[B').implementation = function (a) {
        showStacks();
        this.update(a);
        send("======================================");
        send("update:" + bytesToString(a))
    }
    mac.update.overload('[B', 'int', 'int').implementation = function (a, b, c) {
        showStacks();
        this.update(a, b, c)
        send("======================================");
        send("update:" + bytesToString(a) + "|" + b + "|" + c);
    }
    mac.doFinal.overload().implementation = function () {
        showStacks();
        var result = this.doFinal();
        send("======================================");
        send("doFinal结果:" + bytesToHex(result));
        send("doFinal结果:" + bytesToBase64(result));
        return result;
    }
    mac.doFinal.overload('[B').implementation = function (a) {
        showStacks();
        var result = this.doFinal(a);
        send("======================================");
        send("doFinal参数:" + bytesToString(a));
        send("doFinal结果:" + bytesToHex(result));
        send("doFinal结果:" + bytesToBase64(result));
        return result;
    }
    var md = Java.use('java.security.MessageDigest');
    md.getInstance.overload('java.lang.String', 'java.lang.String').implementation = function (a, b) {
        showStacks();
        send("======================================");
        send("算法名：" + a);
        return this.getInstance(a, b);
    }
    md.getInstance.overload('java.lang.String').implementation = function (a) {
        showStacks();
        send("======================================");
        send("算法名：" + a);
        return this.getInstance(a);
    }
    md.update.overload('[B').implementation = function (a) {
        showStacks();
        send("======================================");
        send("update:" + bytesToString(a))
        return this.update(a);
    }
    md.update.overload('[B', 'int', 'int').implementation = function (a, b, c) {
        showStacks();
        send("======================================");
        send("update:" + bytesToString(a) + "|" + b + "|" + c);
        return this.update(a, b, c);
    }
    md.digest.overload().implementation = function () {
        showStacks();
        send("======================================");
        var result = this.digest();
        send("digest结果:" + bytesToHex(result));
        send("digest结果:" + bytesToBase64(result));
        return result;
    }
    md.digest.overload('[B').implementation = function (a) {
        showStacks();
        send("======================================");
        send("digest参数:" + bytesToString(a));
        var result = this.digest(a);
        send("digest结果:" + bytesToHex(result));
        send("digest结果:" + bytesToBase64(result));
        return result;
    }
    var ivParameterSpec = Java.use('javax.crypto.spec.IvParameterSpec');
    ivParameterSpec.$init.overload('[B').implementation = function (a) {
        showStacks();
        var result = this.$init(a);
        send("======================================");
        send("iv向量:" + bytesToString(a));
        send("iv向量:" + bytesToHex(a));
        return result;
    }
    var cipher = Java.use('javax.crypto.Cipher');
    cipher.getInstance.overload('java.lang.String').implementation = function (a) {
        showStacks();
        var result = this.getInstance(a);
        send("======================================");
        send("模式填充:" + a);
        return result;
    }
    cipher.update.overload('[B').implementation = function (a) {
        showStacks();
        var result = this.update(a);
        send("======================================");
        send("update:" + bytesToString(a));
        return result;
    }
    cipher.update.overload('[B', 'int', 'int').implementation = function (a, b, c) {
        showStacks();
        var result = this.update(a, b, c);
        send("======================================");
        send("update:" + bytesToString(a) + "|" + b + "|" + c);
        return result;
    }
    cipher.doFinal.overload().implementation = function () {
        showStacks();
        var result = this.doFinal();
        send("======================================");
        send("doFinal结果:" + bytesToHex(result));
        send("doFinal结果:" + bytesToBase64(result));
        return result;
    }
    cipher.doFinal.overload('[B').implementation = function (a) {
        showStacks();
        var result = this.doFinal(a);
        send("======================================");
        send("doFinal参数:" + bytesToString(a));
        send("doFinal结果:" + bytesToHex(result));
        send("doFinal结果:" + bytesToBase64(result));
        return result;
    }
    var x509EncodedKeySpec = Java.use('java.security.spec.X509EncodedKeySpec');
    x509EncodedKeySpec.$init.overload('[B').implementation = function (a) {
        showStacks();
        var result = this.$init(a);
        send("======================================");
        send("RSA密钥:" + bytesToBase64(a));
        return result;
    }
    var rSAPublicKeySpec = Java.use('java.security.spec.RSAPublicKeySpec');
    rSAPublicKeySpec.$init.overload('java.math.BigInteger', 'java.math.BigInteger').implementation = function (a, b) {
        showStacks();
        var result = this.$init(a, b);
        send("======================================");
        //send("RSA密钥:" + bytesToBase64(a));
        send("RSA密钥N:" + a.toString(16));
        send("RSA密钥E:" + b.toString(16));
        return result;
    }
});
```



# base64实现

```js
# -*- coding: utf-8 -*-
import base64

DEFAULT = 0  # 默认模式, 每行不超过76个字符
NO_PADDING = 1  # 移除最后的=
NO_WRAP = 2  # 不换行，一行输出
CRLF = 4  # 采用win上的换行符
URL_SAVE = 8  # 采用urlsafe


def decode(content: str, flag: int) -> bytes:
    missing_padding = len(content) % 4
    if missing_padding != 0:
        content = content.ljust(len(content) + (4 - missing_padding), "=")

    if flag & URL_SAVE:
        result = base64.urlsafe_b64decode(content.encode("utf-8"))
    else:
        result = base64.b64decode(content.encode("utf-8"))
    return result


def encode(content: bytes, flag: int) -> str:
    need_wrap = True
    need_padding = True
    lf = "\n"

    if flag & NO_WRAP:
        need_wrap = False
    if flag & NO_PADDING:
        need_padding = False
    if flag & CRLF:
        lf = "\r\n"

    if flag & URL_SAVE:
        result = base64.urlsafe_b64encode(content).decode("utf-8")
    else:
        result = base64.b64encode(content).decode("utf-8")

    if not need_padding:
        result = result.rstrip("=")

    if need_wrap:
        n = 76
        output = lf.join([result[i:i + n] for i in range(0, len(result), n)])
    else:
        output = result

    return output
```



# 常用转换模板

```js
//工具相关函数
var base64EncodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    base64DecodeChars = new Array((-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), (-1), 62, (-1), (-1), (-1), 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, (-1), (-1), (-1), (-1), (-1), (-1), (-1), 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, (-1), (-1), (-1), (-1), (-1), (-1), 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, (-1), (-1), (-1), (-1), (-1));

function stringToBase64(e) {
    var r, a, c, h, o, t;
    for (c = e.length, a = 0, r = ''; a < c;) {
        if (h = 255 & e.charCodeAt(a++), a == c) {
            r += base64EncodeChars.charAt(h >> 2),
                r += base64EncodeChars.charAt((3 & h) << 4),
                r += '==';
            break
        }
        if (o = e.charCodeAt(a++), a == c) {
            r += base64EncodeChars.charAt(h >> 2),
                r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
                r += base64EncodeChars.charAt((15 & o) << 2),
                r += '=';
            break
        }
        t = e.charCodeAt(a++),
            r += base64EncodeChars.charAt(h >> 2),
            r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
            r += base64EncodeChars.charAt((15 & o) << 2 | (192 & t) >> 6),
            r += base64EncodeChars.charAt(63 & t)
    }
    return r
}

function base64ToString(e) {
    var r, a, c, h, o, t, d;
    for (t = e.length, o = 0, d = ''; o < t;) {
        do
            r = base64DecodeChars[255 & e.charCodeAt(o++)];
        while (o < t && r == -1);
        if (r == -1)
            break;
        do
            a = base64DecodeChars[255 & e.charCodeAt(o++)];
        while (o < t && a == -1);
        if (a == -1)
            break;
        d += String.fromCharCode(r << 2 | (48 & a) >> 4);
        do {
            if (c = 255 & e.charCodeAt(o++), 61 == c)
                return d;
            c = base64DecodeChars[c]
        } while (o < t && c == -1);
        if (c == -1)
            break;
        d += String.fromCharCode((15 & a) << 4 | (60 & c) >> 2);
        do {
            if (h = 255 & e.charCodeAt(o++), 61 == h)
                return d;
            h = base64DecodeChars[h]
        } while (o < t && h == -1);
        if (h == -1)
            break;
        d += String.fromCharCode((3 & c) << 6 | h)
    }
    return d
}

function hexToBase64(str) {
    return base64Encode(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function base64ToHex(str) {
    for (var i = 0, bin = base64Decode(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
        var tmp = bin.charCodeAt(i).toString(16);
        if (tmp.length === 1)
            tmp = "0" + tmp;
        hex[hex.length] = tmp;
    }
    return hex.join("");
}

function hexToBytes(str) {
    var pos = 0;
    var len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    var hexA = new Array();
    for (var i = 0; i < len; i++) {
        var s = str.substr(pos, 2);
        var v = parseInt(s, 16);
        hexA.push(v);
        pos += 2;
    }
    return hexA;
}

function bytesToHex(arr) {
    var str = '';
    var k, j;
    for (var i = 0; i < arr.length; i++) {
        k = arr[i];
        j = k;
        if (k < 0) {
            j = k + 256;
        }
        if (j < 16) {
            str += "0";
        }
        str += j.toString(16);
    }
    return str;
}

function stringToHex(str) {
    var val = "";
    for (var i = 0; i < str.length; i++) {
        if (val == "")
            val = str.charCodeAt(i).toString(16);
        else
            val += str.charCodeAt(i).toString(16);
    }
    return val
}

function stringToBytes(str) {
    var ch, st, re = [];
    for (var i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i);
        st = [];
        do {
            st.push(ch & 0xFF);
            ch = ch >> 8;
        }
        while (ch);
        re = re.concat(st.reverse());
    }
    return re;
}

//将byte[]转成String的方法
function bytesToString(arr) {
    var str = '';
    arr = new Uint8Array(arr);
    for (var i in arr) {
        str += String.fromCharCode(arr[i]);
    }
    return str;
}

function bytesToBase64(e) {
    var r, a, c, h, o, t;
    for (c = e.length, a = 0, r = ''; a < c;) {
        if (h = 255 & e[a++], a == c) {
            r += base64EncodeChars.charAt(h >> 2),
                r += base64EncodeChars.charAt((3 & h) << 4),
                r += '==';
            break
        }
        if (o = e[a++], a == c) {
            r += base64EncodeChars.charAt(h >> 2),
                r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
                r += base64EncodeChars.charAt((15 & o) << 2),
                r += '=';
            break
        }
        t = e[a++],
            r += base64EncodeChars.charAt(h >> 2),
            r += base64EncodeChars.charAt((3 & h) << 4 | (240 & o) >> 4),
            r += base64EncodeChars.charAt((15 & o) << 2 | (192 & t) >> 6),
            r += base64EncodeChars.charAt(63 & t)
    }
    return r
}

function base64ToBytes(e) {
    var r, a, c, h, o, t, d;
    for (t = e.length, o = 0, d = []; o < t;) {
        do
            r = base64DecodeChars[255 & e.charCodeAt(o++)];
        while (o < t && r == -1);
        if (r == -1)
            break;
        do
            a = base64DecodeChars[255 & e.charCodeAt(o++)];
        while (o < t && a == -1);
        if (a == -1)
            break;
        d.push(r << 2 | (48 & a) >> 4);
        do {
            if (c = 255 & e.charCodeAt(o++), 61 == c)
                return d;
            c = base64DecodeChars[c]
        } while (o < t && c == -1);
        if (c == -1)
            break;
        d.push((15 & a) << 4 | (60 & c) >> 2);
        do {
            if (h = 255 & e.charCodeAt(o++), 61 == h)
                return d;
            h = base64DecodeChars[h]
        } while (o < t && h == -1);
        if (h == -1)
            break;
        d.push((3 & c) << 6 | h)
    }
    return d
}



// 打印log
function showStacks() {
    Java.perform(function () {
        send(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()));
    });
}

// 字节数组转hex字符串
function bytesToHex(arr) {
    var str = "";
    for (var i = 0; i < arr.length; i++) {
        var tmp = arr[i];
        if (tmp < 0) {
            tmp = (255 + tmp + 1).toString(16);
        } else {
            tmp = tmp.toString(16);
        }
        if (tmp.length == 1) {
            tmp = "0" + tmp;
        }
        str += tmp;
    }
    return str;
}

function bytesToBase64(arr) {
    var str = "";
    for (var i = 0; i < arr.length; i++) {
        var tmp = arr[i];
        if (tmp < 0) {
            tmp = (255 + tmp + 1).toString(16);
        } else {
            tmp = tmp.toString(16);
        }
        if (tmp.length == 1) {
            tmp = "0" + tmp;
        }
        str += tmp;
    }
    return str;
}

function bytesToString(arr) {
    var str = "";
    for (var i = 0; i < arr.length; i++) {
        var tmp = arr[i];
        if (tmp < 0) {
            tmp = (255 + tmp + 1).toString(16);
        } else {
            tmp = tmp.toString(16);
        }
        if (tmp.length == 1) {
            tmp = "0" + tmp;
        }
        str += tmp;
    }
    return str;
}
function byteToHexString(uint8arr) {
    if (!uint8arr) {
        return '';
    }
    var hexStr = '';
    for (var i = 0; i < uint8arr.length; i++) {
        var hex = (uint8arr[i] & 0xff).toString(16);
        hex = (hex.length === 1) ? '0' + hex : hex;
        hexStr += hex;
    }

    return hexStr.toUpperCase();
}


function stringToUint8Array(str){
  var arr = [];
  for (var i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }

  var tmpUint8Array = new Uint8Array(arr);
  return tmpUint8Array
}

function str2arraybffer(str) {
    var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function printBytes(b){

    var hexstr = "";
    for (var i=0; i< b.length; i++)
    {
        var uByte = (b[i]>>>0)&0xff;
        var n = uByte.toString(16);
        hexstr += "0x" + ("00" + n).slice(-2)+", ";
    }

	return hexstr;
}

//字节数组转十六进制字符串，对负值填坑
// 二进制数据（包括内存地址）在计算机中一般以16进制的方式表示
function Bytes2HexString(arrBytes) {
    var str = "";
    for (var i = 0; i < arrBytes.length; i++) {
        var tmp;
        var num=arrBytes[i];
        if (num < 0) {
            //此处填坑，当byte因为符合位导致数值为负时候，需要对数据进行处理
            tmp =(255+num+1).toString(16);
        } else {
            tmp = num.toString(16);
        }
        if (tmp.length == 1) {
            tmp = "0" + tmp;
        }
        str += tmp;
    }
    return str;
}

// 会转成有符号的数字  	JSON.stringify(bytes)
function HexString2Bytes(str) {
    var pos = 0;
    var len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    var arrBytes = new Array();
    for (var i = 0; i < len; i++) {
        var s = str.substr(pos, 2);
        var v = parseInt(s, 16);
		// 转成有符号的 10进制
		if (v > 127) { v = v - 256 }
		// end
        arrBytes.push(v);
        pos += 2;
    }
    return arrBytes;
}

function jstring2Str(jstring) {
   var ret;
   Java.perform(function() {
       var String = Java.use("java.lang.String");
       ret = Java.cast(jstring, String);
   });
   return ret;
}

function jbyteArray2Array(jbyteArray) {
   var ret;
   Java.perform(function() {
       var b = Java.use('[B');
       var buffer = Java.cast(jbyteArray, b);
       ret = Java.array('byte', buffer);
   });
   return ret;
}

function getParamType(obj) {
    return obj == null ? String(obj) : Object.prototype.toString.call(obj).replace(/\[object\s+(\w+)\]/i, "$1") || "object";
}
```



# 打印class

```js
function printClass(c){
    var str = "-------------------------------\n";
    str += "|" + JSON.stringify(c) + "\n";
    var fields = c.getClass().getFields();
    for(var index in fields){
        var field = fields[index];
        var fieldName = "";
        var value = "";
        try{
            fieldName = field.getName();
            value = field.get(c);
        }catch(e){

        }
        if(fieldName == ""){
            continue;
        }
        str += "|" + fieldName + ":" + printValue(value) + "\n";
    }
    str += "------------------------------\n\n\n";
    return str;
}

function printValue(value){
    try{
        var newValue = Java.cast(value, Java.use("java.lang.Object"))
        switch(newValue.getClass().getName()){
            case "[B":
                return printBytes(value)
        }
        return value;
    }catch(e){
        return value;
    }
}

function printBytes(result){
    try{
        var ByteArrayOutputStreamClass = Java.use("java.io.ByteArrayOutputStream");
        var out = ByteArrayOutputStreamClass.$new()
        var ObjectOutputStreamClass = Java.use("java.io.ObjectOutputStream");
        var sOut = ObjectOutputStreamClass.$new(out);
        sOut.writeObject(result);
        sOut.flush();
        var bytes = out.toByteArray();
        var argsArray = [];
        for(var i = 0; i < bytes.length; i++) {
            argsArray.push(bytes[i]);
        }
        return "["+argsArray.join(",")+"]";
    }catch(e){
        console.log(e);
        return result;
    }
}
```
