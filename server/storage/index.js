import { config } from "../config/env.js";
import { LocalStorage } from "./LocalStorage.js";

export const localStorage = new LocalStorage(config.pastaDados);
