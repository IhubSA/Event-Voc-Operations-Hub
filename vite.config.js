export default {
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Vite only bundles the HTML files listed here as build entries --
      // index.html was implicit before, but any additional standalone page
      // (like register.html, the public self-registration link) has to be
      // declared explicitly or it never makes it into dist/ and 404s live.
      input: {
        main: 'index.html',
        register: 'register.html',
        vendors: 'vendor-registration.html'
      }
    }
  }
}
