//////////////////////
// 复制整个js路径下的代码         done
// 创建pk.js                      done
// 获取html文件中srcipt 中的 src  done
// 修改pk.js的内容                done
// 把html中的srcript加入到pk.js中 done
// requirejs中需要判断data-main   done
// 修改html文件注释script引入文件 done
// 注释script中的js代码           done
//////////////////////
var gulp = require('gulp');
var through = require("through2");

var scriptSrcArr = [];
var ieContent = '';
var chromeContent = '';
var template = '"use strict";\r\n\
function isIE() {\r\n\
	if (!!window.ActiveXObject || "ActiveXObject" in window)\r\n\
		return true;\r\n\
	else\r\n\
		return false;\r\n\
}\r\n\
\r\n\
if (isIE()) {\r\n\
    $IEContent\r\n\
} else {\r\n\
    $ChromeContent\r\n\
}\r\n\
\r\n\
function loadScript (src, callback) {\r\n\
	var body= document.getElementsByTagName("body")[0];\r\n\
	var script= document.createElement("script");\r\n\
	script.type= "text/javascript";\r\n\
	script.onload = script.onreadystatechange = function() {\r\n\
	    if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {\r\n\
	        callback ? callback() : "";\r\n\
	        script.onload = script.onreadystatechange = null;\r\n\
	    }\r\n\
	};\r\n\
	script.src= src;\r\n\
	body.appendChild(script);\r\n\
}\r\n';


/**
 * 对basePath进行排序
 * @param  {Array} arr js路径
 */
/*(function sortBasePath (arr) {
    arr.sort(function (a, b) {
        return a.length > b.length ? -1 : 1;
    });
})(basePath);
*/
/**
 * 获取文件中script的内容
 * @return {[type]} [description]
 */
function getScriptContent (basePath) {
    return through.obj(function (file, enc, cb) {
        var str = file.contents.toString('utf-8'); 
        //把空格 空白标准化处理掉
        // str = str.replace(/\r\n?|[\n\u2028\u2029]/g, "\n").replace(/^\uFEFF/, "");
        
        // 删去html代码注释
        str = str.replace(/<!--(.|\s)*?-->/g, "");

        // var myReg = /<script[^>]*>.*(?=<\/script>)<\/script>/gi;
        // scriptArr = str.match(myReg);
        // console.log(scriptArr);
            
        /*var reg = /<script[^>]*src[=\'\"\s]+([^\"\']*)[\"\']?[^>]*>.*(?=<\/script>)<\/script>/gi;
        srcArr = str.match(reg);
        for (var i = 0; i < srcArr.length; i++) {
            console.log(srcArr[i]);
            console.log(RegExp.$1);
        }*/
        
        // 把匹配出的js放置到一个数组中
        var reg = /<script[^>]*src[=\'\"\s]+([^\"\']*)[\"\']?[^>]*>.*(?=<\/script>)<\/script>/gi;
        while (reg.exec(str)) {
            scriptSrcArr.push(RegExp.$1);
        }

        // require 的data-main取出来
        var regRequire = /<script[^>]*data-main[=\'\"\s]+([^\"\']*)[\"\']?[^>]*>.*(?=<\/script>)<\/script>/gi;
        while (regRequire.exec(str)) {
            scriptSrcArr.push(RegExp.$1);
        }
        
        var regScriptContent = /<script[^>]*?>([\s\S]*?)<\/script>/gi;
        var regScriptContentStr = '';
        var regScriptContentArr = [];
        while (regScriptContent.exec(str)) {
            regScriptContentArr.push(RegExp.$1);
        }

        regScriptContentStr = regScriptContentArr.join('');
        // console.log(regScriptContentArr);
        // console.log(str.match(regScriptContent));
        // console.log(str);

        ieConcat(regScriptContentStr);
        chromeConcat(regScriptContentStr,basePath);

        var outputStr = template;
        outputStr = outputStr.replace('$IEContent', ieContent);
        outputStr = outputStr.replace('$ChromeContent', chromeContent);
        
        file.contents = new Buffer(outputStr);
        this.push(file);
        cb();
    });
}
// <script[^>]*>.*(?=<\/script>)<\/script>
// http://tool.oschina.net/regex/

/**
 * ie拼接字符串
 * @return {[type]} [description]
 */
function ieConcat (content) {
    for (var i = 0; i < scriptSrcArr.length; i++) {
        ieContent += ('loadScript("' + scriptSrcArr[i] + '", function () {\r\n');
    }
    ieContent += content;
    while (i--) {
        ieContent += ('});\r\n');
    }
}

/**
 * chrome拼接字符串
 * @return {null} 不返回
 */
function chromeConcat (content,basePath) {
    for (var i = 0; i < scriptSrcArr.length; i++) {
        var scriptUrl = scriptSrcArr[i];
       
        for (var j = 0; j < basePath.length; j++) {
            scriptUrl = scriptUrl.replace(basePath[j] + '/', basePath[j] + '-cef/');
        }

        chromeContent += ('loadScript("' + scriptUrl + '", function () {\r\n');
    }
    chromeContent += content;
    while (i--) {
        chromeContent += ('});\r\n');
    }
    chromeContent = 'loadScript("../common/scripts/thsApi.js", function () {\r\n'
                + chromeContent
                + ('});\r\n');
}

/**
 * 把js注释掉
 * @return {[type]} [description]
 */
function commentScript(){
    return through.obj(function (file, enc, cb) {
        var str = file.contents.toString('utf-8');
        var outputStr = str;
        // 删去html代码注释
        str = str.replace(/<!--(.|\s)*?-->/g, "");
        
        var scriptSrcTempArr = [];
        var reg = /<script[^>]*>(.*)(?=<\/script>)<\/script>/gi;
        
        scriptSrcTempArr = str.match(reg);
        scriptSrcTempArr === null ? scriptSrcTempArr = [] : '';
        // console.log(scriptSrcTempArr);

        // var myRegToReplace;
        for (var i = 0; i < scriptSrcTempArr.length; i++) {
            myRegToReplace = new RegExp(scriptSrcTempArr[i], "g");
            // console.log(myRegToReplace);
            outputStr = outputStr.replace(myRegToReplace, '<!--' + scriptSrcTempArr[i] + '-->');
        }
        
        
        // var regScriptContent = /<script[^>]*?>([\s\S]+?)<\/script>/gi;
        var regScriptContent = /<script[^>]*?>([\s\S]*?)<\/script>/gi;
        // console.log(outputStr.match(regScriptContent));
        while (regScriptContent.exec(outputStr)) {
            if (RegExp.$1 != '') {
                // console.log(RegExp.$1);
                outputStr = outputStr.replace(RegExp.$1, '/*' + RegExp.$1 + '*/');
            }
        }
        
        outputStr = outputStr.replace('</body>', '<script src="judgeCef.js"></script></body>');

        file.contents = new Buffer(outputStr);
        this.push(file);
        cb();
    });
}

function trim (str) {
    return str.replace(/(^\s*)|(\s*$)/g, ''); 
}

module.exports = {
	getScriptContent:getScriptContent,
	commentScript:commentScript
};