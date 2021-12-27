package eslintplugin

import (
  "alpha.dagger.io/dagger"
  "alpha.dagger.io/os"
  "alpha.dagger.io/docker"
)

defaults: {
  image: string & dagger.#Input
  source: dagger.#Artifact & dagger.#Input
}

build: os.#Container & {
  image: docker.#Pull & {
    from: defaults.image
  }
  copy: "/plugin": from: defaults.source
  dir: "/plugin"
  command: """
    yarn --frozen-lockfile &&\\
    yarn build
  """
}

check_and_lint: os.#Container & {
  image: build
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
  image: build
  dir: "/plugin",
  command: "npx audit-ci"
}

test: os.#Container & {
  image: build
  dir: "/plugin"
  command: """
    yarn test --coverage &&\\
    yarn test:e2e
  """
}
