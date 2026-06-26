const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fija la raíz del proyecto: hay lockfiles de otros proyectos en carpetas padre
  // (~/Documents/dev) que Turbopack detectaba como raíz por error.
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
