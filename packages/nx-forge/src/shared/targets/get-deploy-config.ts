import { TargetConfiguration } from '@nx/devkit';

interface GetDeployConfigOptions {
  outputPath: string;
}
export function getDeployConfig(
  options: GetDeployConfigOptions
): TargetConfiguration {
  return {
    executor: '@toolsplus/nx-forge:deploy',
    options: {
      outputPath: options.outputPath,
    },
  };
}
