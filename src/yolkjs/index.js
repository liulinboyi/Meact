// 没有lean 无法实现并发更新
// 现在这版实现的是完全的微任务更新
// Legacy 模式。如果是在 event、setTimeout、network request 的 callback 中触发更新，那么协调时会启动 workLoopSync。
// workLoopSync 开始工作以后，要等到 stack 中收集的所有 fiber node 都处理完毕以后，才会结束工作，也就是 fiber tree 的协调过程不可中断。

/**
 * 创建虚拟dom的方法
 * @param {string} type 元素类型
 * @param {any} props jsx传递的属性
 * @param  {...any} children 子元素 
 */
function createElement(type, props, ...children) {
  // console.warn(children);
  if (props) {
    delete props.__source;
  }
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object' ? child : createTextElement(child)
      )
    }
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT',
    props: {
      nodeValue: text,
      children: [],
    }
  }
}

/**
 * 通过虚拟 dom 新建 dom 元素
 * @param {*} vdom 虚拟 dom
 */
function createDom(vdom) {
  const dom = vdom.type === "TEXT"
    ? document.createTextNode("")
    : document.createElement(vdom.type)
  updateDom(dom, {}, vdom.props)
  // Object.keys(vdom.props).forEach(name => {
  //   if (name !== "children") {
  //     // @todo: 属性判断，事件处理
  //     dom[name] = vdom.props[name]
  //   }
  // })
  return dom
}

function updateDom(dom, preProps, nextProps) {
  /**
   * 1. 规避 children 属性
   * 2. 老得存在，取消
   * 3. 新的存在，新增， 
   */

  //  @todo 兼容性问题  

  const filterPreProps = name => {
    if (name.slice(0, 2) !== 'on') {
      return false
    }
    if (!(name in nextProps)) {
      return false
    }
    return true
  }
  
  Object.keys(preProps)
    .filter(name => name !== 'children')
    .filter(filterPreProps)
    .forEach(name => {
      if (name.slice(0, 2) === 'on') {
        // onclick => chick
        const eventName = `${name.slice(2).toLowerCase()}__invoker`
        if (dom[eventName]) {
          dom.removeEventListener(name.slice(2).toLowerCase(), dom[eventName], false)
        }
      } else {
        dom[name] = ''
      }
    })

  Object.keys(nextProps)
    .filter(name => name !== 'children')
    .forEach(name => {
      if (name.slice(0, 2) === 'on') {
        // onclick => chick
        const eventName = `${name.slice(2).toLowerCase()}__invoker`
        dom[eventName] = () => {
          nextProps[name]()
        }
        dom.addEventListener(name.slice(2).toLowerCase(), dom[eventName], false)
      } else {
        dom[name] = nextProps[name]
      }
    })
}

const queue = []

const schedule = (task) => {
  debugger
  queue.push(task)
  flush()
}

function flush() {
  queueMicrotask(wookLoopSync)
}

function wookLoopSync() {
  performWork()
}

function performWork() {
  let task;
  // task 执行可以返回下一个 loop
  while ((task = queue.pop())) {
    task();
  }
}

const reconcile = (WIP) => {
  debugger
  const wipRoot = WIP
  // workLoop(WIP)
  // nextUnitOfWork = WIP
  // 有下一个任务，且当前帧还没有结束
  while (WIP) { // 方便调试 去掉判断当前帧是否没有结束
    WIP = performUnitOfWork(WIP)
  }
  debugger
  // TODO
  // if (WIP) return reconcile.bind(null, WIP)
  if (!WIP) {
    // 没有任务了，并且根节点还在
    commitRoot(wipRoot)
  }
}

const update = (fiber) => {
  if (fiber) {
    // fiber.lane = LANE.UPDATE | LANE.DIRTY
    schedule(() => {
      wipFiber = fiber
      return reconcile(fiber)
    })
  }
}

function render(vdom, container) {
  let wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: currentRoot, // 分身
  }
  deletions = []

  update(wipRoot)
}

function scheduleWork(wipRoot) {
  deletions = []
  // postTask() //开始干活
  update(wipRoot)
}

function commitEffects (effects) {
  Object.keys(effects).forEach(key => {
    let effect = effects[key]
    effect()
  })
}

function commitRoot(wipRoot) {
  deletions.forEach(commitWorker)
  commitWorker(wipRoot.child)

  commitEffects(wipFiber.effects)

  wipFiber.effects = []
  currentRoot = wipRoot
  effectIndex = 0
}

function commitWorker(fiber) {
  if (!fiber) {
    return
  }
  // const domParent = fiber.parent.dom
  // domParent.appendChild(fiber.dom)
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
    // domParent.removeChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    // 更新dom
    updateDom(fiber.dom, fiber.base.props, fiber.props)
  }
  commitWorker(fiber.child)
  commitWorker(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

// 下一个单元任务
// render 函数会初始化第一个任务
// let nextUnitOfWork = null
let currentRoot = null
let deletions = null

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  // console.log('iisFunctionComponents', isFunctionComponent, fiber.type, fiber)
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    // dom
    updateHostComponent(fiber)
  }
  // 找下一个任务
  // 先找子元素
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  // 没有子元素，就找兄弟元素
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    // 没有兄弟元素，找父元素
    nextFiber = nextFiber.parent
  }
}

let wipFiber = null
let hookIndex = null
let effectIndex = 0
function useState(init) {
  const oldHook = wipFiber.base && wipFiber.base.hooks[hookIndex]
  let hook
  if (oldHook) {
    hook = oldHook
  } else {
    hook = {
      state: oldHook ? oldHook.state : init,
      queue: []
    }
  }
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action
  })
  hook.queue.shift()
  const setState = action => {
    // hook.queue.length = 0
    hook.queue.push(action)
    let wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      base: currentRoot,
    }
    deletions = []
    scheduleWork(wipRoot)
  }
  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

let oldInputs = []
function processEffect (create, inputs, oldFiber) {
  return function () {
    const current = wipFiber
    if (current) {
      let hasChanged
      if (inputs) {
        if (Array.isArray(inputs)) {
          if (inputs.length) {
            hasChanged = oldInputs.some((value, i) => inputs[i] !== value)
          }
          if (!oldFiber) {
            hasChanged = true
          }
        } else {
          throw new Error("the dep must be a Array")
        }
      } else {
        hasChanged = true
      }
      if (hasChanged) {
        create()
      }
      oldInputs = inputs
    }
  }
}

function useEffect(effect, inputs) {
  const current = wipFiber
  // const cursor = hookIndex
  if (current) {
    let key = '$' + effectIndex
    const oldFiber = wipFiber.base
    current.effects[key] = processEffect(effect, inputs, oldFiber)
    effectIndex++
  }
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  wipFiber.effects = wipFiber.base ? wipFiber.base.effects : []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
  // 获取下一个任务
  // 根据当前任务获取下一个任务
  if (!fiber.dom) {
    // 不是入口
    fiber.dom = createDom(fiber)
  }

  // // 真实的 dom 操作
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom)
  // }

  const elements = fiber.props.children

  reconcileChildren(fiber, elements)

}

function reconcileChildren(wipFiber, elements) {
  // 构建成 fiber
  let index = 0
  let oldFiber = wipFiber.base && wipFiber.base.child
  let preSibling = null
  const allElement = []
  for (let n of elements) {
    if (Array.isArray(n)) {
      allElement.push(...n)
    } else {
      allElement.push(n)
    }
  }
  while (index < allElement.length) {
    // while (index < elements.length) {
    let element = allElement[index]
    let newFiber = null
    // 对比 oldfiber 的状态和当前 element
    // 先比较类型，
    const sameType = oldFiber && element && oldFiber.type === element.type
    if (sameType) {
      // 复用节点，更新
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        base: oldFiber,
        effectTag: "UPDATE",
      }
    }

    if (!sameType && element) {
      // 新增节点
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        base: null,
        effectTag: "PLACEMENT",
      }
    }
    if (!sameType && oldFiber) {
      // 删除
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    if (index === 0) {
      // 第一个元素，是父 fiber 的 child 属性
      wipFiber.child = newFiber
    } else {
      // 其他元素是兄弟元素
      preSibling.sibling = newFiber
    }
    preSibling = newFiber
    index++
    // fiber 基本结构构建完毕
  }
}


export default {
  createElement,
  render,
  useState,
  useEffect,
  startTranstion: schedule,
}
