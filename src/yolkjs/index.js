
function createElement(type, props, ...children) {
  delete props.__source
  return {
    type,
    props: {
      ...props,
      children,
    }
  }
}

function render(vdom, container) {
  container.innerHTML = `<pre>${JSON.stringify(vdom, null, 2)}</pre>`
}

export default {
  createElement,
  render,
}