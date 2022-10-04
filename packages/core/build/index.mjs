import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";
import { Command } from "commander";
import minimist from "minimist";
import yaml from "js-yaml";
import prompts from "prompts";
import { green, yellow, blue, lightGreen, cyan, red, reset } from "kolorist";

function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, "");
}
function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}
function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  );
}
function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z0-9-~]+/g, "-");
}
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}
function isEmpty(path2) {
  const files = fs.readdirSync(path2);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}
function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === ".git") {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return void 0;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

const name = "redrock-cli";
const version$1 = "0.1.5";
const license = "MIT";
const type = "module";
const author = "Nirvana-Jie(Wenjie Zeng)";
const contributors = [
  {
    name: "Lomirus",
    email: "lomirus.dev@protonmail.com",
    url: "https://lomirus.github.io/",
  },
  {
    name: "chovrio",
    email: "1480733667@qq.com",
    url: "https://www.chovrio.club/hexo/",
  },
];
const bin = {
  "redrock-cli": "index.js",
  redrock: "index.js",
};
const description = "core module";
const main = "index.js";
const scripts = {
  dev: "unbuild --stub",
  test: "pnpm run dev && npm link",
  build: "unbuild",
  release: "pnpm run build && npm publish",
};
const files = ["index.js", "template-*", "build"];
const engines = {
  node: "^14.18.0 || >=16.0.0",
};
const keywords = ["redrock-fe", "core"];
const dependencies = {
  "@types/js-yaml": "^4.0.5",
  commander: "^9.4.0",
  "cross-spawn": "^7.0.3",
  "js-yaml": "^4.1.0",
  kolorist: "^1.6.0",
  minimist: "^1.2.6",
  prompts: "^2.4.2",
};
const config = {
  name: name,
  version: version$1,
  license: license,
  type: type,
  author: author,
  contributors: contributors,
  bin: bin,
  description: description,
  main: main,
  scripts: scripts,
  files: files,
  engines: engines,
  keywords: keywords,
  dependencies: dependencies,
};

const argv = minimist(process.argv.slice(2), { string: ["_"] });
const cwd = process.cwd();
const FRAMEWORKS = [
  {
    name: "vue",
    display: "Vue",
    color: green,
    variants: [
      {
        name: "vue",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "vue-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "custom-create-vue",
        display: "Customize with create-vue",
        color: green,
        customCommand: "npm create vue@latest TARGET_DIR",
      },
      {
        name: "custom-nuxt",
        display: "Nuxt",
        color: lightGreen,
        customCommand: "npm exec nuxi init TARGET_DIR",
      },
    ],
  },
  {
    name: "react",
    display: "React",
    color: cyan,
    variants: [
      {
        name: "react",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "react-h5",
        display: "JavaScript-H5",
        color: green,
      },
      {
        name: "react-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "react-ts-h5",
        display: "TypeScript-H5",
        color: red,
      },
    ],
  },
  {
    name: "svelte",
    display: "Svelte",
    color: red,
    variants: [
      {
        name: "svelte",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "svelte-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "custom-svelte-kit",
        display: "SvelteKit",
        color: red,
        customCommand: "npm create svelte@latest TARGET_DIR",
      },
    ],
  },
];
const PACKAGE_MANAGERS = [
  {
    name: "npm",
    display: "npm",
    color: red,
  },
  {
    name: "yarn",
    display: "yarn",
    color: blue,
  },
  {
    name: "pnpm",
    display: "pnpm",
    color: yellow,
  },
];
const TEMPLATES = FRAMEWORKS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]
).reduce((a, b) => a.concat(b), []);
const renameFiles = {
  _gitignore: ".gitignore",
};
const defaultTargetDir = "redrock-project";
async function init(projectName) {
  const argTemplate = argv.template || argv.t;
  let targetDir = projectName || defaultTargetDir;
  const getProjectName = () =>
    targetDir === "." ? path.basename(path.resolve()) : targetDir;
  let result;
  try {
    result = await prompts(
      [
        {
          type: projectName ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm",
          name: "overwrite",
          message: () =>
            (targetDir === "."
              ? "Current directory"
              : `Target directory "${targetDir}"`) +
            " is not empty. Remove existing files and continue?",
        },
        {
          type: (_, { overwrite: overwrite2 }) => {
            if (overwrite2 === false) {
              throw new Error(red("\u2716") + " Operation cancelled");
            }
            return null;
          },
          name: "overwriteChecker",
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || "Invalid package.json name",
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
          name: "framework",
          message:
            typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `
                )
              : reset("Select a framework:"),
          initial: 0,
          choices: FRAMEWORKS.map((framework2) => {
            const frameworkColor = framework2.color;
            return {
              title: frameworkColor(framework2.display || framework2.name),
              value: framework2,
            };
          }),
        },
        {
          type: (framework2) =>
            framework2 && framework2.variants ? "select" : null,
          name: "variant",
          message: reset("Select a variant:"),
          choices: (framework2) =>
            framework2.variants.map((variant2) => {
              const variantColor = variant2.color;
              return {
                title: variantColor(variant2.display || variant2.name),
                value: variant2.name,
              };
            }),
        },
        {
          type: "select",
          name: "packageManager",
          message: reset("Select a package manager"),
          choices: PACKAGE_MANAGERS.map((packageManager2) => {
            const packageManagerColor = packageManager2.color;
            return {
              title: packageManagerColor(
                packageManager2.display || packageManager2.name
              ),
              value: packageManager2,
            };
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red("\u2716") + " Operation cancelled");
        },
      }
    );
  } catch (cancelled) {
    console.log(cancelled.message);
    return;
  }
  const { framework, overwrite, packageName, variant, packageManager } = result;
  const root = path.join(cwd, targetDir);
  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  const template = variant || framework || argTemplate;
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";
  const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.");
  const { customCommand } =
    FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ??
    {};
  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace("TARGET_DIR", targetDir)
      .replace(/^npm create/, `${pkgManager} create`)
      .replace("@latest", () => (isYarn1 ? "" : "@latest"))
      .replace(/^npm exec/, () => {
        if (pkgManager === "pnpm") {
          return "pnpm dlx";
        }
        if (pkgManager === "yarn" && !isYarn1) {
          return "yarn dlx";
        }
        return "npm exec";
      });
    const [command, ...args] = fullCustomCommand.split(" ");
    const { status } = spawn.sync(command, args, {
      stdio: "inherit",
    });
    process.exit(status ?? 0);
  }
  console.log(`
Scaffolding project in ${root}...`);
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    `template-${template}`
  );
  const write = (file, content) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, "package.json"), "utf-8")
  );
  pkg.name = packageName || getProjectName();
  write("package.json", JSON.stringify(pkg, null, 2));
  const doc = yaml.load(
    fs.readFileSync(path.join(templateDir, ".gitlab-ci.yml"), "utf-8")
  );
  doc.variables.REPO_NAME = packageName || getProjectName();
  switch (packageManager.name) {
    case "yarn": {
      const scripts = [
        "yarn set version stable",
        "yarn install --no-immutable",
        "yarn run build",
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
  write(".gitlab-ci.yml", yaml.dump(doc));
  console.log("\nDone. Now run:\n");
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  switch (packageManager.name) {
    case "yarn":
      console.log("  yarn");
      console.log("  yarn dev");
      break;
    default:
      console.log(`  ${packageManager.name} install`);
      console.log(`  ${packageManager.name} run dev`);
      break;
  }
  console.log();
}
const program = new Command();
const version = config.version;
program.version(version, "-v,--version");
program
  .command("create [name]")
  .description("Use redrock-cli to create a new project")
  .action((name) => {
    if (name) {
      console.log(`Your project name is ${name}`);
    }
    init(name).catch((e) => {
      console.log(e);
    });
  });
program.parse();
