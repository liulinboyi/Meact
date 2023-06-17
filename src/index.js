// import React from 'react'
// import ReactDOM from 'react-dom'

import React from './yolkjs'

const ReactDOM = React

function App(props) {
  const [count, setCount] = React.useState(1)
  const [demo, setDemo] = React.useState('hello')

  React.useEffect(() => {
    console.log("[useEffect]", count)
  }, [])

  const addTwice = () => {
    const c1 = Math.random() * 10 + count
    console.warn("[c1]", c1)
    setCount(c1)
    Promise.resolve().then(() => {
      const c2 = Math.random() * 10 + count
      console.warn("[c2]", c2)
      // debugger
      setCount(c2)
      setTimeout(() => {
        const c3 = Math.random() * 10 + count
        console.warn("[c3]", c3)
        // debugger
        setCount(c3)
      })
    })
  }
  return (
    <div id="app">
      <h1>hello, {props.title}</h1>
      <p>react dom {count}</p>
      <p>react demo {demo}</p>
      <a href="https://jd.com">shop</a>
      <button onClick={() => addTwice()}>add</button>
      <button onClick={ () => setDemo(demo + Math.random() * 10) }>change</button>
    </div>
  )
}

let element = <App title="yolkjs" />

ReactDOM.render(element, document.getElementById('root'))
