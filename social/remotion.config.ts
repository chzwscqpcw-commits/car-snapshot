import path from "node:path";
import { Config } from "@remotion/cli/config";
import { withSiteAlias } from "./src/webpack";

// Remotion Studio / CLI settings for the social clips. The programmatic
// renderer (src/cli/render.ts) sets the same options explicitly.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPublicDir(path.join(__dirname, "public"));
Config.setEntryPoint(path.join(__dirname, "src", "index.ts"));
Config.overrideWebpackConfig(withSiteAlias);
