package eslintplugin

import (
  "alpha.dagger.io/dagger"
  "alpha.dagger.io/os"
  "alpha.dagger.io/docker"
  "alpha.dagger.io/js/yarn"
)

defaults: {
  image: string & dagger.#Input
  source: dagger.#Artifact & dagger.#Input
}

build: yarn.#Package & {
  source: defaults.source,
  buildDir: "dist",
  script: "build"
}

check_and_lint: os.#Container & {
  image: docker.#Pull & {
    from: defaults.image
  }
  copy: "/plugin": from: build.source
  dir: "/plugin"
  command: """
    yarn link &&\\
    yarn link "@logicalhq/eslint-plugin" &&\\
    yarn typecheck &&\\
    yarn fmt:check &&\\
    yarn lint &&\\
    yarn lint:spelling
  """
}

security_scan: os.#Container & {
  image: docker.#Pull & {
    from: defaults.image
  }
  copy: "/plugin": from: build.source
  dir: "/plugin",
  command: "npx audit-ci"
}

test: os.#Container & {
  image: docker.#Pull & {
    from: defaults.image
  }
  copy: "/plugin": from: build.source
  dir: "/plugin"
  command: """
    yarn &&\\
    yarn test --coverage &&\\
    yarn test:e2e
  """
}
