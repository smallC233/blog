#!/usr/bin/env node

const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');

const RESOURCE_ATTR_REGEX = /\b(?:src|href)\s*=\s*(['"])([^'"]+)\1/gi;
const IGNORED_SCHEMES = /^(?:https?:)?\/\//i;
const SPECIAL_SCHEMES = /^(?:data|mailto|tel|javascript):/i;
const WINDOWS_ABS_PATH = /^[A-Za-z]:[\\/]/;
const TEXT_LIKE_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.html',
  '.htm',
  '.njk',
  '.ejs',
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
  '.yml',
  '.yaml',
  '.styl',
  '.css'
]);

function parseArgs(argv) {
  const args = {
    write: false,
    flatten: true,
    keepSource: false,
    suffix: '',
    linkMode: 'relative'
  };

  for (const arg of argv) {
    if (arg === '--write') {
      args.write = true;
    } else if (arg === '--no-flatten') {
      args.flatten = false;
    } else if (arg === '--keep-source') {
      args.keepSource = true;
    } else if (arg.startsWith('--suffix=')) {
      const suffix = arg.slice('--suffix='.length).trim();
      args.suffix = suffix ? (suffix.startsWith('.') ? suffix : `.${suffix}`) : '';
    } else if (arg.startsWith('--link-mode=')) {
      const linkMode = arg.slice('--link-mode='.length).trim();
      if (linkMode !== 'relative' && linkMode !== 'site') {
        throw new Error('`--link-mode` must be `relative` or `site`.');
      }
      args.linkMode = linkMode;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function stripWrappingAngleBrackets(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return {
      value: trimmed.slice(1, -1),
      wrapped: true
    };
  }

  return {
    value: trimmed,
    wrapped: false
  };
}

function splitUrlTail(url) {
  const match = /^([^?#]*)([?#].*)?$/.exec(url);
  return {
    pathname: match ? match[1] : url,
    suffix: match && match[2] ? match[2] : ''
  };
}

function toPosixPath(value) {
  return value.replace(/\\/g, '/');
}

function isSubPath(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isLocalCandidate(urlPath) {
  if (!urlPath || urlPath.startsWith('#')) {
    return false;
  }

  if (WINDOWS_ABS_PATH.test(urlPath)) {
    return true;
  }

  if (IGNORED_SCHEMES.test(urlPath) || SPECIAL_SCHEMES.test(urlPath)) {
    return false;
  }

  return true;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function areFilesSame(fileA, fileB) {
  if (path.resolve(fileA) === path.resolve(fileB)) {
    return true;
  }

  const [statA, statB] = await Promise.all([fs.stat(fileA), fs.stat(fileB)]);
  if (statA.size !== statB.size) {
    return false;
  }

  const [contentA, contentB] = await Promise.all([fs.readFile(fileA), fs.readFile(fileB)]);
  return contentA.equals(contentB);
}

async function walkMarkdownFiles(rootDir) {
  const results = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  results.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  return results;
}

function loadSiteRoot(repoRoot) {
  const configPath = path.join(repoRoot, '_config.yml');
  if (!fssync.existsSync(configPath)) {
    return '/';
  }

  const content = fssync.readFileSync(configPath, 'utf8');
  const match = content.match(/^\s*root:\s*(.+?)\s*$/m);
  if (!match) {
    return '/';
  }

  let value = match[1].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    value = value.slice(1, -1).trim();
  }

  if (!value || value === 'null') {
    return '/';
  }

  if (!value.startsWith('/')) {
    value = `/${value}`;
  }
  if (!value.endsWith('/')) {
    value = `${value}/`;
  }

  return value.replace(/\/{2,}/g, '/');
}

function joinUrlPath(siteRoot, relativePath) {
  const normalizedRoot = siteRoot === '/' ? '' : siteRoot.replace(/\/+$/, '');
  const normalizedRelative = toPosixPath(relativePath).replace(/^\/+/, '');
  return `${normalizedRoot}/${normalizedRelative}`.replace(/\/{2,}/g, '/');
}

function sanitizeRelativePath(relativePath) {
  return toPosixPath(relativePath)
    .replace(/^[./\\]+/, '')
    .split('/')
    .filter(Boolean)
    .join('/');
}

function findMarkdownLinks(content) {
  const links = [];

  for (let index = 0; index < content.length - 1; index += 1) {
    if (content[index] !== ']' || content[index + 1] !== '(') {
      continue;
    }

    const openBracketIndex = content.lastIndexOf('[', index);
    if (openBracketIndex === -1) {
      continue;
    }

    let cursor = index + 2;
    let depth = 1;

    while (cursor < content.length) {
      const char = content[cursor];
      if (char === '\\') {
        cursor += 2;
        continue;
      }

      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      }

      cursor += 1;
    }

    if (depth !== 0) {
      continue;
    }

    links.push({
      rawUrl: content.slice(index + 2, cursor),
      urlStart: index + 2,
      urlEnd: cursor
    });

    index = cursor;
  }

  return links;
}

function extractReferences(content) {
  const references = findMarkdownLinks(content).map(item => ({
    type: 'markdown',
    rawUrl: item.rawUrl
  }));
  let match;

  while ((match = RESOURCE_ATTR_REGEX.exec(content)) !== null) {
    references.push({
      type: 'html',
      rawUrl: match[2]
    });
  }

  return references;
}

function dedupePreserveOrder(values) {
  const seen = new Set();
  const results = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    results.push(value);
  }

  return results;
}

function getPostCategoryInfo(postsDir, markdownPath) {
  const relativeDir = path.relative(postsDir, path.dirname(markdownPath));
  const parts = relativeDir.split(path.sep).filter(Boolean);
  return {
    relativeDir,
    firstCategory: parts[0] || ''
  };
}

function getPostAssetDir(markdownPath, suffix) {
  const ext = path.extname(markdownPath);
  const basename = path.basename(markdownPath, ext);
  return path.join(path.dirname(markdownPath), `${basename}${suffix}`);
}

function buildSourceCandidates(pathnameValue, markdownPath, context) {
  const candidates = [];
  const decodedPathname = safelyDecodeURIComponent(pathnameValue);
  const normalizedPathname = decodedPathname.replace(/\//g, path.sep);
  const { assetsDir, sourceDir, postCategory } = context;

  if (WINDOWS_ABS_PATH.test(decodedPathname) || path.isAbsolute(decodedPathname)) {
    candidates.push(path.normalize(decodedPathname));
  } else {
    candidates.push(path.resolve(path.dirname(markdownPath), normalizedPathname));
  }

  const trimmedLeadingSlash = decodedPathname.replace(/^\/+/, '');
  if (trimmedLeadingSlash) {
    candidates.push(path.join(sourceDir, trimmedLeadingSlash.replace(/\//g, path.sep)));
  }

  const parts = decodedPathname.split(/[\\/]+/).filter(Boolean);
  const assetsIndex = parts.lastIndexOf('assets');
  if (assetsIndex >= 0 && assetsIndex < parts.length - 1) {
    candidates.push(path.join(assetsDir, ...parts.slice(assetsIndex + 1)));
  }

  if (postCategory) {
    const categoryIndex = parts.lastIndexOf(postCategory);
    if (categoryIndex >= 0) {
      candidates.push(path.join(assetsDir, postCategory, ...parts.slice(categoryIndex + 1)));
    }
  }

  return dedupePreserveOrder(candidates.map(item => path.normalize(item)));
}

function safelyDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function resolveSourceFile(rawUrl, markdownPath, context) {
  const wrappedInfo = stripWrappingAngleBrackets(rawUrl);
  const split = splitUrlTail(wrappedInfo.value);
  const urlPath = split.pathname.trim();

  if (!isLocalCandidate(urlPath)) {
    return null;
  }

  if (TEXT_LIKE_EXTENSIONS.has(path.extname(urlPath).toLowerCase())) {
    return null;
  }

  const candidates = buildSourceCandidates(urlPath, markdownPath, context);
  for (const candidate of candidates) {
    if (!(await fileExists(candidate))) {
      continue;
    }

    const extension = path.extname(candidate).toLowerCase();
    if (TEXT_LIKE_EXTENSIONS.has(extension) && !isSubPath(context.assetsDir, candidate)) {
      continue;
    }

    return {
      sourcePath: candidate,
      urlSuffix: split.suffix,
      wrapped: wrappedInfo.wrapped,
      originalPathname: urlPath
    };
  }

  return {
    unresolved: true,
    originalPathname: urlPath
  };
}

function buildFallbackRelative(sourcePath, context) {
  const { assetsDir, postCategory } = context;
  if (postCategory) {
    const categoryRoot = path.join(assetsDir, postCategory);
    if (isSubPath(categoryRoot, sourcePath)) {
      return sanitizeRelativePath(path.relative(categoryRoot, sourcePath));
    }
  }

  if (isSubPath(assetsDir, sourcePath)) {
    return sanitizeRelativePath(path.relative(assetsDir, sourcePath));
  }

  return path.basename(sourcePath);
}

async function allocateTargetRelativePath(postState, sourcePath, context) {
  const preferredBaseName = path.basename(sourcePath);
  const fallbackRelative = buildFallbackRelative(sourcePath, context);
  const candidates = [];

  if (context.flatten) {
    candidates.push(preferredBaseName);
    if (fallbackRelative !== preferredBaseName) {
      candidates.push(fallbackRelative);
    }
  } else {
    candidates.push(fallbackRelative);
    if (preferredBaseName !== fallbackRelative) {
      candidates.push(preferredBaseName);
    }
  }

  const uniqueCandidates = dedupePreserveOrder(
    candidates
      .map(item => sanitizeRelativePath(item))
      .filter(Boolean)
  );

  for (const candidate of uniqueCandidates) {
    const reservedSource = postState.targetReservations.get(candidate);
    if (reservedSource) {
      if (path.resolve(reservedSource) === path.resolve(sourcePath)) {
        return candidate;
      }
      continue;
    }

    const candidateTarget = path.join(postState.assetDir, candidate);
    if (await fileExists(candidateTarget) && !(await areFilesSame(candidateTarget, sourcePath))) {
      continue;
    }

    postState.targetReservations.set(candidate, sourcePath);
    return candidate;
  }

  const extension = path.extname(sourcePath);
  const stem = path.basename(sourcePath, extension);
  let index = 2;

  while (true) {
    const candidate = `${stem}-${index}${extension}`;
    const reservedSource = postState.targetReservations.get(candidate);
    if (reservedSource && path.resolve(reservedSource) !== path.resolve(sourcePath)) {
      index += 1;
      continue;
    }

    const candidateTarget = path.join(postState.assetDir, candidate);
    if (await fileExists(candidateTarget) && !(await areFilesSame(candidateTarget, sourcePath))) {
      index += 1;
      continue;
    }

    postState.targetReservations.set(candidate, sourcePath);
    return candidate;
  }
}

async function planMarkdownMigration(markdownPath, context, summary) {
  const content = await fs.readFile(markdownPath, 'utf8');
  const references = extractReferences(content);
  const categoryInfo = getPostCategoryInfo(context.postsDir, markdownPath);
  const assetDir = getPostAssetDir(markdownPath, context.suffix);
  const assetDirRelativeToSource = path.relative(context.sourceDir, assetDir);
  const perPostContext = {
    ...context,
    postCategory: categoryInfo.firstCategory
  };
  const postState = {
    assetDir,
    targetReservations: new Map(),
    sourceToTarget: new Map()
  };

  const rawUrls = dedupePreserveOrder(references.map(item => item.rawUrl));
  const rewriteMap = new Map();
  const plannedCopies = [];

  for (const rawUrl of rawUrls) {
    const resolved = await resolveSourceFile(rawUrl, markdownPath, perPostContext);
    if (resolved == null) {
      continue;
    }

    if (resolved.unresolved) {
      summary.unresolved.push({
        markdownPath,
        rawUrl
      });
      continue;
    }

    const sourcePath = resolved.sourcePath;
    let targetRelative = postState.sourceToTarget.get(sourcePath);
    if (!targetRelative) {
      targetRelative = await allocateTargetRelativePath(postState, sourcePath, perPostContext);
      postState.sourceToTarget.set(sourcePath, targetRelative);
    }

    const targetPath = path.join(assetDir, targetRelative);
    const targetUrlRelative = path.join(assetDirRelativeToSource, targetRelative);
    const rewrittenUrl = (
      context.linkMode === 'site'
        ? joinUrlPath(context.siteRoot, targetUrlRelative)
        : toPosixPath(path.join(path.basename(assetDir), targetRelative))
    ) + resolved.urlSuffix;
    const finalUrl = resolved.wrapped ? `<${rewrittenUrl}>` : rewrittenUrl;

    rewriteMap.set(rawUrl, finalUrl);
    plannedCopies.push({
      sourcePath,
      targetPath
    });
  }

  let nextContent = content;
  const markdownLinks = findMarkdownLinks(nextContent);
  if (markdownLinks.length > 0) {
    let cursor = 0;
    let rebuilt = '';

    for (const link of markdownLinks) {
      rebuilt += nextContent.slice(cursor, link.urlStart);
      rebuilt += rewriteMap.get(link.rawUrl) || link.rawUrl;
      cursor = link.urlEnd;
    }

    rebuilt += nextContent.slice(cursor);
    nextContent = rebuilt;
  }

  nextContent = nextContent.replace(RESOURCE_ATTR_REGEX, (match, quote, rawUrl) => {
    const nextUrl = rewriteMap.get(rawUrl);
    return nextUrl ? match.replace(rawUrl, nextUrl) : match;
  });

  const uniqueCopies = [];
  const seenPair = new Set();
  for (const item of plannedCopies) {
    const key = `${path.resolve(item.sourcePath)}=>${path.resolve(item.targetPath)}`;
    if (seenPair.has(key)) {
      continue;
    }
    seenPair.add(key);
    uniqueCopies.push(item);
  }

  if (nextContent !== content) {
    summary.changedPosts += 1;
  }

  summary.totalRewrites += rewriteMap.size;
  summary.totalCopies += uniqueCopies.length;

  return {
    markdownPath,
    originalContent: content,
    nextContent,
    changed: nextContent !== content,
    copies: uniqueCopies
  };
}

async function ensureParentDirectory(targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
}

async function copyPlannedAssets(plans) {
  const completed = [];

  for (const plan of plans) {
    for (const item of plan.copies) {
      if (path.resolve(item.sourcePath) === path.resolve(item.targetPath)) {
        continue;
      }

      await ensureParentDirectory(item.targetPath);

      if (await fileExists(item.targetPath)) {
        if (!(await areFilesSame(item.sourcePath, item.targetPath))) {
          throw new Error(`Target already exists with different content: ${item.targetPath}`);
        }
        continue;
      }

      await fs.copyFile(item.sourcePath, item.targetPath);
      completed.push(item);
    }
  }

  return completed;
}

async function writeUpdatedMarkdown(plans) {
  for (const plan of plans) {
    if (!plan.changed) {
      continue;
    }

    await fs.writeFile(plan.markdownPath, plan.nextContent, 'utf8');
  }
}

async function deleteMigratedSources(plans, assetsDir) {
  const deletions = new Map();

  for (const plan of plans) {
    for (const item of plan.copies) {
      if (!isSubPath(assetsDir, item.sourcePath)) {
        continue;
      }

      deletions.set(path.resolve(item.sourcePath), item.sourcePath);
    }
  }

  const deletedPaths = [];
  for (const sourcePath of deletions.values()) {
    if (!(await fileExists(sourcePath))) {
      continue;
    }

    await fs.unlink(sourcePath);
    deletedPaths.push(sourcePath);
  }

  return deletedPaths;
}

async function pruneEmptyDirectories(rootDir, removedFiles) {
  const directories = new Set();

  for (const filePath of removedFiles) {
    let current = path.dirname(filePath);
    while (isSubPath(rootDir, current) && path.resolve(current) !== path.resolve(rootDir)) {
      directories.add(path.resolve(current));
      current = path.dirname(current);
    }
  }

  const orderedDirectories = Array.from(directories).sort((a, b) => b.length - a.length);
  for (const directory of orderedDirectories) {
    try {
      const entries = await fs.readdir(directory);
      if (entries.length === 0) {
        await fs.rmdir(directory);
      }
    } catch {
      // Ignore directories that no longer exist or cannot be removed.
    }
  }
}

function printSummary(summary, options) {
  const mode = options.write ? 'write' : 'dry-run';
  console.log(`[${mode}] changed posts: ${summary.changedPosts}`);
  console.log(`[${mode}] rewritten urls: ${summary.totalRewrites}`);
  console.log(`[${mode}] planned asset copies: ${summary.totalCopies}`);

  if (summary.unresolved.length > 0) {
    console.log(`[${mode}] unresolved local references: ${summary.unresolved.length}`);
    for (const item of summary.unresolved.slice(0, 20)) {
      const relativePost = toPosixPath(path.relative(summary.repoRoot, item.markdownPath));
      console.log(`  - ${relativePost}: ${item.rawUrl}`);
    }
    if (summary.unresolved.length > 20) {
      console.log(`  ... and ${summary.unresolved.length - 20} more`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const sourceDir = path.join(repoRoot, 'source');
  const postsDir = path.join(sourceDir, '_posts');
  const assetsDir = path.join(sourceDir, 'assets');

  if (!(await pathExists(postsDir))) {
    throw new Error(`Posts directory does not exist: ${postsDir}`);
  }

  const markdownFiles = await walkMarkdownFiles(postsDir);
  const siteRoot = loadSiteRoot(repoRoot);
  const summary = {
    repoRoot,
    changedPosts: 0,
    totalRewrites: 0,
    totalCopies: 0,
    unresolved: []
  };

  const context = {
    repoRoot,
    sourceDir,
    postsDir,
    assetsDir,
    siteRoot,
    suffix: options.suffix,
    flatten: options.flatten,
    linkMode: options.linkMode
  };

  const plans = [];
  for (const markdownPath of markdownFiles) {
    const plan = await planMarkdownMigration(markdownPath, context, summary);
    plans.push(plan);
  }

  if (options.write) {
    await copyPlannedAssets(plans);
    await writeUpdatedMarkdown(plans);

    if (!options.keepSource) {
      const deletedFiles = await deleteMigratedSources(plans, assetsDir);
      await pruneEmptyDirectories(assetsDir, deletedFiles);
    }
  }

  printSummary(summary, options);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
