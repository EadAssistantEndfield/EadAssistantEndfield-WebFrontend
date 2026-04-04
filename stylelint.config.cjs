module.exports = {
  plugins: ['stylelint-scss'],
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue'
  ],
  ignoreFiles: [
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '**/*.min.css',
    '**/*.js',
    '**/*.ts'
  ],
  rules: {
    'color-function-notation': 'legacy',
    'color-function-alias-notation': null,
    'alpha-value-notation': 'number',
    'color-hex-length': null,
    'declaration-empty-line-before': null,
    'font-family-name-quotes': null,
    'font-family-no-missing-generic-family-keyword': null,
    'keyframes-name-pattern': null,
    'rule-empty-line-before': null,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'value-keyword-case': null,
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['deep', 'global', 'slotted']
    }],
    'media-feature-range-notation': null,
    'property-no-vendor-prefix': null,
    'property-no-unknown': [true, {
      ignoreProperties: ['shrink']
    }],
    'shorthand-property-no-redundant-values': null,
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen']
    }]
  }
}
