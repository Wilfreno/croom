import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const environment = dotenvExpand.expand(dotenv.config());

export default environment;
