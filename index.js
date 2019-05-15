const request = require("request");
const glob = require("glob");
const fs = require("fs");

glob("*.properties", function(er, files) {
  for (let file of files) {
    fs.unlinkSync(file)
  }
});

const java_versions = [
  "openjdk8",
  "openjdk11",
  "openjdk12"
]

for (let java_version of java_versions) {

  let options = {
    method: 'GET',
    url: `https://api.adoptopenjdk.net/v2/latestAssets/releases/${java_version}`,
    qs: {
      os: 'linux',
      heap_size: 'normal'
    },
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);
    for (let release of JSON.parse(body)) {
      let version = release.version_data.openjdk_version
      let jvm = release.openjdk_impl
      let architecture = release.architecture
      let major_version = release.version
      let link = release.release_link

      let properties = `VERSION=${version}\n` +
        `JVM=${jvm}\n` +
        `ARCHITECTURE=${architecture}\n` +
        `MAJOR_VERSION=${major_version}\n` +
        `LINK=${link}`

      fs.writeFile(`${architecture}-${jvm}-${version}.properties`, properties, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
      });
    }
  });
}
