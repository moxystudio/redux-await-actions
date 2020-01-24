'use strict';

const { baseConfig, compose } = require('@moxy/jest-config-base');

module.exports = compose(
    baseConfig('node'),
    (config) => ({
        ...config,
        setupFiles: ['<rootDir>/jest.setup'],
        coveragePathIgnorePatterns: [
            ...config.coveragePathIgnorePatterns,
            '<rootDir>/test/utils/',
        ],
    }),
);
