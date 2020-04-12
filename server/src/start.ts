import { ExampleServer } from "./ExampleServer";
import "reflect-metadata";

const exampleServer = new ExampleServer();
exampleServer.start(3000);
