module.exports = {
  apps: [
    {
      name: "snap-be", // Nama aplikasi
      script: "./index.js", // Entry point (ubah kalau pakai app.js/server.js/etc)
      instances: 1, // Bisa diganti jadi 'max' untuk cluster mode
      autorestart: true,
      watch: false, // true kalau mau restart saat file berubah
      max_memory_restart: "500M",

      //   env: {
      //     NODE_ENV: "development",
      //     PORT: 3000,
      //     // Tambahkan env dev lainnya di sini
      //   },

      //   env_production: {
      //     NODE_ENV: "production",
      //     PORT: 8080,
      //     // Tambahkan env prod lainnya di sini
      //   },
    },
  ],
};
