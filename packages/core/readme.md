# redrock-cli/core

## Quick Overview⭐️

```sh
npm i redrock-cli
npx redrock create my-app /npx redrock-cli create my-app
```

If you've previously installed `redrock-cli` globally via `npm install -g redrock-cli`, you should ensure that npx always uses the latest version.

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

## Creating an App For Redrock🥳

To create a new app, you may choose one of the following methods:

### npx

```sh
npm install redrock-cli
npx redrock create my-app(your project name)
```

_([npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner tool that comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f))_

### Global

```sh
npm install redrock-cli -g
redrock create my-app(your project name)
```

_`npm init <initializer>` is available in npm 6+_

Currently supported template presets include:

- `vue`
- `vue-ts`
- `react`
- `react-h5`
- `react-ts`
- `react-ts-h5`
- `svelte`
- `svelte-ts`

## License

MIT License
