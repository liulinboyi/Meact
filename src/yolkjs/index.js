
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
  Object.keys(vdom.props).forEach(name => {
    if (name !== "children") {
      // @todo: 属性判断，事件处理
      dom[name] = vdom.props[name]
    }
  })
  return dom
}

function render(vdom, container) {

  wipRoot = {
    dom: container,
    props: {
      children: [vdom],
    }
  }

  nextUnitOfWork = wipRoot
  // container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
  // 递归渲染的子元素
  // vdom.props.children.forEach(child => render(child, dom))

  // container.appendChild(dom)
}

function commitRoot() {
  commitWorker(wipRoot.child)
  wipRoot = null
}

function commitWorker(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWorker(fiber.child)
  commitWorker(fiber.slibing)
}

// 下一个单元任务
// render 函数会初始化第一个任务
let nextUnitOfWork = null
let wipRoot = null

//  调度我们的 diff 或者渲染任务
function workLoop(deadline) {
  // 有下一个任务，且当前帧还没有结束
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    // 
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  if (!nextUnitOfWork && wipRoot) {
    // 没有任务了，并且根节点还在
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

function performUnitOfWork(fiber) {
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
  // 构建成 fiber
  let index = 0
  let preSlibing = null
  while (index < elements.length) {
    let element = elements[index]
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    if (index === 0) {
      // 第一个元素，是父 fiber 的 child 属性
      fiber.child = newFiber
    } else {
      // 其他元素是兄弟元素
      preSlibing.slibing = newFiber
    }
    preSlibing = fiber
    index++
    // fiber 基本结构构建完毕
  }

  // 找下一个任务
  // 先找子元素
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  // 没有子元素，就找兄弟元素
  while (nextFiber) {
    if (nextFiber.slibing) {
      return nextFiber.slibing
    }
    // 没有兄弟元素，找父元素
    nextFiber = nextFiber.parent
  }
}

//  启动空闲时间渲染
requestIdleCallback(workLoop)

export default {
  createElement,
  render,
}