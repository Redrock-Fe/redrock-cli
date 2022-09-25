export type GitlabCI = {
    variables: {
        REPO_NAME: string
    }
    stages: {
        setup: string
        compile: string
        imagebuild: string
        deploy: string
    }
    compile_dev: {
        image: string
        stage: 'setup' | 'compile' | 'imagebuild' | 'deploy'
        tags: ['redrock-fe']
        script: string[]
        artifacts: {
            expire_in: string
            paths: string[]
        }
        only: string[]
    }

    compile_prod: {
        image: string
        stage: 'setup' | 'compile' | 'imagebuild' | 'deploy'
        tags: ['redrock-fe']
        script: string[]
        artifacts: {
            expire_in: string
            paths: string[]
        }
        only: string[]
    }

    image_dev: {
        image: string
        stage: 'setup' | 'compile' | 'imagebuild' | 'deploy'
        tags: ['redrock-fe']
        script: string[]
        only: string[]
    }

    image_prod: {
        image: string
        stage: 'setup' | 'compile' | 'imagebuild' | 'deploy'
        tags: ['redrock-fe']
        script: string[]
        only: string[]
    }

    deploy_dev:
    {
        image: string
        stage: 'setup' | 'compile' | 'imagebuild' | 'deploy'
        tags: ['redrock-fe']
        variables: {
            NAMESPACE: 'fe-dev'
            VERSION: string
        }
        script: string[]
        environment: {
            name: string
            url: string
        }
        only: string[]
    }

    deploy_prod: {
        image: string
        stage: 'setup' | 'compile' | 'imagebuild' | 'deploy'
        tags: ['redrock-fe']
        variables: {
            NAMESPACE: 'fe-prod'
            VERSION: string
        }
        script: string[]
        environment: {
            name: string
            url: string
        }
        only: string[]
    }
}