/**
 * labs list
 *
 */
define([
  'js/Base',
  'js/imageHosting'
],function(utils,imageHosting){
  var empty_tpl = '<div class="blank-content"><p>啥都木有</p></div>',
      base_tpl = __inline('/tpl/labsListBase.html'),
      item_temp = __inline('/tpl/labsListItem.html');

  var limit = 20,
      skip = 0,
      count = null,
      dom;
  var getData = function(callback){
    utils.fetch({
      type : 'GET' ,
      url : '/ajax/labs',
      data : {
        act : 'get_list',
        skip : skip,
        limit : limit
      },
      callback :function(err,data){
        if(err || data.code == 500){
          callback && callback(500);
          return;
        }
        count = data['count'];
        skip += limit;

        var list = data['list'];
        for(var i = 0,total = list.length;i<total;i++){
          list[i]['work_range'] = list[i]['work_range']?list[i]['work_range'].split(/\,/):['暂未填写'];
          //使用七牛图床
          list[i].cover = imageHosting(list[i].cover,{
            type : 'cover',
            width : 320,
            height: 400
          });
        }
        callback&&callback(null,list);
      }
    });
  };
  return function(dom,param){
    skip = 0;
    dom.innerHTML = base_tpl;
    getData(function(err,list){
      var this_html;
      if(err){
        this_html = empty_tpl;
      }else{
        this_html = juicer(item_temp,{
          list : list
        });
      }
      utils.query('.labsList',dom).innerHTML = this_html;
    });
  };
});
