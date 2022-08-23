import Dep from "./dep";

class Watcher {
    constructor(vm, fn, cb, options) { //dep放到Watcher中
        this.vm = vm;
        this.fn = fn;
        this.cb = cb;
        this.options = options;

        this.getter = fn; //页面渲染逻辑

        this.get();//初始化
    }
    get() {
        Dep.target = this;
        this.getter();
    }
}

export default Watcher