import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { en as webEn } from '../../apps/web/src/lib/i18n/en';
import { nl as webNl } from '../../apps/web/src/lib/i18n/nl';
import { en as landingEn } from '../../apps/landing/src/lib/i18n/en';
import { nl as landingNl } from '../../apps/landing/src/lib/i18n/nl';
import { localizeOpenApiSpec } from '../../apps/landing/src/lib/openapi-i18n';

const rootDirectory = process.cwd();
const ignoredArrayLengthDifferences = new Set([
  'web.spotlight.keywords.theme',
  'landing.spotlight.keywords.theme',
]);

function localeShapeDifferences(
  dutch: unknown,
  english: unknown,
  currentPath: string
): string[] {
  if (Array.isArray(dutch) && Array.isArray(english)) {
    const differences: string[] = [];
    if (
      dutch.length !== english.length &&
      !ignoredArrayLengthDifferences.has(currentPath)
    ) {
      differences.push(
        `${currentPath}: array length differs (${dutch.length} vs ${english.length})`
      );
    }
    for (
      let index = 0;
      index < Math.min(dutch.length, english.length);
      index++
    ) {
      differences.push(
        ...localeShapeDifferences(
          dutch[index],
          english[index],
          `${currentPath}[${index}]`
        )
      );
    }
    return differences;
  }

  if (
    dutch !== null &&
    english !== null &&
    typeof dutch === 'object' &&
    typeof english === 'object'
  ) {
    const dutchKeys = Object.keys(dutch);
    const englishKeys = Object.keys(english);
    const allKeys = new Set([...dutchKeys, ...englishKeys]);
    const differences: string[] = [];

    for (const key of allKeys) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      if (!(key in dutch)) {
        differences.push(`${childPath}: missing in Dutch`);
      } else if (!(key in english)) {
        differences.push(`${childPath}: missing in English`);
      } else {
        differences.push(
          ...localeShapeDifferences(
            (dutch as Record<string, unknown>)[key],
            (english as Record<string, unknown>)[key],
            childPath
          )
        );
      }
    }

    return differences;
  }

  if (typeof dutch !== typeof english) {
    return [
      `${currentPath}: type differs (${typeof dutch} vs ${typeof english})`,
    ];
  }

  return [];
}

function getFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return getFiles(filePath);
    return /\.tsx?$/.test(filePath) ? [filePath] : [];
  });
}

function collectOpenApiText(value: unknown, inTagList = false): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (inTagList && typeof item === 'string') return [item];
      return collectOpenApiText(item, inTagList);
    });
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, item]) => {
    const text =
      (key === 'summary' ||
        key === 'description' ||
        (inTagList && key === 'name')) &&
      typeof item === 'string'
        ? [item]
        : [];
    return [...text, ...collectOpenApiText(item, key === 'tags')];
  });
}

function getExpressionPath(node: ts.Expression): string {
  if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) {
    return getExpressionPath(node.expression);
  }
  if (ts.isPropertyAccessExpression(node)) {
    const objectPath = getExpressionPath(node.expression);
    return objectPath ? `${objectPath}.${node.name.text}` : '';
  }
  if (ts.isElementAccessExpression(node)) {
    const objectPath = getExpressionPath(node.expression);
    const index = node.argumentExpression;
    if (index && (ts.isStringLiteral(index) || ts.isNumericLiteral(index))) {
      return `${objectPath}.${index.text}`;
    }
    return objectPath ? `${objectPath}[]` : '';
  }
  return ts.isIdentifier(node) ? node.text : '';
}

function normalizeExpressionPath(
  expression: ts.Expression,
  aliases: Map<string, string>
): string {
  const expressionPath = getExpressionPath(expression);
  const rootName = expressionPath.split('.')[0];
  const aliasPath = aliases.get(rootName);
  return aliasPath
    ? expressionPath.replace(rootName, aliasPath)
    : expressionPath;
}

function hasLocaleValue(locale: unknown, expressionPath: string): boolean {
  const segments = (expressionPath.match(/[^.[\]]+|\[\]/g) || []).slice(1);
  let value: any = locale;

  for (const segment of segments) {
    if (segment === '[]') {
      if (Array.isArray(value)) value = value[0];
      else if (value && typeof value === 'object') continue;
      else return false;
      continue;
    }
    value = value?.[segment];
    if (value === undefined || value === null) return false;
  }

  return true;
}

function missingLandingTranslationReferences(): string[] {
  const localeDirectories = [
    'apps/landing/src/components',
    'apps/landing/src/pages',
  ];
  const files = localeDirectories.flatMap((directory) =>
    getFiles(path.join(rootDirectory, directory))
  );
  const missing: string[] = [];

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const aliases = new Map<string, string>();

    function collectAliases(node: ts.Node) {
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isIdentifier(node.name)
      ) {
        const initializerPath = normalizeExpressionPath(
          node.initializer,
          aliases
        );
        if (initializerPath.startsWith('t.')) {
          aliases.set(node.name.text, initializerPath);
        }
      }
      ts.forEachChild(node, collectAliases);
    }
    collectAliases(sourceFile);

    function visit(node: ts.Node) {
      if (
        ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)
      ) {
        const parent = node.parent;
        const isNestedAccess =
          (ts.isPropertyAccessExpression(parent) ||
            ts.isElementAccessExpression(parent)) &&
          parent.expression === node;

        if (!isNestedAccess) {
          const expressionPath = normalizeExpressionPath(node, aliases);
          const isGenericHelpAnimationProp =
            filePath.endsWith('/components/help/HelpAnimation.tsx') &&
            expressionPath.startsWith('t.helpCenter.animations.') &&
            !new Set([
              'profile',
              'import',
              'dashboard',
              'transactions',
              'categories',
              'budget',
              'subscriptions',
              'accounts',
              'trends',
              'addressBook',
              'export',
            ]).has(expressionPath.split('.')[3]);

          if (expressionPath.startsWith('t.') && !isGenericHelpAnimationProp) {
            for (const [language, locale] of [
              ['nl', landingNl],
              ['en', landingEn],
            ] as const) {
              if (!hasLocaleValue(locale, expressionPath)) {
                const line =
                  sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile)
                  ).line + 1;
                missing.push(
                  `${path.relative(rootDirectory, filePath)}:${line} ${language}: ${expressionPath}`
                );
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  return missing;
}

function missingWebTranslationReferences(): string[] {
  const sourceDirectory = path.join(rootDirectory, 'apps/web/src');
  const files = getFiles(sourceDirectory).filter(
    (filePath) => !filePath.includes('/lib/i18n/')
  );
  const program = ts.createProgram(files, {
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
  });
  const checker = program.getTypeChecker();
  const languageMethods = new Set([
    'at',
    'concat',
    'endsWith',
    'every',
    'filter',
    'find',
    'findIndex',
    'flat',
    'flatMap',
    'forEach',
    'includes',
    'indexOf',
    'join',
    'lastIndexOf',
    'length',
    'map',
    'match',
    'replace',
    'replaceAll',
    'reduce',
    'slice',
    'some',
    'split',
    'startsWith',
    'substring',
    'toLowerCase',
    'toUpperCase',
    'trim',
  ]);
  const missing: string[] = [];

  function isLanguageHookCall(expression: ts.Expression): boolean {
    if (ts.isParenthesizedExpression(expression)) {
      return isLanguageHookCall(expression.expression);
    }
    return (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      ['useLanguage', 'useTranslations'].includes(expression.expression.text)
    );
  }

  function isTranslationRoot(symbol: ts.Symbol): boolean {
    return (symbol.declarations || []).some((declaration) => {
      if (ts.isBindingElement(declaration)) {
        const variable = declaration.parent.parent;
        const keyName = declaration.propertyName || declaration.name;
        return (
          ts.isVariableDeclaration(variable) &&
          ts.isObjectBindingPattern(declaration.parent) &&
          ts.isIdentifier(keyName) &&
          keyName.text === 't' &&
          variable.initializer !== undefined &&
          isLanguageHookCall(variable.initializer)
        );
      }
      if (
        ts.isVariableDeclaration(declaration) &&
        ts.isIdentifier(declaration.name) &&
        declaration.initializer
      ) {
        const initializer = declaration.initializer;
        return (
          (ts.isPropertyAccessExpression(initializer) &&
            initializer.name.text === 't' &&
            isLanguageHookCall(initializer.expression)) ||
          isLanguageHookCall(initializer)
        );
      }
      return false;
    });
  }

  function getTranslationPath(
    expression: ts.Expression,
    seen = new Set<ts.Symbol>()
  ): string | null {
    if (
      ts.isNonNullExpression(expression) ||
      ts.isParenthesizedExpression(expression)
    ) {
      return getTranslationPath(expression.expression, seen);
    }
    if (ts.isPropertyAccessExpression(expression)) {
      const objectPath = getTranslationPath(expression.expression, seen);
      return objectPath ? `${objectPath}.${expression.name.text}` : null;
    }
    if (ts.isElementAccessExpression(expression)) {
      const objectPath = getTranslationPath(expression.expression, seen);
      const index = expression.argumentExpression;
      if (!objectPath) return null;
      if (index && (ts.isStringLiteral(index) || ts.isNumericLiteral(index))) {
        return `${objectPath}.${index.text}`;
      }
      return `${objectPath}[]`;
    }
    if (!ts.isIdentifier(expression)) return null;

    const symbol = checker.getSymbolAtLocation(expression);
    if (!symbol || seen.has(symbol)) return null;
    if (isTranslationRoot(symbol)) return 't';

    seen.add(symbol);
    const declaration = symbol.valueDeclaration;
    if (
      declaration &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer
    ) {
      return getTranslationPath(declaration.initializer, seen);
    }
    return null;
  }

  for (const filePath of files) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) continue;
    function visit(node: ts.Node) {
      if (
        ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)
      ) {
        const parent = node.parent;
        const isNestedAccess =
          (ts.isPropertyAccessExpression(parent) ||
            ts.isElementAccessExpression(parent)) &&
          parent.expression === node;

        if (!isNestedAccess) {
          const isLanguageMethod =
            ts.isPropertyAccessExpression(node) &&
            languageMethods.has(node.name.text);
          const expressionPath = getTranslationPath(
            isLanguageMethod ? node.expression : node
          );
          if (expressionPath?.startsWith('t.')) {
            for (const [language, locale] of [
              ['nl', webNl],
              ['en', webEn],
            ] as const) {
              if (!hasLocaleValue(locale, expressionPath)) {
                const line =
                  sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile)
                  ).line + 1;
                missing.push(
                  `${path.relative(rootDirectory, filePath)}:${line} ${language}: ${expressionPath}`
                );
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  return missing;
}

function hardcodedTranslationFallbacks(): string[] {
  const directories = ['apps/web/src', 'apps/landing/src'];
  const files = directories.flatMap((directory) =>
    getFiles(path.join(rootDirectory, directory)).filter(
      (filePath) => !filePath.includes('/lib/i18n/')
    )
  );
  const fallbacks: string[] = [];

  for (const filePath of files) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const aliases = new Map<string, string>();

    function collectAliases(node: ts.Node) {
      if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isIdentifier(node.name)
      ) {
        const initializerPath = normalizeExpressionPath(
          node.initializer,
          aliases
        );
        if (initializerPath.startsWith('t.')) {
          aliases.set(node.name.text, initializerPath);
        }
      }
      ts.forEachChild(node, collectAliases);
    }
    collectAliases(sourceFile);

    function getFallbackCopy(expression: ts.Expression): string | null {
      if (ts.isArrayLiteralExpression(expression)) {
        return expression.elements
          .map((element) => getFallbackCopy(element))
          .filter((value): value is string => value !== null)
          .join(' ');
      }
      if (
        ts.isStringLiteral(expression) ||
        ts.isNoSubstitutionTemplateLiteral(expression)
      ) {
        return expression.text;
      }
      if (ts.isTemplateExpression(expression)) {
        return [
          expression.head.text,
          ...expression.templateSpans.map((span) => span.literal.text),
        ].join('');
      }
      return null;
    }

    function visit(node: ts.Node) {
      if (
        ts.isBinaryExpression(node) &&
        (node.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
      ) {
        const translationPath = normalizeExpressionPath(node.left, aliases);
        const fallbackCopy = getFallbackCopy(node.right);
        if (
          translationPath.startsWith('t.') &&
          fallbackCopy &&
          /[A-Za-zÀ-ÿ]/.test(fallbackCopy)
        ) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1;
          fallbacks.push(
            `${path.relative(rootDirectory, filePath)}:${line} ${translationPath}`
          );
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  return fallbacks;
}

describe('locale coverage', () => {
  it('keeps Dutch and English translation dictionaries in sync', () => {
    expect(localeShapeDifferences(webNl, webEn, 'web')).toEqual([]);
    expect(localeShapeDifferences(landingNl, landingEn, 'landing')).toEqual([]);
  });

  it('translates developer-docs sidebar section headings into Dutch', () => {
    expect(landingNl.docs.nav.coreResources).not.toBe(
      landingEn.docs.nav.coreResources
    );
    expect(landingNl.docs.nav.tools).not.toBe(landingEn.docs.nav.tools);
  });

  it('provides both languages for landing, Help Center, and developer docs strings', () => {
    expect(missingLandingTranslationReferences()).toEqual([]);
  });

  it('provides both languages for every app translation reference', () => {
    expect(missingWebTranslationReferences()).toEqual([]);
  });

  it('does not use hardcoded copy as a translation fallback', () => {
    expect(hardcodedTranslationFallbacks()).toEqual([]);
  });

  it('localizes OpenAPI summaries, descriptions, and tags into both languages', () => {
    const spec = JSON.parse(
      fs.readFileSync(
        path.join(rootDirectory, 'apps/landing/public/openapi.json'),
        'utf8'
      )
    ) as object;
    const english = collectOpenApiText(localizeOpenApiSpec(spec, 'en'));
    const dutch = collectOpenApiText(localizeOpenApiSpec(spec, 'nl'));

    expect(english).toHaveLength(dutch.length);
    expect(
      english.filter((englishText, index) => englishText === dutch[index])
    ).toEqual([]);
  });
});
