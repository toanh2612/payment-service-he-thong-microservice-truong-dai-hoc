export class SystemResponse {
	private result: any = null;
	constructor(result: any) {
		this.result = result || this.result;
		return this;
	}
}
