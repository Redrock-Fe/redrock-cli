import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';
import { Command } from 'commander';
import minimist from 'minimist';
import yaml from 'js-yaml';
import prompts from 'prompts';
import { blue, cyan, green, lightGreen, red, reset, yellow } from 'kolorist';

import {
  formatTargetDir,
  isEmpty,
  copy,
  pkgFromUserAgent,
  emptyDir,
  isValidPackageName,
  toValidPackageName,
} from './utils/index';
import config from '../package.json';
import type { GitlabCI } from '../types';

// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606

const argv = minimist<{
  t?: string;
  template?: string;
}>(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

type ColorFunc = (str: string | number) => string;
type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  variants: FrameworkVariant[];
};
type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  customCommand?: string;
};
type Package_manager = {
  name: string;
  display: string;
  color: ColorFunc;
};

const FRAMEWORKS: Framework[] = [
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'custom-create-vue',
        display: 'Customize with create-vue',
        color: green,
        customCommand: 'npm create vue@latest TARGET_DIR',
      },
      {
        name: 'custom-nuxt',
        display: 'Nuxt',
        color: lightGreen,
        customCommand: 'npm exec nuxi init TARGET_DIR',
      },
    ],
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'react-h5',
        display: 'JavaScript-H5',
        color: green,
      },
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'react-ts-h5',
        display: 'TypeScript-H5',
        color: red,
      },
    ],
  },
  {
    name: 'svelte',
    display: 'Svelte',
    color: red,
    variants: [
      {
        name: 'svelte',
        display: 'JavaScript',
        color: yellow,
      },
      {
        name: 'svelte-ts',
        display: 'TypeScript',
        color: blue,
      },
      {
        name: 'custom-svelte-kit',
        display: 'SvelteKit',
        color: red,
        customCommand: 'npm create svelte@latest TARGET_DIR',
      },
    ],
  },
];
const PACKAGE_MANAGERS: Package_manager[] = [
  {
    name: 'npm',
    display: 'npm',
    color: red,
  },
  {
    name: 'yarn',
    display: 'yarn',
    color: blue,
  },
  {
    name: 'pnpm',
    display: 'pnpm',
    color: yellow,
  },
];
const TEMPLATES = FRAMEWORKS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]
).reduce((a, b) => a.concat(b), []);

// console.log(TEMPLATES);

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
};

const defaultTargetDir = 'redrock-project';

async function init(projectName: string) {
  const argTemplate = argv.template || argv.t;
  let targetDir = projectName || defaultTargetDir;
  const getProjectName = () =>
    targetDir === '.' ? path.basename(path.resolve()) : targetDir;
  let result: prompts.Answers<
    | 'projectName'
    | 'overwrite'
    | 'packageName'
    | 'framework'
    | 'variant'
    | 'packageManager'
  >;
  try {
    result = await prompts(
      [
        {
          type: projectName ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            (targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`) +
            ' is not empty. Remove existing files and continue?',
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(red('✖') + ' Operation cancelled');
            }
            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
              ? reset(
                `"${argTemplate}" isn't a valid template. Please choose from below: `
              )
              : reset('Select a framework:'),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color;
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework,
            };
          }),
        },
        {
          type: (framework: Framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: reset('Select a variant:'),
          choices: (framework: Framework) =>
            framework.variants.map((variant) => {
              const variantColor = variant.color;
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name,
              };
            }),
        },
        {
          type: 'select',
          name: 'packageManager',
          message: reset('Select a package manager'),
          choices: PACKAGE_MANAGERS.map((packageManager) => {
            const packageManagerColor = packageManager.color;
            return {
              title: packageManagerColor(
                packageManager.display || packageManager.name
              ),
              value: packageManager,
            };
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        },
      }
    );
  } catch (cancelled: unknown) {
    console.log((cancelled as Error).message);
    return;
  }

  // user choice associated with prompts
  const { framework, overwrite, packageName, variant, packageManager } = result;
  // console.log(packageManager);

  const root = path.join(cwd, targetDir);

  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  // determine template
  const template: string = variant || framework || argTemplate;

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.');

  const { customCommand } =
    FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ??
    {};
  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace('TARGET_DIR', targetDir)
      .replace(/^npm create/, `${pkgManager} create`)
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace('@latest', () => (isYarn1 ? '' : '@latest'))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx` or `yarn dlx`
        if (pkgManager === 'pnpm') {
          return 'pnpm dlx';
        }
        if (pkgManager === 'yarn' && !isYarn1) {
          return 'yarn dlx';
        }
        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return 'npm exec';
      });

    const [command, ...args] = fullCustomCommand.split(' ');
    const { status } = spawn.sync(command, args, {
      stdio: 'inherit',
    });
    process.exit(status ?? 0);
  }

  console.log(`\nScaffolding project in ${root}...`);

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
    `template-${template}`
  );

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8')
  );

  pkg.name = packageName || getProjectName();

  write('package.json', JSON.stringify(pkg, null, 2));

  const doc = yaml.load(
    fs.readFileSync(path.join(templateDir, '.gitlab-ci.yml'), 'utf-8')
  ) as GitlabCI;
  doc.variables.REPO_NAME = packageName || getProjectName();
  //   console.log(doc);
  switch (packageManager.name) {
    case 'yarn': {
      const scripts = [
        'yarn set version stable',
        'yarn install --no-immutable',
        'yarn run build',
      ];
      doc.compile_dev.script = scripts;
      doc.compile_prod.script = scripts;
      break;
    }
    default: {
      const script = [
        `${packageManager.name} install`,
        `${packageManager.name} run build`,
      ];
      doc.compile_dev.script = script;
      doc.compile_prod.script = script;
    }
  }
  write('.gitlab-ci.yml', yaml.dump(doc));

  console.log('\nDone. Now run:\n');
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  switch (packageManager.name) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn dev');
      break;
    default:
      console.log(`  ${packageManager.name} install`);
      console.log(`  ${packageManager.name} run dev`);
      break;
  }
  console.log();
}

//创建progarm的实例，便于多任务执行
const program = new Command();
const version = config.version;
program.version(version, '-v,--version');

program
  .command('create [name]')
  .description('Use redrock-cli to create a new project')
  .action((name) => {
    if (name) {
      console.log(`Your project name is ${name}`);
    }
    init(name).catch((e) => {
      console.log(e);
    });
  });
program.parse();
