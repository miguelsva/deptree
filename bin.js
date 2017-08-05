#!/usr/bin/env node

// TODO: Use async
const { execSync } = require('child_process');

// TODO: Move this to deptree.js
function getPackages() {
  try {
    const allPackages = execSync('npm ls --json --production=false --depth=1').toString();
    // TODO: Use --production
    // TODO: Filter packages
    return JSON.parse(allPackages).dependencies;
  } catch (error) {
    console.error('Error getting packages', error);
  }
  return null;
}

function getDependencies(packages) {
  return Object.keys(packages).map((name) => {
    const pkg = { name };
    if (packages[name].dependencies) {
      pkg.dependencies = getDependencies(packages[name].dependencies);
    }
    return pkg;
  });
}

function flattenDependencies(dependencies) {
  return dependencies.reduce((a, b) => a.concat(
    (b.dependencies ? [b].concat(flattenDependencies(b.dependencies)) : b))
  , []);
}

function getDependenciesLinks(allDependencies) {
  return allDependencies.map((pkg) => {
    if (pkg.dependencies) {
      return pkg.dependencies.map(dependency => ({
        source: pkg.name,
        target: dependency.name,
      }));
    }
    return null;
  }).reduce((a, b) => a.concat(b || []));
}

function createGraphData(dependencies) {
  const nodes = flattenDependencies(dependencies).map(d => ({ id: d.name }));
  const links = getDependenciesLinks(dependencies);
  return {
    nodes,
    links,
  };
}

function init() {
  const packages = getPackages();
  if (!packages) {
    console.error('No packages found. Did you run npm i?');
  }
  const dependencies = getDependencies(packages);
  console.log(JSON.stringify(createGraphData(dependencies).links));
}

init();
