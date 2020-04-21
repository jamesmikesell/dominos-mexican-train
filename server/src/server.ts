import * as bodyParser from 'body-parser';
import * as controllers from './controllers';
import { Server } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import cookieParser from 'cookie-parser';
import express from 'express';
import compression from 'compression';

export class DominoServer extends Server {

  private readonly SERVER_STARTED = 'Example server started on port: ';

  constructor() {
    super(true);
    this.app.use(compression());
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(express.static('src/public'));
    this.app.use("/app/**", (req, res) => res.sendFile(`${__dirname}/public/index.html`));
    this.setupControllers();
  }

  private setupControllers(): void {
    const ctlrInstances = [];
    for (const name in controllers) {
      if (controllers.hasOwnProperty(name)) {
        const controller = (controllers as any)[name];
        ctlrInstances.push(new controller());
      }
    }
    super.addControllers(ctlrInstances);
  }

  public start(port: number): void {
    this.app.listen(port, () => {
      Logger.Imp(this.SERVER_STARTED + port);
    });
  }
}

