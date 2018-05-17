# Building Javascript

In order to get javascript building, you first need to install the node
modules (with `npm install` in this directory), and get
[webpack](https://webpack.github.io) with `npm install -g webpack`.

For every module not found error, run `npm install {module-name}`

`npm install less-loader`

`npm install raw-loader`

`npm install async`

To build js once, just run `webpack` in this directory.

To start the watching builder (meaning the files will be rebuilt whenever a
file changes), run `webpack --watch`. *RECOMMENDED*

## Why would we want this?
Building our javascript comes with lots of advantages:

- es6+ syntax (check out [babeljs](https://babeljs.io/docs/learn-es6/) for
    info on why this is awesome)
- module isolation: variables are no longer global, so declarations from one
    file don't pollute the namespace of another
- optional minification: with this system in place, we can easily turn on
    `uglify` to minify our JS and reduce the load-time of our pages

## What if I don't touch the javascript?

The built javascript is checked into the git repository (under public/build),
so if you don't touch the javascript, you don't have to worry about rebuilding
anything.

## What if there's a merge conflict in the compiled files?

You can just do `git checkout --ours -- public/build` and it will clear the
merge conflicts. Make sure you resolve the other js conflicts if there are
any, and then run `webpack` again, so that the final compiled version you
commit has an up-to-date version of the compiled files.

