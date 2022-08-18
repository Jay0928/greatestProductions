import { initMixin } from "./init";

function Vue(options){
    this._init(options); // 实现vue的初始化功能
}

initMixin(Vue);


export default Vue;