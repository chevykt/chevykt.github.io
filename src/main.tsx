import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import './styles/index.css'
import { router } from './app/router'

// The static title + description in index.html are for crawlers that do not run JS; from here each route renders its own.
document.querySelectorAll('head > [data-static-meta]').forEach((el) => el.remove())

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root in index.html')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
