import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.martelinho.oliveira',
  appName: 'Martelinho Gestão',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
