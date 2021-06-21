# Technomunk's Github Pages

A place to showcase some of personal projects and abilities.

## Disclaimer

The webpage does not work as intended on Internet Explorer. As this is a fun
project it uses more advanced functionalities of modern browsers. Additionally
some browsers do not allow loading additional files when viewing a local
webpage. The `index.html` uses asynchronous workers to compute the mandelbrot
set in the background, relying on loading the script file. To run the page
locally supply `--allow-file-access-from-files` command line argument to your
browser.

## Building

The project uses [npm](https://www.npmjs.com/) to build the project. Use
`npm run build` to build the static webpages.
