const fs = require('fs');
const path = require('path');
const merge = require('lodash.merge');
const axios = require('axios');

const Logger = {
  debug: (label, message) => {
    if (
      process.env?.W5MF_TYPES_DEBUG_LEVEL === 'DEBUG' ||
      process.env?.W5MF_TYPES_DEBUG_LEVEL === 'INFO' ||
      process.env?.W5MF_TYPES_DEBUG_LEVEL === 'ERROR'
    ) {
      console.log(`[W5MF-VERSIONS][DEBUG][${label}]`, message);
    }
  },
  info: (label, message) => {
    if (
      process.env?.W5MF_TYPES_DEBUG_LEVEL === 'INFO' ||
      process.env?.W5MF_TYPES_DEBUG_LEVEL === 'ERROR'
    ) {
      console.log(`[W5MF-VERSIONS][INFO][${label}]`, message);
    }
  },
  error: (label, message) => {
    if (
      process.env?.W5MF_TYPES_DEBUG_LEVEL === 'ERROR'
    ) {
      console.log(`[W5MF-VERSIONS][ERROR][${label}]`, message);
    }
  },
}

module.exports = class W5MFVersionsPlugin {
  constructor(options) {
    this.options = options; // url, pathVersionsFile
    Logger.debug('constructor:options', this.options);
  }

  apply(compiler) {
    const url = this.options?.url
    const pathVersionsFile = this.options?.pathVersionsFile || 'src/config/versions.json'

    if (!url) {
      Logger.error('apply', 'Not url for versions file')
      return
    }

    Logger.debug('apply:variables', `
      url: ${url};
      pathVersionsFile: ${pathVersionsFile};
    `);

    const run = (compilation) => {
      Logger.info('run:compilation', compilation);
      const currentVersions = JSON.parse(fs.readFileSync(pathVersionsFile, 'utf8'));

      axios.get(url)
        .then(response => {
          Logger.debug(`run.remote:${url}`, response);
          const remoteVersions = JSON.parse(response.data, 'utf8');
          const versions = JSON.stringify(merge({}, currentVersions, remoteVersions))

          fs.writeFileSync(pathVersionsFile, versions)
        })
        .catch((e) => {
          Logger.error('Error fetching/writing file', e);
        });
    };

    compiler.hooks.beforeCompile.tap("W5MFVersions", (compilation) => {
      run(compilation);
    });
  }
};
