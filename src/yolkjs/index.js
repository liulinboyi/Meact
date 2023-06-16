
/**
 * 创建虚拟dom的方法
 * @param {string} type 元素类型
 * @param {any} props jsx传递的属性
 * @param  {...any} children 子元素 
 */
function createElement(type, props, ...children) {
  delete props.__source
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
  // debugger
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
        // debugger
        // onclick => chick
        dom.removeEventListener(name.slice(2).toLowerCase(), preProps[name], false)
      } else {
        dom[name] = ''
      }
    })

  Object.keys(nextProps)
    .filter(name => name !== 'children')
    .forEach(name => {
      if (name.slice(0, 2) === 'on') {
        // debugger
        // onclick => chick
        dom.addEventListener(name.slice(2).toLowerCase(), nextProps[name], false)
      } else {
        dom[name] = nextProps[name]
      }
    })
}

const updateQueue = []

function render(vdom, container) {
  // debugger
  wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    },
    base: currentRoot, // 分身
  }
  updateQueue.push(wipRoot)
  deletions = []
  // nextUnitOfWork = wipRoot
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
  // 递归渲染的子元素
  // vdom.props.children.forEach(child => render(child, dom))

  // container.appendChild(dom)
  requestIdleCallback(performWork)
}

function scheduleWork(wipRoot) {
  updateQueue.push(wipRoot)
  deletions = []
  requestIdleCallback(performWork) //开始干活
}

// function performWork() {
//   //  启动空闲时间渲染
//   requestIdleCallback(workLoop)
// }

function performWork(deadline) {
  workLoop(deadline)
  if (nextUnitOfWork || updateQueue.length > 0) {
    requestIdleCallback(performWork) //继续干
  }
}

function createWorkInProgress(queue) {
  return queue.shift()
}

function commitRoot() {
  deletions.forEach(commitWorker)
  commitWorker(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
  nextUnitOfWork = null
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
let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null
let deletions = null

//  调度我们的 diff 或者渲染任务
function workLoop(deadline) {
  if (!nextUnitOfWork) {
    //一个周期内只创建一次
    nextUnitOfWork = createWorkInProgress(updateQueue)
  }
  // 有下一个任务，且当前帧还没有结束
  // while (nextUnitOfWork && deadline.timeRemaining() > 1) {
  while (nextUnitOfWork) { // 方便调试 去掉判断当前帧是否没有结束
    // 
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  if (!nextUnitOfWork && wipRoot && !updateQueue.length) {
    // 没有任务了，并且根节点还在
    commitRoot()
  }
  // requestIdleCallback(workLoop)
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  console.log('iisFunctionComponents', isFunctionComponent, fiber.type, fiber)
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
function useState(init) {
  // debugger
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
    // debugger
    // hook.queue.length = 0
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      base: currentRoot,
    }
    // nextUnitOfWork = wipRoot
    deletions = []
    scheduleWork(wipRoot)
  }
  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
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
  while (index < elements.length) {
    // while (index < elements.length) {
    let element = elements[index]
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
}