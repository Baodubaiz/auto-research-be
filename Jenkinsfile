pipeline {
  agent {
    label 'docker-node'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_NAME = 'auto-research-be'
    IMAGE_NAME = 'auto-research-be'
    CONTAINER_NAME = 'auto-research-be'
    HOST_PORT = '3001'
    CONTAINER_PORT = '3001'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
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

    stage('Deploy Container') {
      when {
        expression {
          return env.BRANCH_NAME == 'main' ||
            env.GIT_BRANCH in ['origin/main', 'main']
        }
      }
      steps {
        withCredentials([file(credentialsId: 'auto-research-be-env', variable: 'ENV_FILE')]) {
          sh '''
            docker rm -f ${CONTAINER_NAME} || true
            docker run -d \
              --name ${CONTAINER_NAME} \
              --restart unless-stopped \
              --env-file ${ENV_FILE} \
              -e NODE_ENV=production \
              -e IS_LOCAL=false \
              -e PORT=${CONTAINER_PORT} \
              -p ${HOST_PORT}:${CONTAINER_PORT} \
              ${IMAGE_NAME}:${BUILD_NUMBER}
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
