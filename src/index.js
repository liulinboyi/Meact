// import React from 'react'
// import ReactDOM from 'react-dom'

import React from './Meact'
import './index.css'
// import { App } from './ConcurrentMode'
// import { App } from './demo'
import { App } from './demo1'

const ReactDOM = React

let element = <App title="Meact" />

ReactDOM.render(element, document.getElementById('root'))
