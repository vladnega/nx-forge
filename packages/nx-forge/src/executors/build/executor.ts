import { PathLike, statSync } from 'node:fs';
import type { ExecutorContext } from '@nx/devkit';
import { logger } from '@nx/devkit';
import { BuildExecutorOptions } from './schema';
import { normalizeOptions } from './lib/normalize-options';
import { processResourceDependencies } from './lib/process-resource-dependencies';
import { patchManifestYml } from './lib/patch-manifest-yml';
import { generatePackageJson } from './lib/generate-package-json';
import { compileWebpack } from './lib/compile-webpack';
import { copyForgeAppAssets } from './lib/copy-forge-app-assets';

function fileExists(path: PathLike) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export default async function runExecutor(
  rawOptions: BuildExecutorOptions,
  context: ExecutorContext
) {
  const { root, sourceRoot } =
    context.projectsConfigurations!.projects[context.projectName!];

  if (!sourceRoot) {
    throw new Error(`${context.projectName} does not have a sourceRoot.`);
  }

  if (!root) {
    throw new Error(`${context.projectName} does not have a root.`);
  }

  const options = normalizeOptions(rawOptions, context.root, sourceRoot, root);

  if (fileExists(`${options.projectRoot}/src/index.ts`)) {
    const compilation = compileWebpack(options, context);
    for await (const result of compilation) {
      if (!result.success) {
        throw new Error(
          `Failed to compile files for project ${context.projectName}.`
        );
      }
    }
  }

  copyForgeAppAssets(options);

  const resources = await processResourceDependencies(
    { ...options, resourcePath: options.customUIPath },
    context
  );
  await patchManifestYml({ ...options, resourcePath: options.customUIPath });
  generatePackageJson(
    context.projectName!,
    context.projectGraph!,
    resources,
    options
  );

  logger.info('Executor ran for build');
  return {
    success: true,
  };
}
