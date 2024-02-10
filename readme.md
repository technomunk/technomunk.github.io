# Technomunk's Github Pages

A place to showcase some of personal projects and abilities.

## Building

Instructions for building the website.

### 🔗 Requirements

- [nodejs](https://nodejs.org/en/download)
- [yarn](https://yarnpkg.com/)
<!-- - [Rust](https://www.rust-lang.org/tools/install) -->
<!-- - [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) -->
<!-- - cargo-generate: `cargo install cargo-generate` -->

### 🛠 First time setup

<!-- - Initialize dependency submodules: `git submodule init` -->
<!-- - Update dependency submodules: `git submodule update` -->
<!-- - Build wasm dependencies: `git submodule foreach wasm-pack build` -->
- Install JS dependencies: `yarn install`
<!-- - Link p2ds assets folder: `ln -s submodules/p2ds/assets docs/assets` -->

### 📨 Build static content

```sh
yarn build
```

## Local development

```sh
yarn dev
```

Goto http://localhost:4321
