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
      let link = release.binary_link
      let type = release.binary_type

      let formattedArch = architecture;

      if (architecture == "x64") {
        formattedArch = "x86_64"
      }

      if (type == "jre") {
        formattedType = "-jre-"
      } else {
        formattedType = ""
      }

      if (architecture == "arm") {
        console.log("skipping on arm as not supported right now")
      } else {

        var options = {
          method: 'GET',
          url: `https://adoptopenjdk.jfrog.io/adoptopenjdk/api/storage/rpm/centos/7/${formattedArch}/Packages/adoptopenjdk-${major_version}-${jvm}${formattedType}-${version.replace(/_/g, ".")}-1.${formattedArch}.rpm`,
        };

        request(options, function(error, response, body) {
          if (error) throw new Error(error);

          if (response.statusCode == 404) {

            let properties = `VERSION=${version}\n` +
              `JVM=${jvm}\n` +
              `ARCHITECTURE=${architecture}\n` +
              `MAJOR_VERSION=${major_version}\n` +
              `LINK=${link}\n` +
              `TYPE=${type}`

            fs.writeFile(`${architecture}-${jvm}-${version}.properties`, properties, (err) => {
              // throws an error, you could also catch it here
              if (err) throw err;
            });
          }
        });
      }
    }
  });
}
