const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the workspace root so Metro picks up changes in packages/types
config.watchFolders = [workspaceRoot];

// Let Metro find hoisted workspace deps at the root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Prevent Metro from following symlinks out of the workspace
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
