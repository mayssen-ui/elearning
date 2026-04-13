import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationMicroserviceModule } from './notification-microservice.module';
const { Eureka } = require('eureka-js-client');

async function bootstrap() {
  // Create HTTP server
  const httpPort = process.env.HTTP_PORT || 3005;
  const httpApp = await NestFactory.create(NotificationMicroserviceModule);
  // CORS géré par API Gateway - désactivé ici
  // httpApp.enableCors();
  await httpApp.listen(httpPort, '0.0.0.0');
  console.log(`Notification HTTP server is running on port ${httpPort}`);

  // Create TCP microservice
  const tcpPort = process.env.TCP_PORT || 8877;
  const tcpApp = await NestFactory.createMicroservice(
    NotificationMicroserviceModule,
    {
      transport: Transport.TCP as any,
      options: {
        host: '0.0.0.0',
        port: tcpPort,
      },
    },
  );
  await tcpApp.listen();
  console.log(`Notification TCP Microservice is running on port ${tcpPort}`);

  // Register with Eureka
  const eurekaHost = process.env.EUREKA_HOST || 'localhost';
  const eurekaPort = process.env.EUREKA_PORT || '8761';
  const instanceId = process.env.EUREKA_INSTANCE_INSTANCE_ID || 'notification-service-1';
  const hostname = process.env.EUREKA_INSTANCE_HOSTNAME || 'notification-service';
  const ipAddr = process.env.EUREKA_INSTANCE_IP || 'host.docker.internal';

  console.log(`Eureka config: host=${eurekaHost}, port=${eurekaPort}, instanceId=${instanceId}, ipAddr=${ipAddr}`);

  const client = new Eureka({
    instance: {
      app: 'notification-service',
      instanceId: instanceId,
      hostName: hostname,
      ipAddr: ipAddr,
      statusPageUrl: `http://${ipAddr}:${httpPort}/health`,
      healthCheckUrl: `http://${ipAddr}:${httpPort}/health`,
      homePageUrl: `http://${ipAddr}:${httpPort}`,
      port: {
        '$': httpPort,
        '@enabled': 'true',
      },
      vipAddress: 'notification-service',
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    eureka: {
      host: eurekaHost,
      port: eurekaPort,
      servicePath: '/eureka/apps/',
      maxRetries: 10,
      requestRetryDelay: 3000,
    },
  });

  // Delay Eureka registration to ensure HTTP server is ready
  setTimeout(() => {
    client.start(error => {
      if (error) {
        console.error('Eureka registration failed:', error);
      } else {
        console.log('Registered with Eureka successfully');
      }
    });
  }, 5000);
}
bootstrap();
