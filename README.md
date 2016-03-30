# csCOP
Open Source Common Operational Picture web application for public safety and security, based on csWeb.

## Installation

csCOP currently depends on a branch of csWeb (new redesign), so you need to install that first and link to it.
See [here](https://github.com/TNOCS/csWeb/wiki/Installation-checklist) for a full list of pre-requisites to install [csWeb](https://github.com/TNOCS/csWeb). Please note that, after installation of csWeb, you need to create symbolic links to the npm and bower distribution (in the project root, `bower link` and in `out/csServerComponents`, `npm link`).

After that, it is simple:
```
git clone https://github.com/DRIVER-EU/csCOP.git
```

Optionally, install some prerequisites:
```
npm install -g typings typescript bower gulp 
```

In the project's website folder, run
```
npm install && npm link csweb
typings install
cd public
bower install && bower link csweb
cd ..
```
Finally, compile the project and run it:
```
tsc
node server.js
```
