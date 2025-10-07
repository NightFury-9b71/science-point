import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'

  return {
    plugins: [
      react({
        // Enable React Fast Refresh in development
        fastRefresh: !isProduction,
        // Production optimizations
        babel: {
          plugins: isProduction ? [
            ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]
          ] : []
        }
      }),
      tailwindcss()
    ],

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@services': resolve(__dirname, './src/services'),
        '@utils': resolve(__dirname, './src/utils'),
        '@config': resolve(__dirname, './src/config'),
        '@contexts': resolve(__dirname, './src/contexts'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@assets': resolve(__dirname, './src/assets')
      }
    },

    // Build configuration
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction, // Source maps only for development/staging
      minify: isProduction ? 'esbuild' : false,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
            'ui-vendor': ['lucide-react', 'sonner'],
            'http-vendor': ['axios'],
            
            // Feature chunks
            'admin-pages': [
              './src/pages/admin/AdminStudents.jsx',
              './src/pages/admin/AdminTeachers.jsx',
              './src/pages/admin/AdminClasses.jsx',
              './src/pages/admin/AdminSubjects.jsx',
              './src/pages/admin/AdminNotices.jsx',
              './src/pages/admin/AdminOverview.jsx',
              './src/pages/admin/AdminProfile.jsx',
              './src/pages/admin/AdminSchedule.jsx'
            ],
            'teacher-pages': [
              './src/pages/teacher/TeacherAttendance.jsx',
              './src/pages/teacher/TeacherClasses.jsx',
              './src/pages/teacher/TeacherExams.jsx',
              './src/pages/teacher/TeacherOverview.jsx',
              './src/pages/teacher/TeacherResults.jsx',
              './src/pages/teacher/TeacherSchedule.jsx',
              './src/pages/teacher/TeacherStudents.jsx'
            ],
            'student-pages': [
              './src/pages/student/StudentAttendance.jsx',
              './src/pages/student/StudentMaterials.jsx',
              './src/pages/student/StudentNotices.jsx',
              './src/pages/student/StudentProfile.jsx',
              './src/pages/student/StudentResults.jsx'
            ]
          },
          
          // Asset file naming
          chunkFileNames: (chunkInfo) => {
            if (isProduction) {
              return 'js/[name].[hash].js'
            }
            return 'js/[name].js'
          },
          entryFileNames: isProduction ? 'js/[name].[hash].js' : 'js/[name].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const extType = info[info.length - 1]
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]${isProduction ? '.[hash]' : ''}.[ext]`
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `fonts/[name]${isProduction ? '.[hash]' : ''}.[ext]`
            }
            return `assets/[name]${isProduction ? '.[hash]' : ''}.[ext]`
          }
        },
        
        // External dependencies (if needed)
        external: []
      },
      
      // Compression and optimization
      cssCodeSplit: true,
      cssMinify: isProduction,
      
      // Report compressed file sizes
      reportCompressedSize: isProduction,
      
      // Cleanup output directory before build
      emptyOutDir: true,
      
      // Copy public files
      copyPublicDir: true
    },

    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: false,
      cors: true,
      
      // API proxy for development
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
      cors: true
    },

    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'lucide-react',
        'sonner'
      ],
      exclude: []
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },

    // ESBuild configuration
    esbuild: {
      // Remove console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Enable top level await
      target: 'es2022'
    },

    // CSS configuration
    css: {
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCase'
      },
      
      // PostCSS configuration
      postcss: {
        plugins: []
      },
      
      // CSS preprocessor options
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    }
  }
})
