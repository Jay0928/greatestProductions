import { initMixin } from "./init";
import { leftCyleMixin } from "./leftCycle";
import { renderMixin } from "./render";

function Vue(options){
    this._init(options); // 实现vue的初始化功能
}

initMixin(Vue);

//render的扩展方法
renderMixin(Vue);//真实节点
leftCyleMixin(Vue);//渲染真实节点


export default Vue; 