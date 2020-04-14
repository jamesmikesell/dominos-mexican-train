import { DominoServer } from "./server";
import "reflect-metadata";

const dominoServer = new DominoServer();
dominoServer.start(3000);
