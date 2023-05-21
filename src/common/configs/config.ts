import * as dotenv from "dotenv";
const path = require("path");
const fs = require("fs");

if (
	fs.existsSync(
		path.resolve(process.cwd(), `${process.env.NODE_ENV || ""}.env`)
	)
) {
	dotenv.config({
		path: path.resolve(process.cwd(), `${process.env.NODE_ENV || ""}.env`),
	});
} else {
	dotenv.config({ path: path.resolve(process.cwd(), `.env`) });
}

type config = {
	[key: string]: string | any;
};

export const CONFIG: config = {
	...process.env,
	CLIENT_MODULE: {
		REDIS: "REDIS_CLIENT",
	},
};

export const CONFIGURATION: any = () => ({
	...CONFIG,
});
