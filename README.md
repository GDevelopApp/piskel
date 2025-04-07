# GDevelop's embedded Piskel

Forked from official Piskel repository to be used in GDevelop.
As well as added features from blurymind repository's piskel-plus branch (https://github.com/blurymind/piskel/tree/piskel-plus)

## Development

- `npm i`
- `npm run dev` to start a development server (which does `grunt play`)
- `grunt serve` to test the built package.
- `grunt build` to build the package

Useful links:

- [wiki](https://github.com/piskelapp/piskel/wiki)

## Update GDevelop's used version

- `grunt build` to build the package
- zip the content of the `dest/prod` folder and rename it to `piskel-editor.zip`
- make the zip available in an existing release on Github
- update the `import-zipped-external-editors` command in package.json with the new version and do a `npm i`
- note down the new folder sha and update the command

## License

Copyright 2017 Julian Descottes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
