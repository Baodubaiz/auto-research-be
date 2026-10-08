pipeline {
  agent {
    label 'docker-node'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  environment {
    APP_NAME = 'auto-research-be'
    IMAGE_NAME = 'auto-research-be'
    CONTAINER_NAME = 'auto-research-be'
    COMPOSE_FILE = 'docker-compose.prod.yml'
    HOST_PORT = '3001'
    CONTAINER_PORT = '3001'
  }

  stages {
    stage('Checkout') {
      steps {
        timeout(time: 30, unit: 'MINUTES') {
          checkout([
            $class: 'GitSCM',
            branches: scm.branches,
            userRemoteConfigs: scm.userRemoteConfigs,
            extensions: [
              [$class: 'CloneOption', shallow: true, depth: 1, noTags: true, timeout: 30]
            ]
          ])
        }
      }
    }

    stage('Install') {
      steps {
        sh 'npm install'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Build App') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build \
            -t ${IMAGE_NAME}:${BUILD_NUMBER} \
            -t ${IMAGE_NAME}:latest \
            .
        '''
      }
    }

    stage('Deploy With Docker Compose') {
      when {
        expression {
          return env.BRANCH_NAME == 'main' ||
            env.GIT_BRANCH in ['origin/main', 'main']
        }
      }
      steps {
        withCredentials([file(credentialsId: 'auto-research-be-env', variable: 'ENV_FILE')]) {
          sh '''
            set -eu
            cp "${ENV_FILE}" .env.production
            chmod 600 .env.production
            trap 'rm -f .env.production' EXIT

            missing_env=0
            for required_var in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB; do
              if ! grep -Eq "^${required_var}=.+" .env.production; then
                echo "Missing required variable in Jenkins credential auto-research-be-env: ${required_var}"
                missing_env=1
              fi
            done
            if [ "${missing_env}" -ne 0 ]; then
              exit 1
            fi

            docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
            docker compose \
              -p ${APP_NAME} \
              -f ${COMPOSE_FILE} \
              --env-file .env.production \
              up -d --no-build
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'docker image prune -f --filter "dangling=true" || true'
    }
  }
}
