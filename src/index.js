// import React from 'react'
// import ReactDOM from 'react-dom'

import React from './yolkjs'
// import { App } from './ConcurrentMode'
// import { App } from './demo'
import { App } from './demo1'

const ReactDOM = React

let element = <App title="yolkjs" />

ReactDOM.render(element, document.getElementById('root'))
