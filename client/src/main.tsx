import React from 'react'
import ReactDOM from 'react-dom/client'
import InteractiveChart from './InteractiveChart.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <InteractiveChart />
  </React.StrictMode>,
)
