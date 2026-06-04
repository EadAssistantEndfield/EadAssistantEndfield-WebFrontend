import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const rootDir = process.cwd()
const blueprintI18nDir = path.join(rootDir, 'src', 'features', 'blueprint', 'i18n')
const messagesPath = path.join(blueprintI18nDir, 'messages.ts')
const buildingMessagesPath = path.join(blueprintI18nDir, 'buildingMessages.ts')

/**
 * @param {string} filePath
 */
function readSourceFile(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8')
  return ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

/**
 * @param {ts.Expression} node
 * @returns {ts.Expression}
 */
function unwrapExpression(node) {
  let current = node
  while (ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) || ts.isParenthesizedExpression(current)) {
    current = current.expression
  }
  return current
}

/**
 * @param {ts.Expression} node
 * @returns {unknown}
 */
function evaluateExpression(node) {
  const current = unwrapExpression(node)

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text
  }

  if (ts.isArrayLiteralExpression(current)) {
    return current.elements.map((element) => evaluateExpression(element))
  }

  if (ts.isObjectLiteralExpression(current)) {
    /** @type {Record<string, unknown>} */
    const result = {}

    for (const property of current.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error(`Unsupported object property kind: ${property.kind}`)
      }

      const nameNode = property.name
      let key
      if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
        key = nameNode.text
      } else {
        throw new Error(`Unsupported property name kind: ${nameNode.kind}`)
      }

      result[key] = evaluateExpression(property.initializer)
    }

    return result
  }

  throw new Error(`Unsupported expression kind: ${current.kind}`)
}

/**
 * @param {ts.SourceFile} sourceFile
 * @param {string} exportName
 * @returns {unknown}
 */
function readExportValue(sourceFile, exportName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }

    const hasExportModifier = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    if (!hasExportModifier) {
      continue
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) {
        continue
      }

      return evaluateExpression(declaration.initializer)
    }
  }

  throw new Error(`Export "${exportName}" not found in ${sourceFile.fileName}`)
}

/**
 * @param {Record<string, Record<string, string>>} localeMap
 * @param {string[]} locales
 * @param {string} section
 */
function collectIssues(localeMap, locales, section) {
  const allKeys = new Set()

  for (const locale of locales) {
    for (const key of Object.keys(localeMap[locale] ?? {})) {
      allKeys.add(key)
    }
  }

  /** @type {string[]} */
  const issues = []

  for (const locale of locales) {
    const entries = localeMap[locale] ?? {}
    const missingKeys = [...allKeys].filter((key) => !(key in entries)).sort()
    const emptyKeys = Object.entries(entries)
      .filter(([, value]) => typeof value !== 'string' || value.trim().length === 0)
      .map(([key]) => key)
      .sort()

    if (missingKeys.length > 0) {
      issues.push(`[${section}] ${locale} missing ${missingKeys.length} key(s): ${missingKeys.join(', ')}`)
    }

    if (emptyKeys.length > 0) {
      issues.push(`[${section}] ${locale} has ${emptyKeys.length} empty key(s): ${emptyKeys.join(', ')}`)
    }
  }

  return issues
}

const messagesSource = readSourceFile(messagesPath)
const buildingSource = readSourceFile(buildingMessagesPath)

const locales = /** @type {string[]} */ (readExportValue(messagesSource, 'supportedLocales'))
const uiMessages = /** @type {Record<string, Record<string, string>>} */ (readExportValue(messagesSource, 'uiMessages'))
const itemMessages = /** @type {Record<string, Record<string, string>>} */ (readExportValue(messagesSource, 'itemMessages'))
const payloadTypeMessages = /** @type {Record<string, Record<string, string>>} */ (
  readExportValue(messagesSource, 'payloadTypeMessages')
)
const buildingMessages = /** @type {Record<string, Record<string, string>>} */ (readExportValue(buildingSource, 'buildingMessages'))

const checks = [
  { section: 'uiMessages', localeMap: uiMessages },
  { section: 'itemMessages', localeMap: itemMessages },
  { section: 'payloadTypeMessages', localeMap: payloadTypeMessages },
  { section: 'buildingMessages', localeMap: buildingMessages },
]

const issues = checks.flatMap(({ section, localeMap }) => collectIssues(localeMap, locales, section))

if (issues.length > 0) {
  console.error('i18n check failed.\n')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log(`i18n check passed for ${checks.length} section(s) across ${locales.length} locale(s).`)
