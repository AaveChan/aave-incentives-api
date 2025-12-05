export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  setupFiles: ['dotenv/config'], // use env var in jest
  testTimeout: 60000, // 1 minute
  workerThreads: true, // https://github.com/jestjs/jest/issues/12827#issuecomment-1838199629
};

// export default {
//   preset: 'ts-jest/presets/default-esm',
//   testEnvironment: 'node',
//   extensionsToTreatAsEsm: ['.ts'],

//   moduleNameMapper: {
//     // ✅ Match avec OU sans .js
//     '^@/(.*)(\\.js)?$': '<rootDir>/src/$1',
//     // ✅ Alternative plus explicite:
//     // '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
//     // '^@/(.*)$': '<rootDir>/src/$1',
//   },

//   transform: {
//     '^.+\\.tsx?$': [
//       'ts-jest',
//       {
//         useESM: true,
//         tsconfig: {
//           // ✅ Override pour les tests
//           moduleResolution: 'bundler', // Pas besoin d'extensions dans les tests
//         },
//       },
//     ],
//   },

//   // ✅ Important pour ESM
//   testMatch: ['**/*.test.ts'],
// };

// export default {
//   preset: 'ts-jest/presets/default-esm',
//   testEnvironment: 'node',
//   extensionsToTreatAsEsm: ['.ts'],
//   moduleNameMapper: {
//     '^@/(.*)\\.js$': '<rootDir>/src/$1.js',
//   },
//   transform: {
//     '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
//   },
// };

// export default {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/src/$1',
//     '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
//   },
//   setupFiles: ['dotenv/config'], // use env var in jest
//   testTimeout: 300000, // 5 minutes
//   workerThreads: true, // https://github.com/jestjs/jest/issues/12827#issuecomment-1838199629
// };
