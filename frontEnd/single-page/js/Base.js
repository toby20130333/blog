/**
 * IE9+
 **/
(function(global,doc,factory){
  var utils = factory(global,doc);
  if(global.define){
    //提供CommonJS规范的接口
    define(utils);
  }else{
    //提供window.UI的接口
    global.utils = global.utils || utils;
  }
})(this,document,function(window,document){
  /**
   * 检测是否为数字
   * 兼容字符类数字 '23'
   */
  function isNum(ipt){
    return (ipt !== '') && (ipt == +ipt) ? true : false;
  }

  /**
   * 遍历
  **/
  function each(arr,fn,scope){
    //检测输入的值
    if(typeof(arr) == 'object' && typeof(fn) == 'function'){
      var Length = arr.length;
      if(isNum(Length)){
        for(var i=0;i<Length;i++){
          fn.call(scope,arr[i],i,this);
        }
      }else{
        for(var i in arr){
          if (!arr.hasOwnProperty(i)){
            continue;
          }
          fn.call(scope,arr[i],i,this);
        }
      }
    }
  }
  //判断 dom 是否符合
  var matches = (function(){
    var prop = Element.prototype,
        matches = prop.matches || prop.matchesSelector || prop.msMatchesSelector || prop.mozMatchesSelector || prop.webkitMatchesSelector || prop.oMatchesSelector;
    return function(target,selector){
      return matches.call(target,selector);
    };
  })();
  /**
   * 判断dom是否拥有某个class
   */
  function hasClass(dom,classSingle){
    if(dom && dom.className){
      return !!dom.className.match(new RegExp('(\\s|^)' + classSingle + '(\\s|$)'));
    }
  }
  function addClass(dom, cls) {
    if(dom && !hasClass(dom, cls)){
      dom.className += " " + cls;
    }
  }
  function removeClass(dom, cls) {
    if (dom && hasClass(dom, cls)) {
      var reg = new RegExp('(\\s+|^)' + cls + '(\\s+|$)');
      dom.className = dom.className.replace(reg, ' ');
    }
  }
  function toggleClass(dom, cls) {
    (hasClass(dom, cls) ? removeClass : addClass)(dom,cls);
  }
  /**
   * dom设置样式
   */
  function setStyle(elem,prop,value){
    prop = prop.toString();
    if(isNum(value) && prop != 'zIndex'){
      value = value + "px";
    }
    elem.style[prop] = value;
  }
  function CSS(node,cssObj){
    if(!node || !cssObj){
      return;
    }
    /**
     * 为css3属性增加扩展
     */
    each(cssObj,function(value,key){
      if(key == 'transform' || key == 'transition'){
        each(['webkit','o','moz'],function(i,text){
          cssObj['-' + text + '-' + key] = value
        });
      }
    });
    each(cssObj,function(value,key){
      setStyle(node,key,value);
    });
  }

  //读取dom在页面中的位置
  function offset(elem){
   var box = {
     top : 0,
     left : 0,
     screen_top : 0,
     screen_left : 0
   },
   size;

   if (typeof(elem.getBoundingClientRect) !== 'undefined' ) {
     size = elem.getBoundingClientRect();
   }
   box.screen_top = size.top;
   box.screen_left = size.left;

   box.top = size.top + (document.documentElement.scrollTop == 0 ? document.body.scrollTop : document.documentElement.scrollTop);
   box.left = size.left + document.body.scrollLeft;

   return box;
  }

  var private_prefix = 'Query',
      private_salt = parseInt(new Date().getTime()/1000).toString(36),
      operate_id = 0;
  //查找 DOM，仅限内部调用参数不做校验
  function findNode(selector,context,queryMethod){
    var id = context.getAttribute("id"),
        newSelector = selector,
        useID,
        returns;
    if(!id){
      //生成临时 ID
      useID = [private_prefix, private_salt, ++operate_id].join('_');
      context.setAttribute('id',useID);
    }else{
      useID = id;
    }
    returns = document[queryMethod]('#' + useID + ' ' + selector);
    !id && context.removeAttribute('id');
    return returns;
  }
  /**
   * 检索DOM
   *  selector：选择器
   *  context：查找对象，可选
   *  isAllMatches：是否匹配所有元素，默认：是
   **/
  function Query(selector,context,isAllMatches){
    var returns = [],
        selectorMatchs,
        //全部匹配还是进返回单个 node
        isAllMatches = (typeof(isAllMatches) == 'boolean') ? isAllMatches : true,
        queryMethod = 'querySelector' + (isAllMatches ? 'All' : '');
    //查询语句不存在或不为字符串，返回空数组
    if(!selector || typeof(selector) !== 'string'){
      return returns;
    }
    //查找对象存在，使用 find 逻辑
    if(context && context.nodeType){
      //匹配选择器
      selectorMatchs = selector.match(/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/);
      //选择器为简单模式
      if(selectorMatchs){
        //ID
        if(selectorMatchs[1]){
          returns = [context.getElementById(selectorMatchs[1])];
        }else if(selectorMatchs[2]){
          //classname
          returns = context.getElementsByTagName(selectorMatchs[2]);
        }else{
          //tagname
          returns = context.getElementsByClassName(selectorMatchs[3]);
        }
        //返回单个 node
        !isAllMatches && (returns = returns[0] || null);
      }else{
        returns = findNode(selector,context,queryMethod)
      }
    }else{
      //直接 query
      returns = document[queryMethod](selector);
    }
    return returns;
  }
  /**
   * 匹配 selector 与 dom 间关系
  **/
  function matchsSelectorBetweenNode(fromNode,selector,endNode){
    var target = fromNode,
        selectors = selector.trim().split(/\s+/),
        last_select = selectors.pop(),
        parentsList = [],
        bingoDom;

    while (1) {
      //匹配结束
      if(target == endNode || !target){
        return false;
      }
      //单条匹配成功
      if(matches(target,last_select)){
        // 命中的 dom
        if(!bingoDom){
          bingoDom = target;
        }
        //拆分当前匹配
        parentsList = last_select.split(/\s*\>\s*/);
        //包含父级匹配，如 .parent>.child>span
        if(parentsList.length > 1){
          //最后一条已无需对比
          parentsList.pop();
          //逆序遍历父级列表
          for(var i = parentsList.length-1;i>=0;i--){
            target = target.parentNode;
            if(!matches(target,parentsList[i])){
              return false;
            }
          }
        }
        if(!selectors.length){
          return bingoDom;
        }
        last_select = selectors.pop();
      }
      target = target.parentNode;
    }
  }

  /**
   * 事件绑定
   * elem: dom 节点，支持数组和单个 node节点
   * type: 事件类型，支持空格分割多个事件如：'keydown keyup'
   * selector: 可选，用于事件委托
   * callback: 回调函数，最后一个参数
   */
  function bind(elem, type,a,b){
    var elems = [].concat(elem),
        types = type.split(/\s+/),
        selector,
        listenerFn,
        returns = {
          bind: function(type,a,b){
            bind(elem,type,a,b);
            return returns;
          }
        };
    if(typeof(a) == 'function'){
      listenerFn = a;
    }else if(typeof(a) == 'string' && typeof(b) == 'function'){
      selector = a;
    }else{
      //没有定义回调函数，结束运行
      return;
    }
    //遍历元素
    each(elems,function(node){
      if(selector){
        listenerFn = function(events){
          var target = events.srcElement || events.target,
              //selector支持多个配置，如 ".side a,.nav a"
              selectors = selector.split(/\s*\,\s*/),
              bingoDom;
          for(var i=0,total=selectors.length;i<total;i++){
            bingoDom = matchsSelectorBetweenNode(target,selectors[i],node);
            if(bingoDom){
              b && b.call(bingoDom,events);
              break;
            }
          }
        };
      }
      each(types,function(event_name){
        //false:仅监听冒泡阶段
        node.addEventListener(event_name, listenerFn, false);
      });
    });
    return returns;
  }
  /**
   * 事件解除
   * elem:节点
   * type:事件类型
   * handler:回调
   */
  function unbind(elem, type, handler) {
    elem.removeEventListener(type, handler, false);
  }

  function trigger(node,eventName){
    var event = document.createEvent('HTMLEvents');
    event.initEvent(eventName, true, false);
    node.dispatchEvent(event);
  }
  function createDom(html){
    var a = document.createElement('div');
    a.innerHTML = html;
    return a.childNodes[0];
  }
  // 字符化参数
  function paramStringify(data, baseKey){
    var dataArray = [],key,value;

    for(var i in data){
      key = baseKey ? baseKey + '[' + i + ']' : i,
      value = data[i];

      if(value && value != 0 && value != ''){
        if(typeof(value) == 'object'){
          dataArray.push(paramStringify(data[i],key));
        }else{
          dataArray.push(key + '=' + data[i]);
        }
      }
    }
    return dataArray.join('&');
  }
  function fetch(param){
    param = param || {};
    var url = param.url,
        callback = param.callback || null,
        headers = param.headers || {},
        data = param.data,
        dataStr = paramStringify(data),
        method = (param.type && param.type.match(/^(get|post)$/i)) ? param.type.toUpperCase() : 'GET',
        request = new XMLHttpRequest();

    headers.accept = "application/json, text/javascript";
    if(method == 'POST'){
      headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    }else{
      url = dataStr.length ? (url + '?' + dataStr) : url;
      dataStr = undefined;
    }
    request.open(method, url, true);
    //设置 headers
    for(i in headers){
      request.setRequestHeader(i, headers[i]);
    }
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var resp = request.responseText;
        resp = JSON.parse(resp);
        callback && callback(null,resp,request);
      } else {
        callback && callback(request.status,resp,request);
      }
    };

    request.onerror = function() {
      callback && callback('connection fail',resp,request);
    };
    request.send(dataStr);
  }

  /**
   * @param (timestamp/Date,'{y}-{m}-{d} {h}:{m}:{s}')
   * @param (timestamp/Date,'{y}-{mm}-{dd} {hh}:{mm}:{ss}')
   *
   * y:year
   * m:months
   * d:date
   * h:hour
   * i:minutes
   * s:second
   * a:day
   */
  function parseTime(time,format){
    if(arguments.length==0){
      return null;
    }
    var format = format ||'{y}-{m}-{d} {h}:{i}:{s}';

    if(typeof(time) == "object"){
      var date = time;
    }else{
      var date = new Date(parseInt(time));
    }

    var formatObj = {
      y : date.getYear()+1900,
      m : date.getMonth()+1,
      d : date.getDate(),
      h : date.getHours(),
      i : date.getMinutes(),
      s : date.getSeconds(),
      a : date.getDay(),
    };

    var time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g,function(result,key){
      var value = formatObj[key];
      if(result.length > 3 && value < 10){
        value = '0' + value;
      }
      return value || 0;
    });
    return time_str;
  };
  return {
    queryAll: Query,
    query: function(selector,context){
      return Query(selector,context,false);
    },
    each: each,
    parseTime: parseTime,
    offset: offset,
    createDom: createDom,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,
    css: CSS,
    remove: function (node){
      node.parentNode.removeChild(node);
    },
    parents: function(node,selector){
      if(!node || typeof(selector)!=='string' || selector.split(',').length > 1){
        return null;
      }
      return matchsSelectorBetweenNode(node,selector);
    },
    bind: bind,
    trigger: trigger,
    fetch: fetch
  };
});
