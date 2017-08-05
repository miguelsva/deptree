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

function getDependenciesLinks(pkg) {
  if (pkg.dependencies) {
    let links = [];
    for (const dependency of pkg.dependencies) { // eslint-disable-line
      links.push({
        source: pkg.name,
        target: dependency.name,
      });
      if (dependency.dependencies) {
        const dependencyDeps = getDependenciesLinks(dependency);
        if (dependencyDeps) {
          links = [...links, ...dependencyDeps];
        }
      }
    }
    return links;
  }
  return null;
}

function getAllDependenciesLinks(allDependencies) {
  return allDependencies.map(pkg => getDependenciesLinks(pkg))
    .reduce((a, b) => a.concat(b || []));
}

function createGraphData(dependencies) {
  const nodes = flattenDependencies(dependencies).map(d => ({ id: d.name }));
  // TODO: Filter out duplicates
  const links = getAllDependenciesLinks(dependencies);
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
  console.log(JSON.stringify(createGraphData(dependencies)));
}

init();
