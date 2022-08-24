import { nextTick } from '../utils'
let queue = [];//队列，存放要更新的watcher
let has = {};//存放已有的watcher的id

let pedding = false;

function flushSchedulerQueue() {
    queue.forEach(watcher => watcher.run())
    queue = [];
    has = {};
    pedding = false;
}

export function queueWatcher (watcher) {
    //一般情况下，写去重，可以采用这种方式，或者使用Set()
    let id = watcher.id
    if(has[id] == null) { //去重：去掉重复的watcher
        has[id] = true;
        queue.push(watcher)
        if(!pedding) {
            //防抖，多次执行，只执行一次
            nextTick(flushSchedulerQueue)
            pedding = true;
        }
    }
}