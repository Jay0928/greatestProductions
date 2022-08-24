import Dep from "./dep";
import {queueWatcher} from "./scheduler";
let id = 0;//防止重复
class Watcher {
    constructor(vm, fn, cb, options) { //dep放到Watcher中
        this.vm = vm;
        this.fn = fn;
        this.cb = cb;
        this.options = options;
        this.id = id++;
        this.depsId = new Set()
        this.deps = []

        this.getter = fn; //页面渲染逻辑

        this.get();//初始化
    }
    addDep(dep) {
        let did = dep.id;
        if(!this.depsId.has(did)) {
            this.depsId.add(did)
            this.deps.push(dep);//保存id，并让watcher记住dep
            dep.addSub(this);
        }
    }
    get() {
        Dep.target = this; //Dep.target = Watcher
        this.getter(); //页面渲染逻辑
        Dep.target = null; //渲染完成将标识清空，只有在渲染时候才会进行依赖收集
    }
    update() {//每次更新数据都会同步调用update，可以将更新的逻辑缓存起来，等会同步更新数据的逻辑执行完毕后，依次调用（去重）
        console.log("缓存次数")
        queueWatcher(this);
        //做异步更新vue.nextTick
        this.get();
    }
    run() {
        console.log("真正更新的次数")
        this.get()
    }
}

export default Watcher