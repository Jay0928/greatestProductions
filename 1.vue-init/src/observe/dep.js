let id = 0;
class Dep {
    constructor() { // 把Watcher放到dep上
        this.subs = [];
        this.id = id++;
    } 
    depend() {
        //给Watcher加一个标识，防止重复
        // this.subs.push(Dep.target); //让dep记住这个watcher，watcher记住dep，相互关系
        Dep.target.addDep(this);
    }
    addSub(watcher) {
        this.subs.push(watcher);//让dep记住watcher
    }
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}

Dep.target = null; //全局静态变量：window.target

export default Dep;