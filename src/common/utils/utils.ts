import { v4 } from "uuid";
import { QueryCommonDto } from "../dto/QueryCommon.dto";
const _ = require("lodash");

export const generateRandomCode = (): string => {
	const now = new Date();
	const randomCode = v4().split("-")[0];

	return `${now.getFullYear()}${
		now.getMonth() + 1
	}${now.getDate()}${randomCode}`;
};

export const parseSkip = (page: number = 1, perPage: number = 20) => {
	return ((page >= 1 ? page : 1) - 1) * perPage;
};

export const parseFilter = (filter: any, keys: any = []) => {
	try {
		filter = typeof filter === "object" ? filter : JSON.parse(filter);
		keys = typeof filter === "object" ? Object.keys(filter) : [];
		filter = _.pick(filter, keys);
		// filter = _.pickBy(filter, _.identity);

		return filter;
	} catch (error) {
		return {};
	}
};

export const parseOrder = (order) => {
	return typeof order === "object" ? order : JSON.parse(order);
};

export const parseQuery = (query: QueryCommonDto<any>) => {
	return {
		filter: parseFilter(query.filter || {}),
		filterOptions: parseFilter(query.filterOptions || {}),
		order: parseOrder(query.order || {}),
		page: Number(query.page || 1),
		perPage: Number(query.perPage || 20),
	};
};

export const addWhere = (
	query: any,
	filter: any = {},
	relativeFields: string[] = []
): any => {
	Object.keys(filter).forEach((entity) => {
		Object.keys(filter[entity]).map((field) => {
			if (relativeFields.indexOf(`${entity}.${field}`) > -1) {
				const condition = `ilike '%' || :value || '%'`;
				query.andWhere(`unaccent(${entity}.${field}) ${condition}`, {
					value: removeWhiteSpace(
						toNonAccentVietnamese(filter[entity][field].toLowerCase())
					),
				});
			} else {
				const value =
					typeof filter[entity][field] === "string"
						? `'${filter[entity][field]}'`
						: `${filter[entity][field]}`;
				query.andWhere(`${entity}.${field} = ${value}`);
			}
		});
	});

	return query;
};

export const removeWhiteSpace = (str: string) => {
	return str.replace(/(\s\s\s*)/g, " ").trim();
	// return str.replace(/(\s{2,})/gmi, " ");
};

export function toNonAccentVietnamese(str) {
	str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	str = str.replace(/Đ/g, "D");
	str = str.replace(/đ/g, "d");
	// Some system encode vietnamese combining accent as individual utf-8 characters
	str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
	str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
	return str;
}

export const addOrderBy = (query: any, orders: any = []) => {
	Object.keys(orders).map((alias) => {
		Object.keys(orders[alias]).map((field) => {
			// console.log(orders[alias]);
			query.orderBy(`${alias}.${field}`, orders[alias][field]);
		});
	});

	return query;
};

export function PromiseSetTimeout(timeout, callback) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Promise timed out after ${timeout} ms`));
		}, timeout);
		callback(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			}
		);
	});
}
